import { MatkaRulesError } from './errors';
import type { RateKey } from './settle';

/** A payout multiple as an exact fraction. 9.5 is 19/2. */
export interface Rate {
  numerator: number;
  denominator: number;
}

export interface RateCard {
  single: Rate;
  jodi: Rate;
  sp: Rate;
  dp: Rate;
  tp: Rate;
  halfSangam: Rate;
  fullSangam: Rate;
}

export interface StakeLimits {
  minPaise: number;
  maxPaise: number;
}

export const PAISE_PER_RUPEE = 100;

/** Main-market card: single 9.5, jodi 95, SP 140, DP 280, TP 700, half 1000, full 10000. */
export const DEFAULT_RATE_CARD: RateCard = {
  single: { numerator: 19, denominator: 2 },
  jodi: { numerator: 95, denominator: 1 },
  sp: { numerator: 140, denominator: 1 },
  dp: { numerator: 280, denominator: 1 },
  tp: { numerator: 700, denominator: 1 },
  halfSangam: { numerator: 1000, denominator: 1 },
  fullSangam: { numerator: 10000, denominator: 1 },
};

/** ₹10 to ₹10,000 per slip. */
export const DEFAULT_STAKE_LIMITS: StakeLimits = {
  minPaise: 10 * PAISE_PER_RUPEE,
  maxPaise: 10_000 * PAISE_PER_RUPEE,
};

export function rupeesToPaise(rupees: number): number {
  if (!Number.isInteger(rupees) || rupees <= 0) {
    throw new MatkaRulesError('Rupee stake must be a positive whole number.');
  }
  return rupees * PAISE_PER_RUPEE;
}

export function rateFor(card: RateCard, key: RateKey): Rate {
  return { ...card[key] };
}

export function assertStakePaise(stakePaise: number, limits: StakeLimits = DEFAULT_STAKE_LIMITS): void {
  if (!Number.isInteger(stakePaise) || stakePaise <= 0) {
    throw new MatkaRulesError('Stake must be a positive whole number of paise.');
  }
  if (stakePaise < limits.minPaise || stakePaise > limits.maxPaise) {
    throw new MatkaRulesError('Stake is outside the limits for this market.');
  }
}

/** winningPaise = stakePaise × rate, with no rounding. */
export function winningPaise(stakePaise: number, rate: Rate): number {
  if (!Number.isInteger(stakePaise) || stakePaise <= 0) {
    throw new MatkaRulesError('Stake must be a positive whole number of paise.');
  }
  if (
    !Number.isInteger(rate.numerator) ||
    !Number.isInteger(rate.denominator) ||
    rate.numerator <= 0 ||
    rate.denominator <= 0
  ) {
    throw new MatkaRulesError('Rate must be a positive fraction.');
  }
  const product = stakePaise * rate.numerator;
  if (product % rate.denominator !== 0) {
    throw new MatkaRulesError('Winning amount is not a whole number of paise.');
  }
  return product / rate.denominator;
}
