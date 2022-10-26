import { emitKeypressEvents } from 'readline';
import { exiters } from './exiters';
import { SelectionResult } from './selection-result.type';
import { SelectorOption } from './selector-option.class';
import { SelectorString } from './selector-string.class';

const shortcutRx = /[A-Za-zÀ-ÖØ-öø-ÿ0-9\.,\/\?\<\>;:'"\[\]\\\|\~\`\!\@\#\$\%\&\*\(\)\-_\+=]/;

/**
 * Selector
 */
export class Selector {
  protected readonly options: SelectorOption[] = [];
  protected readonly parts: (SelectorOption | SelectorString)[] = [];
  protected readonly shortcuts: { [char: string]: number } = {};

  protected _selectedIndex!: number;
  protected cursorOffset = 0;
  protected finishCb?: (error?: Error) => void;

  constructor(prompt: string) {
    const chars = String(prompt).split('');
    let currentStr = '';
    let selectable = false;
    let selected = false;
    for (let i = 0; i <= chars.length; i++) {
      const char = chars[i];
      const next = chars[i + 1];
      const prev = chars[i - 1];
      if (char === '\\' && (next === '{' || next === '}' || (selectable && (next === '^' || next === '*')))) {
        currentStr += next;
        i++;
      } else if (!selectable) {
        if (char === '{' || !char) {
          selectable = true;
          if (currentStr) {
            this.parts.push(new SelectorString(this, currentStr));
            currentStr = '';
          }
        } else {
          currentStr += char;
        }
      } else { // selectable
        if (char === '}' || !char) {
          if (currentStr) {
            const option = new SelectorOption(this, currentStr, this.options.length);
            option.validateShortcut(this.shortcuts);
            this.options.push(option);
            this.parts.push(option);
            if (selected && this._selectedIndex == null) {
              this._selectedIndex = option.index;
            }
          }
          currentStr = '';
          selectable = selected = false;
        } else if (char === '*' && prev === '{') {
          selected = true;
        } else if (char === '^') {
          if (next.match(shortcutRx) && this.shortcuts[next.toLowerCase()] == null) {
            this.shortcuts[next.toLowerCase()] = this.options.length;
          }
        } else {
          currentStr += char;
        }
      }
    }
    if (this._selectedIndex == null) {
      this.selectedIndex = this.lastIndex;
    } else {
      this.render();
    }
  }

  get lastIndex(): number {
    return this.options.length - 1;
  }

  get selectedIndex(): number {
    return this._selectedIndex;
  }

  set selectedIndex(index: number) {
    index = Math.round(+index);
    index = Number.isNaN(index) ? this.lastIndex : index;
    index = index > this.lastIndex ? this.lastIndex : index;
    index = index < 0 ? 0 : index;
    if (index !== this._selectedIndex) {
      this._selectedIndex = index;
      this.render();
    }
  }

  async listen(): Promise<SelectionResult> {
    return new Promise((resolve) => {
      emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.on('keypress', this.listener);
      this.finishCb = (): void => {
        const { index, text } = this.options[this.selectedIndex];
        resolve({ index, text });
      };
    });
  }

  protected finish(): void {
    this.render(true);
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdin.off('keypress', this.listener);
    process.stdout.write('\n');
    this.finishCb?.();
  }

  protected listener = (char: string, event: { sequence: string; name: string; ctrl: boolean; meta: boolean; shift: boolean }): void => {
    const { sequence } = event;
    if (Object.keys(exiters).includes(sequence)) {
      console.error('\n' + exiters[sequence as keyof typeof exiters]);
      process.exit(1);
    } else if (char === '\r' || char === '\n') {
      this.finish();
    } else if (sequence === '\u001b[D' || sequence === '\u001b[Z') {
      this.selectedIndex = this.selectedIndex - 1; // left, shift+tab
    } else if (sequence === '\u001b[1;5D' || sequence === '\u001b[1;3D' || sequence === '\u001b[H') {
      this.selectedIndex = 0; // ctrl+left, alt+left, home
    } else if (sequence === '\u001b[C' || sequence === '\t') {
      this.selectedIndex = this.selectedIndex + 1; // right, tab
    } else if (sequence === '\u001b[1;5C' || sequence === '\u001b[1;3C' || sequence === '\u001b[F') {
      this.selectedIndex = this.lastIndex; // ctrl+right, alt+right, end
    } else if (sequence && this.shortcuts[sequence.toLowerCase()] != null) {
      this.selectedIndex = this.shortcuts[sequence.toLowerCase()];
      this.finish();
    }
  };

  protected render(final?: boolean): void {
    if (this.cursorOffset > 0) {
      process.stdout.write(`\u001b[${this.cursorOffset}D`);
      this.cursorOffset = 0;
    }
    let offset = 0;
    this.parts.forEach((part) => {
      if (part instanceof SelectorOption && this.selectedIndex === part.index) {
        offset = this.cursorOffset;
      }
      this.cursorOffset += part.render(final);
    });
    if (offset < this.cursorOffset) {
      process.stdout.write(`\u001b[${this.cursorOffset - offset}D`);
      this.cursorOffset = offset;
    }
  }
}
