import { MatkaRulesError } from './errors';

export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type Digit = (typeof DIGITS)[number];

export type PannaKind = 'sp' | 'dp' | 'tp';

export interface AnkPannas {
  sp: readonly string[];
  dp: readonly string[];
  tp: readonly string[];
  all: readonly string[];
}

export function isDigit(value: number): value is Digit {
  return Number.isInteger(value) && value >= 0 && value <= 9;
}

export function assertDigit(value: number, label = 'Digit'): asserts value is Digit {
  if (!isDigit(value)) {
    throw new MatkaRulesError(`${label} must be an integer from 0 to 9.`);
  }
}

/** Partner five steps away: 0↔5, 1↔6, 2↔7, 3↔8, 4↔9. */
export function cutDigit(digit: number): Digit {
  assertDigit(digit, 'Digit');
  return ((digit + 5) % 10) as Digit;
}

function pannaSortKey(digit: Digit): number {
  return digit === 0 ? 10 : digit;
}

/** Write three digits smallest to largest, with 0 last. 4, 0, 1 becomes 140. */
export function canonicalizeDigits(digits: readonly number[]): string {
  if (digits.length !== 3) {
    throw new MatkaRulesError('A panna is three digits.');
  }

  const validated = digits.map((digit, index) => {
    assertDigit(digit, `Digit ${index + 1}`);
    return digit;
  });
  validated.sort((left, right) => pannaSortKey(left) - pannaSortKey(right));
  return validated.join('');
}

export function ankOf(panna: string): Digit {
  const canonical = assertPanna(panna);
  const sum = [...canonical].reduce((total, character) => total + Number(character), 0);
  return (sum % 10) as Digit;
}

export function classifyPanna(panna: string): PannaKind {
  const unique = new Set(assertPanna(panna));
  if (unique.size === 1) {
    return 'tp';
  }
  if (unique.size === 2) {
    return 'dp';
  }
  return 'sp';
}

function combinations(digits: readonly Digit[], size: number): Digit[][] {
  const found: Digit[][] = [];
  const current: Digit[] = [];

  const walk = (start: number): void => {
    if (current.length === size) {
      found.push([...current]);
      return;
    }
    for (let index = start; index < digits.length; index += 1) {
      current.push(digits[index]);
      walk(index + 1);
      current.pop();
    }
  };

  walk(0);
  return found;
}

function buildCatalog(): readonly string[] {
  const pannas = new Set<string>();

  for (const combo of combinations(DIGITS, 3)) {
    pannas.add(canonicalizeDigits(combo));
  }
  for (const repeat of DIGITS) {
    for (const other of DIGITS) {
      if (other === repeat) {
        continue;
      }
      pannas.add(canonicalizeDigits([repeat, repeat, other]));
    }
  }
  for (const digit of DIGITS) {
    pannas.add(canonicalizeDigits([digit, digit, digit]));
  }

  return [...pannas].sort();
}

export const ALL_PANNAS: readonly string[] = buildCatalog();

const PANNA_SET: ReadonlySet<string> = new Set(ALL_PANNAS);

export function isValidPanna(value: string): boolean {
  return PANNA_SET.has(value);
}

export function assertPanna(value: string): string {
  if (!isValidPanna(value)) {
    throw new MatkaRulesError(`${value} is not a canonical panna.`);
  }
  return value;
}

/** Accept 821 or 128 and store the canonical panna. Digits outside the 220 are rejected. */
export function normalizePanna(value: string): string {
  if (!/^\d{3}$/.test(value)) {
    throw new MatkaRulesError(`${value} is not a three-digit panna.`);
  }
  return assertPanna(canonicalizeDigits([...value].map((character) => Number(character))));
}

function groupByAnk(): ReadonlyMap<Digit, AnkPannas> {
  const grouped = new Map<Digit, { sp: string[]; dp: string[]; tp: string[] }>();
  for (const digit of DIGITS) {
    grouped.set(digit, { sp: [], dp: [], tp: [] });
  }

  for (const panna of ALL_PANNAS) {
    const bucket = grouped.get(ankOf(panna));
    if (!bucket) {
      continue;
    }
    bucket[classifyPanna(panna)].push(panna);
  }

  const frozen = new Map<Digit, AnkPannas>();
  for (const digit of DIGITS) {
    const bucket = grouped.get(digit);
    if (!bucket) {
      continue;
    }
    frozen.set(digit, {
      sp: bucket.sp,
      dp: bucket.dp,
      tp: bucket.tp,
      all: [...bucket.sp, ...bucket.dp, ...bucket.tp],
    });
  }
  return frozen;
}

const PANNAS_BY_ANK = groupByAnk();

export function pannasOfAnk(ank: number): AnkPannas {
  assertDigit(ank, 'Ank');
  const group = PANNAS_BY_ANK.get(ank);
  if (!group) {
    throw new MatkaRulesError(`No pannas are registered for ank ${ank}.`);
  }
  return group;
}

/** Every panna reached by replacing any digits with their cuts. */
export function pannaFamily(panna: string): readonly string[] {
  const digits = [...assertPanna(panna)].map((character) => Number(character) as Digit);
  const family = new Set<string>();

  for (let mask = 0; mask < 8; mask += 1) {
    const next = digits.map((digit, index) =>
      (mask & (1 << index)) === 0 ? digit : cutDigit(digit),
    );
    family.add(canonicalizeDigits(next));
  }

  return [...family].sort();
}

export function assertDistinctDigits(
  digits: readonly number[],
  minimum: number,
  label: string,
): Digit[] {
  if (digits.length < minimum) {
    throw new MatkaRulesError(`${label} needs at least ${minimum} digits.`);
  }

  const unique: Digit[] = [];
  const seen = new Set<number>();
  for (const digit of digits) {
    assertDigit(digit, label);
    if (seen.has(digit)) {
      throw new MatkaRulesError(`${label} digits must be distinct.`);
    }
    seen.add(digit);
    unique.push(digit);
  }

  return unique.sort((left, right) => left - right);
}

/** Every single panna that can be formed from the chosen digits. */
export function spMotorPannas(digits: readonly number[]): readonly string[] {
  const unique = assertDistinctDigits(digits, 3, 'SP motor');
  return combinations(unique, 3)
    .map((combo) => canonicalizeDigits(combo))
    .sort();
}

/** Every double panna that can be formed from the chosen digits. Triples are excluded. */
export function dpMotorPannas(digits: readonly number[]): readonly string[] {
  const unique = assertDistinctDigits(digits, 2, 'DP motor');
  const pannas = new Set<string>();

  for (const repeat of unique) {
    for (const other of unique) {
      if (other === repeat) {
        continue;
      }
      pannas.add(canonicalizeDigits([repeat, repeat, other]));
    }
  }

  return [...pannas].sort();
}

/** Ten pannas that contain both anchor digits. */
export function cyclePatti(first: number, second: number): readonly string[] {
  assertDigit(first, 'Cycle digit');
  assertDigit(second, 'Cycle digit');
  if (first === second) {
    throw new MatkaRulesError('Cycle patti needs two different digits.');
  }

  const pannas = new Set(DIGITS.map((third) => canonicalizeDigits([first, second, third])));
  return [...pannas].sort();
}
