import { Selector } from './selector.class';

export class SelectorString {
  constructor(readonly selector: Selector, readonly text: string) {}

  render(): number {
    process.stdout.write(this.text);
    return this.text.length;
  }
}
