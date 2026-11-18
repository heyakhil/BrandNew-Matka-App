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
