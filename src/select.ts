import { SelectionResult } from './selection-result.type';
import { Selector } from './selector.class';

/**
 * Async console select
 * @param prompt ex: 'Need you to say {*^yes} or {^no}'
 * @returns promise of a selected index
 */
export async function select(prompt: string): Promise<SelectionResult> {
  return (new Selector(prompt)).listen();
}

export const ttySelect = select;
export default select;
