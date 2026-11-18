import { MatkaRulesError } from './errors';
import {
  ankOf,
  assertDigit,
  assertPanna,
  cutDigit,
  DIGITS,
  type Digit,
} from './panna';

export interface OpenResult {
  phase: 'open';
  openPanna: string;
  openAnk: Digit;
  line: string;
}

export interface FullResult {
  phase: 'full';
  openPanna: string;
  closePanna: string;
  openAnk: Digit;
  closeAnk: Digit;
  jodi: string;
  line: string;
}

export type MarketResult = OpenResult | FullResult;

const FULL_LINE = /^(\d{3})-(\d{2})-(\d{3})$/;
const OPEN_LINE = /^(\d{3})-(\d)$/;

export function formatJodi(openAnk: Digit, closeAnk: Digit): string {
  return `${openAnk}${closeAnk}`;
}

export function assertJodi(value: string): string {
  if (!/^\d{2}$/.test(value)) {
    throw new MatkaRulesError('A jodi is two digits from 00 to 99.');
  }
  return value;
}

export function isRedJodi(jodi: string): boolean {
  const canonical = assertJodi(jodi);
  const left = Number(canonical[0]) as Digit;
  const right = Number(canonical[1]) as Digit;
  return left === right || cutDigit(left) === right;
}

/** Ten twins and ten cut pairs. */
export const RED_JODIS: readonly string[] = DIGITS.flatMap((digit) => [
  `${digit}${digit}`,
  `${digit}${cutDigit(digit)}`,
]).sort();

/**
 * Swap either digit, the other, or both for its cut, then keep both orders.
 * Distinct pairs expand to 8. Twin and cut-pair families collapse to 4.
 */
export function jodiFamily(jodi: string): readonly string[] {
  const canonical = assertJodi(jodi);
  const left = Number(canonical[0]) as Digit;
  const right = Number(canonical[1]) as Digit;
  const family = new Set<string>();

  for (const openAnk of [left, cutDigit(left)]) {
    for (const closeAnk of [right, cutDigit(right)]) {
      family.add(formatJodi(openAnk, closeAnk));
      family.add(formatJodi(closeAnk, openAnk));
    }
  }

  return [...family].sort();
}

export function buildOpenResult(openPanna: string): OpenResult {
  const canonical = assertPanna(openPanna);
  const openAnk = ankOf(canonical);
  return {
    phase: 'open',
    openPanna: canonical,
    openAnk,
    line: `${canonical}-${openAnk}`,
  };
}

export function buildFullResult(openPanna: string, closePanna: string): FullResult {
  const open = assertPanna(openPanna);
  const close = assertPanna(closePanna);
  const openAnk = ankOf(open);
  const closeAnk = ankOf(close);
  const jodi = formatJodi(openAnk, closeAnk);
  return {
    phase: 'full',
    openPanna: open,
    closePanna: close,
    openAnk,
    closeAnk,
    jodi,
    line: `${open}-${jodi}-${close}`,
  };
}

export function parseResultLine(line: string): MarketResult {
  const trimmed = line.trim();
  const fullMatch = FULL_LINE.exec(trimmed);
  if (fullMatch) {
    const openPanna = fullMatch[1];
    const jodi = fullMatch[2];
    const closePanna = fullMatch[3];
    if (!openPanna || !jodi || !closePanna) {
      throw new MatkaRulesError('Result line must look like 458-74-239 or 458-7.');
    }
    const result = buildFullResult(openPanna, closePanna);
    if (result.jodi !== jodi) {
      throw new MatkaRulesError(
        `Jodi ${jodi} does not match open ank ${result.openAnk} and close ank ${result.closeAnk}.`,
      );
    }
    return result;
  }

  const openMatch = OPEN_LINE.exec(trimmed);
  if (openMatch) {
    const openPanna = openMatch[1];
    const openAnkText = openMatch[2];
    if (!openPanna || !openAnkText) {
      throw new MatkaRulesError('Result line must look like 458-74-239 or 458-7.');
    }
    const result = buildOpenResult(openPanna);
    const declaredAnk = Number(openAnkText);
    assertDigit(declaredAnk, 'Open ank');
    if (result.openAnk !== declaredAnk) {
      throw new MatkaRulesError(
        `Open ank ${openAnkText} does not match panna ${result.openPanna}.`,
      );
    }
    return result;
  }

  throw new MatkaRulesError('Result line must look like 458-74-239 or 458-7.');
}
