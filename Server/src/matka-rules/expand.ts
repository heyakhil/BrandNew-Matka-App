import { MatkaRulesError } from './errors';
import {
  assertDigit,
  assertPanna,
  classifyPanna,
  cyclePatti,
  dpMotorPannas,
  pannasOfAnk,
  pannaFamily,
  spMotorPannas,
  type Digit,
  type PannaKind,
} from './panna';
import { assertJodi, isRedJodi, jodiFamily, RED_JODIS } from './result';

export type SessionSide = 'open' | 'close';

export interface SingleSlip {
  type: 'single';
  side: SessionSide;
  ank: Digit;
  stake: number;
}

export interface JodiSlip {
  type: 'jodi';
  jodi: string;
  stake: number;
}

export interface PannaSlip {
  type: 'panna';
  side: SessionSide;
  panna: string;
  stake: number;
}

export type HalfSangamVariant = 'openPannaCloseAnk' | 'openAnkClosePanna';

export interface HalfSangamSlip {
  type: 'halfSangam';
  variant: HalfSangamVariant;
  panna: string;
  ank: Digit;
  stake: number;
}

export interface FullSangamSlip {
  type: 'fullSangam';
  openPanna: string;
  closePanna: string;
  stake: number;
}

export type Slip = SingleSlip | JodiSlip | PannaSlip | HalfSangamSlip | FullSangamSlip;

export interface ExpandedBet {
  slips: readonly Slip[];
  totalStake: number;
}

export function assertSide(side: string): asserts side is SessionSide {
  if (side !== 'open' && side !== 'close') {
    throw new MatkaRulesError('Session must be open or close.');
  }
}

export function assertStake(stake: number): void {
  if (!Number.isFinite(stake) || stake <= 0) {
    throw new MatkaRulesError('Stake must be a positive number.');
  }
}

function expanded(slips: readonly Slip[]): ExpandedBet {
  const totalStake = slips.reduce((total, slip) => total + slip.stake, 0);
  return { slips, totalStake };
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new MatkaRulesError(`${label} entries must be unique.`);
  }
}

export function createSingleSlip(side: SessionSide, ank: number, stake: number): SingleSlip {
  assertSide(side);
  assertDigit(ank, 'Ank');
  assertStake(stake);
  return { type: 'single', side, ank, stake };
}

export function createJodiSlip(jodi: string, stake: number): JodiSlip {
  assertStake(stake);
  return { type: 'jodi', jodi: assertJodi(jodi), stake };
}

export function createPannaSlip(
  side: SessionSide,
  panna: string,
  stake: number,
  kind?: PannaKind,
): PannaSlip {
  assertSide(side);
  assertStake(stake);
  const canonical = assertPanna(panna);
  if (kind !== undefined && classifyPanna(canonical) !== kind) {
    throw new MatkaRulesError(`${canonical} is not a ${kind.toUpperCase()} panna.`);
  }
  return { type: 'panna', side, panna: canonical, stake };
}

export function createHalfSangamSlip(
  variant: HalfSangamVariant,
  panna: string,
  ank: number,
  stake: number,
): HalfSangamSlip {
  if (variant !== 'openPannaCloseAnk' && variant !== 'openAnkClosePanna') {
    throw new MatkaRulesError('Half sangam variant is not recognised.');
  }
  assertDigit(ank, 'Ank');
  assertStake(stake);
  return { type: 'halfSangam', variant, panna: assertPanna(panna), ank, stake };
}

export function createFullSangamSlip(
  openPanna: string,
  closePanna: string,
  stake: number,
): FullSangamSlip {
  assertStake(stake);
  return {
    type: 'fullSangam',
    openPanna: assertPanna(openPanna),
    closePanna: assertPanna(closePanna),
    stake,
  };
}

export function expandSingleBulk(
  side: SessionSide,
  anks: readonly number[],
  stake: number,
): ExpandedBet {
  if (anks.length === 0) {
    throw new MatkaRulesError('Single digit bulk needs at least one ank.');
  }
  assertUnique(anks.map(String), 'Single digit bulk');
  return expanded(anks.map((ank) => createSingleSlip(side, ank, stake)));
}

export function expandJodiBulk(jodis: readonly string[], stake: number): ExpandedBet {
  if (jodis.length === 0) {
    throw new MatkaRulesError('Jodi bulk needs at least one jodi.');
  }
  assertUnique(jodis, 'Jodi bulk');
  return expanded(jodis.map((jodi) => createJodiSlip(jodi, stake)));
}

export function expandPannaBulk(
  side: SessionSide,
  pannas: readonly string[],
  kind: PannaKind,
  stake: number,
): ExpandedBet {
  if (pannas.length === 0) {
    throw new MatkaRulesError('Panna bulk needs at least one panna.');
  }
  assertUnique(pannas, 'Panna bulk');
  return expanded(pannas.map((panna) => createPannaSlip(side, panna, stake, kind)));
}

/** All 22 pannas of one ank. The hit pays at that panna's own SP, DP, or TP rate. */
export function expandSdDpTp(side: SessionSide, ank: number, stake: number): ExpandedBet {
  return expanded(pannasOfAnk(ank).all.map((panna) => createPannaSlip(side, panna, stake)));
}

export function expandSpMotor(
  side: SessionSide,
  digits: readonly number[],
  stake: number,
): ExpandedBet {
  return expanded(
    spMotorPannas(digits).map((panna) => createPannaSlip(side, panna, stake, 'sp')),
  );
}

export function expandDpMotor(
  side: SessionSide,
  digits: readonly number[],
  stake: number,
): ExpandedBet {
  return expanded(
    dpMotorPannas(digits).map((panna) => createPannaSlip(side, panna, stake, 'dp')),
  );
}

export function expandRedJodi(stake: number, jodis: readonly string[] = RED_JODIS): ExpandedBet {
  if (jodis.length === 0) {
    throw new MatkaRulesError('Red jodi needs at least one jodi.');
  }
  assertUnique(jodis, 'Red jodi');
  const slips = jodis.map((jodi) => {
    const canonical = assertJodi(jodi);
    if (!isRedJodi(canonical)) {
      throw new MatkaRulesError(`${canonical} is not a red jodi.`);
    }
    return createJodiSlip(canonical, stake);
  });
  return expanded(slips);
}

export function expandPannaFamily(side: SessionSide, panna: string, stake: number): ExpandedBet {
  return expanded(pannaFamily(panna).map((member) => createPannaSlip(side, member, stake)));
}

export function expandCyclePatti(
  side: SessionSide,
  first: number,
  second: number,
  stake: number,
): ExpandedBet {
  return expanded(cyclePatti(first, second).map((panna) => createPannaSlip(side, panna, stake)));
}

export function expandJodiFamily(jodi: string, stake: number): ExpandedBet {
  return expanded(jodiFamily(jodi).map((member) => createJodiSlip(member, stake)));
}
