import type { GameTypeId } from '../types/matka';

const DIGIT_ORDER = (d: number): number => (d === 0 ? 10 : d);

export function canonicalizePannaInput(raw: string): string | null {
  const cleaned = raw.replace(/\D/g, '');
  if (cleaned.length !== 3) {
    return null;
  }
  const digits = cleaned.split('').map(Number);
  digits.sort((a, b) => DIGIT_ORDER(a) - DIGIT_ORDER(b));
  return digits.join('');
}

export function classifyPannaKind(panna: string): 'SP' | 'DP' | 'TP' | null {
  if (!/^\d{3}$/.test(panna)) {
    return null;
  }
  const uniqueCount = new Set(panna.split('')).size;
  if (uniqueCount === 3) {
    return 'SP';
  }
  if (uniqueCount === 2) {
    return 'DP';
  }
  return 'TP';
}

export function ankFromPanna(panna: string): number {
  const sum = panna
    .split('')
    .map(Number)
    .reduce((acc, val) => acc + val, 0);
  return sum % 10;
}

export function isRedJodiPair(jodi: string): boolean {
  if (!/^\d{2}$/.test(jodi)) {
    return false;
  }
  const a = Number(jodi[0]);
  const b = Number(jodi[1]);
  return a === b || (a + 5) % 10 === b;
}

/** Generate all canonical 3-digit SP or DP pannas whose ank sum % 10 equals `ank`. */
export function getPannasForAnk(ank: number, kind: 'SP' | 'DP'): string[] {
  if (!Number.isInteger(ank) || ank < 0 || ank > 9) {
    return [];
  }
  const results = new Set<string>();
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  if (kind === 'SP') {
    for (let i = 0; i < digits.length; i += 1) {
      for (let j = i + 1; j < digits.length; j += 1) {
        for (let k = j + 1; k < digits.length; k += 1) {
          const d1 = digits[i];
          const d2 = digits[j];
          const d3 = digits[k];
          if ((d1 + d2 + d3) % 10 === ank) {
            results.add(`${d1}${d2}${d3}`);
          }
        }
      }
    }
  } else {
    for (const repeat of digits) {
      for (const other of digits) {
        if (other === repeat) continue;
        if ((repeat + repeat + other) % 10 === ank) {
          const sorted = [repeat, repeat, other].sort(
            (a, b) => DIGIT_ORDER(a) - DIGIT_ORDER(b),
          );
          results.add(sorted.join(''));
        }
      }
    }
  }

  return Array.from(results).sort();
}

export interface BetValidationResult {
  valid: boolean;
  formattedNumber: string;
  error?: string;
}

