import { Selector } from './selector.class';

const BOLD = '\u001b[1m';
const INVERSE = '\u001b[7m';
const RESET = '\u001b[0m';
const UNDERSCORE = '\u001b[4m';

export class SelectorOption {
  protected shortcut?: number;

  constructor(readonly selector: Selector, readonly text: string, readonly index: number) {}

  render(final?: boolean): number {
    const selected = this.selector.selectedIndex === this.index;
    const pre1 = (selected ? '' : UNDERSCORE) + (final && selected ? INVERSE : '');
    const pre2 = (!final && selected ? INVERSE : '');
    const chars = this.text.split('');
    if (!final && this.shortcut != null) {
      chars[this.shortcut] = BOLD + chars[this.shortcut] + RESET + pre1 + (this.shortcut ? pre2 : '');
    }
    const out = `${pre1}${chars.shift()}${pre2}${chars.join('')}${RESET}`;
    process.stdout.write(out);
    return this.text.length;
  }

  validateShortcut(shortcuts: { [char: string]: number }): void {
    const shortcut = Object.keys(shortcuts).find((key) => shortcuts[key] === this.index);
    if (shortcut != null) {
      if (!shortcut) {
        delete shortcuts[shortcut];
      } else {
        const pos = this.text.toLowerCase().indexOf(shortcut);
        if (pos >= 0) {
          this.shortcut = pos;
        } else {
          delete shortcuts[shortcut];
        }
      }
    }
  }
}
