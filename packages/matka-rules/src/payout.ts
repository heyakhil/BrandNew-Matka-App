import { MatkaRulesError } from './errors';
import type { PricedSlip } from './accept';
import type { Slip } from './expand';
import { normalizePanna } from './panna';
import { winningPaise } from './rates';
import { buildFullResult, buildOpenResult, type MarketResult } from './result';
import { rateKeyForSlip, settle, settlesOnOpen } from './settle';

export interface SlipPayout {
  slip: Slip;
  stakePaise: number;
  status: 'pending' | 'lost' | 'won' | 'refunded';
  winningPaise: number;
  refundPaise: number;
}

export interface PayoutBatch {
  result: MarketResult | null;
  outcomes: readonly SlipPayout[];
  creditPaise: number;
  noop: boolean;
}

export interface Reversal {
  debitPaise: number;
}

export interface RefundBatch {
  outcomes: readonly SlipPayout[];
  refundPaise: number;
}

function payoutFor(result: MarketResult, priced: PricedSlip): SlipPayout {
  const settlement = settle(result, priced.slip);
  if (settlement.status === 'pending') {
    return {
      slip: priced.slip,
      stakePaise: priced.stakePaise,
      status: 'pending',
      winningPaise: 0,
      refundPaise: 0,
    };
  }
  if (settlement.status === 'lost') {
    return {
      slip: priced.slip,
      stakePaise: priced.stakePaise,
      status: 'lost',
      winningPaise: 0,
      refundPaise: 0,
    };
  }
  if (settlement.rateKey !== priced.rateKey || settlement.rateKey !== rateKeyForSlip(priced.slip)) {
    throw new MatkaRulesError('Locked rate does not match the winning condition.');
  }
  return {
    slip: priced.slip,
    stakePaise: priced.stakePaise,
    status: 'won',
    winningPaise: winningPaise(priced.stakePaise, priced.lockedRate),
    refundPaise: 0,
  };
}

function creditOf(outcomes: readonly SlipPayout[]): number {
  return outcomes.reduce((total, outcome) => total + outcome.winningPaise, 0);
}

export function settleSlip(result: MarketResult, priced: PricedSlip): SlipPayout {
  return payoutFor(result, priced);
}

export function declareOpen(
  openPanna: string,
  slips: readonly PricedSlip[],
  alreadyDeclared: string | null = null,
): PayoutBatch {
  const canonical = normalizePanna(openPanna);
  if (alreadyDeclared !== null) {
    const previous = normalizePanna(alreadyDeclared);
    if (previous === canonical) {
      return { result: buildOpenResult(canonical), outcomes: [], creditPaise: 0, noop: true };
    }
    throw new MatkaRulesError('Open panna is already declared. Reverse it before declaring another.');
  }

  const result = buildOpenResult(canonical);
  const outcomes = slips.filter((priced) => settlesOnOpen(priced.slip)).map((priced) => payoutFor(result, priced));
  return { result, outcomes, creditPaise: creditOf(outcomes), noop: false };
}

export function declareClose(
  openPanna: string,
  closePanna: string,
  slips: readonly PricedSlip[],
  alreadyDeclaredClose: string | null = null,
): PayoutBatch {
  const open = normalizePanna(openPanna);
  const close = normalizePanna(closePanna);
  if (alreadyDeclaredClose !== null) {
    const previous = normalizePanna(alreadyDeclaredClose);
    if (previous === close) {
      return {
        result: buildFullResult(open, close),
        outcomes: [],
        creditPaise: 0,
        noop: true,
      };
    }
    throw new MatkaRulesError('Close panna is already declared. Reverse it before declaring another.');
  }

  const result = buildFullResult(open, close);
  const outcomes = slips
    .filter((priced) => !settlesOnOpen(priced.slip))
    .map((priced) => payoutFor(result, priced));
  return { result, outcomes, creditPaise: creditOf(outcomes), noop: false };
}

export function reverseDeclaration(batch: PayoutBatch): Reversal {
  if (batch.noop) {
    return { debitPaise: 0 };
  }
  return { debitPaise: batch.creditPaise };
}

export function refundUnsettled(
  result: MarketResult | null,
  slips: readonly PricedSlip[],
): RefundBatch {
  const unsettled = slips.filter((priced) => {
    if (result === null) {
      return true;
    }
    if (result.phase === 'full') {
      return false;
    }
    return !settlesOnOpen(priced.slip);
  });
  const outcomes = unsettled.map((priced) => ({
    slip: priced.slip,
    stakePaise: priced.stakePaise,
    status: 'refunded' as const,
    winningPaise: 0,
    refundPaise: priced.stakePaise,
  }));
  return {
    outcomes,
    refundPaise: outcomes.reduce((total, outcome) => total + outcome.refundPaise, 0),
  };
}