export function validateGameInput(
  gameCode: GameTypeId,
  primaryInput: string,
  secondaryInput?: string,
): BetValidationResult {
  const primary = primaryInput.trim();
  const secondary = (secondaryInput ?? '').trim();

  switch (gameCode) {
    case 'SD':
    case 'SDB':
    case 'OE':
    case 'SDT': {
      if (!/^\d$/.test(primary)) {
        return {
          valid: false,
          formattedNumber: primary,
          error: 'Enter a single digit (0–9).',
        };
      }
      return { valid: true, formattedNumber: primary };
    }
    case 'JD':
    case 'JDB':
    case 'GJ':
    case 'DBJ': {
      if (!/^\d{2}$/.test(primary)) {
        return {
          valid: false,
          formattedNumber: primary,
          error: 'Enter a 2-digit jodi (00–99).',
        };
      }
      return { valid: true, formattedNumber: primary };
    }
    case 'RB': {
      if (!/^\d{2}$/.test(primary) || !isRedJodiPair(primary)) {
        return {
          valid: false,
          formattedNumber: primary,
          error: 'Red Bracket must be a twin (e.g. 22) or cut pair (e.g. 16, 49).',
        };
      }
      return { valid: true, formattedNumber: primary };
    }
    case 'SP':
    case 'SPB':
    case 'DP':
    case 'DPB':
    case 'TP': {
      const targetKind =
        gameCode === 'SP' || gameCode === 'SPB'
          ? 'SP'
          : gameCode === 'DP' || gameCode === 'DPB'
          ? 'DP'
          : 'TP';
      const canonical = canonicalizePannaInput(primary);
      if (!canonical) {
        return {
          valid: false,
          formattedNumber: primary,
          error: 'Enter a 3-digit panna.',
        };
      }
      const kind = classifyPannaKind(canonical);
      if (kind !== targetKind) {
        return {
          valid: false,
          formattedNumber: canonical,
          error: `${canonical} is a ${kind ?? 'invalid'}, not a ${targetKind}.`,
        };
      }
      return { valid: true, formattedNumber: canonical };
    }
    case 'CP':
    case 'PG': {
      const canonical = canonicalizePannaInput(primary);
      if (!canonical) {
        return {
          valid: false,
          formattedNumber: primary,
          error: 'Enter a valid 3-digit panna.',
        };
      }
      return { valid: true, formattedNumber: canonical };
    }
    case 'SPM': {
      const uniqueDigits = Array.from(new Set(primary.replace(/\D/g, '').split('')));
      if (uniqueDigits.length < 3) {
        return {
          valid: false,
          formattedNumber: uniqueDigits.join(''),
          error: 'SP Motor requires at least 3 distinct digits.',
        };
      }
      return { valid: true, formattedNumber: uniqueDigits.join('') };
    }
    case 'DPM': {
      const uniqueDigits = Array.from(new Set(primary.replace(/\D/g, '').split('')));
      if (uniqueDigits.length < 2) {
        return {
          valid: false,
          formattedNumber: uniqueDigits.join(''),
          error: 'DP Motor requires at least 2 distinct digits.',
        };
      }
      return { valid: true, formattedNumber: uniqueDigits.join('') };
    }
    case 'TDP': {
      const uniqueDigits = Array.from(new Set(primary.replace(/\D/g, '').split('')));
      if (uniqueDigits.length !== 2) {
        return {
          valid: false,
          formattedNumber: uniqueDigits.join(''),
          error: 'Enter 2 distinct digits for Two Digit Panel (CP/SR).',
        };
      }
      return { valid: true, formattedNumber: uniqueDigits.join('-') };
    }
    case 'HS': {
      const canonical = canonicalizePannaInput(primary);
      if (!canonical) {
        return {
          valid: false,
          formattedNumber: primary,
          error: 'Enter a valid 3-digit panna.',
        };
      }
      if (!/^\d$/.test(secondary)) {
        return {
          valid: false,
          formattedNumber: primary,
          error: 'Enter a single digit (0–9) for the other side.',
        };
      }
      return { valid: true, formattedNumber: `${canonical}-${secondary}` };
    }
    case 'FS': {
      const openCanonical = canonicalizePannaInput(primary);
      const closeCanonical = canonicalizePannaInput(secondary);
      if (!openCanonical || !closeCanonical) {
        return {
          valid: false,
          formattedNumber: `${primary}-${secondary}`,
          error: 'Enter valid 3-digit Open and Close pannas.',
        };
      }
      return { valid: true, formattedNumber: `${openCanonical}-${closeCanonical}` };
    }
  }
}

export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function parseTimeMinutes(time: string | undefined): number {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const trimmed = time.trim();
  const match12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed);
  if (match12) {
    const rawHour = Number(match12[1]);
    const minutes = Number(match12[2]);
    if (rawHour < 1 || rawHour > 12 || minutes > 59) return Number.MAX_SAFE_INTEGER;
    const isPm = match12[3].toUpperCase() === 'PM';
    const hours24 = (rawHour % 12) + (isPm ? 12 : 0);
    return hours24 * 60 + minutes;
  }
  const match24 = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match24) return Number.MAX_SAFE_INTEGER;
  const hours24 = Number(match24[1]);
  const minutes = Number(match24[2]);
  if (hours24 > 23 || minutes > 59) return Number.MAX_SAFE_INTEGER;
  return hours24 * 60 + minutes;
}

export function formatDisplayTime(time: string | undefined): string {
  if (!time) return '—';
  const totalMinutes = parseTimeMinutes(time);
  if (totalMinutes === Number.MAX_SAFE_INTEGER) return time.trim();
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function sortMarketsByOpenTime<
  T extends { openTime: string; closeTime?: string; name?: string },
>(markets: readonly T[]): T[] {
  return [...markets].sort((a, b) => {
    const openDiff = parseTimeMinutes(a.openTime) - parseTimeMinutes(b.openTime);
    if (openDiff !== 0) return openDiff;
    const closeDiff = parseTimeMinutes(a.closeTime) - parseTimeMinutes(b.closeTime);
    if (closeDiff !== 0) return closeDiff;
    return (a.name ?? '').localeCompare(b.name ?? '');
  });
}
