import type { Slip } from './expand';
import { classifyPanna } from './panna';
import type { FullResult, MarketResult } from './result';

export type RateKey = 'single' | 'jodi' | 'sp' | 'dp' | 'tp' | 'halfSangam' | 'fullSangam';

export type Settlement =
  | { status: 'pending' }
  | { status: 'lost' }
  | { status: 'won'; rateKey: RateKey };

export function settlesOnOpen(slip: Slip): boolean {
  return (slip.type === 'single' || slip.type === 'panna') && slip.side === 'open';
}

export function rateKeyForSlip(slip: Slip): RateKey {
  switch (slip.type) {
    case 'single':
      return 'single';
    case 'jodi':
      return 'jodi';
    case 'panna':
      return classifyPanna(slip.panna);
    case 'halfSangam':
      return 'halfSangam';
    case 'fullSangam':
      return 'fullSangam';
    default: {
      const unexpected: never = slip;
      return unexpected;
    }
  }
}

function isFull(result: MarketResult): result is FullResult {
  return result.phase === 'full';
}

function isWinningSlip(result: MarketResult, slip: Slip): boolean {
  switch (slip.type) {
    case 'single':
      if (slip.side === 'open') {
        return slip.ank === result.openAnk;
      }
      return isFull(result) && slip.ank === result.closeAnk;
    case 'panna':
      if (slip.side === 'open') {
        return slip.panna === result.openPanna;
      }
      return isFull(result) && slip.panna === result.closePanna;
    case 'jodi':
      return isFull(result) && slip.jodi === result.jodi;
    case 'halfSangam':
      if (!isFull(result)) {
        return false;
      }
      if (slip.variant === 'openPannaCloseAnk') {
        return slip.panna === result.openPanna && slip.ank === result.closeAnk;
      }
      return slip.ank === result.openAnk && slip.panna === result.closePanna;
    case 'fullSangam':
      return (
        isFull(result) &&
        slip.openPanna === result.openPanna &&
        slip.closePanna === result.closePanna
      );
    default: {
      const unexpected: never = slip;
      return unexpected;
    }
  }
}

export function settle(result: MarketResult, slip: Slip): Settlement {
  if (result.phase === 'open' && !settlesOnOpen(slip)) {
    return { status: 'pending' };
  }
  if (!isWinningSlip(result, slip)) {
    return { status: 'lost' };
  }
  return { status: 'won', rateKey: rateKeyForSlip(slip) };
}
