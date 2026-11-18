import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  acceptBet,
  declareClose,
  declareOpen,
  DEFAULT_RATE_CARD,
  DEFAULT_STAKE_LIMITS,
  MatkaRulesError,
  refundUnsettled,
  reverseDeclaration,
  rupeesToPaise,
  type BetRequest,
  type RateCard,
} from '../src/index';

const CARD: RateCard = {
  single: { ...DEFAULT_RATE_CARD.single },
  jodi: { ...DEFAULT_RATE_CARD.jodi },
  sp: { ...DEFAULT_RATE_CARD.sp },
  dp: { ...DEFAULT_RATE_CARD.dp },
  tp: { ...DEFAULT_RATE_CARD.tp },
  halfSangam: { ...DEFAULT_RATE_CARD.halfSangam },
  fullSangam: { ...DEFAULT_RATE_CARD.fullSangam },
};

const HUNDRED = rupeesToPaise(100);
const TEN = rupeesToPaise(10);

function accept(request: BetRequest) {
  return acceptBet('preOpen', request, CARD, DEFAULT_STAKE_LIMITS);
}

describe('betting phase', () => {
  const openSingle: BetRequest = { game: 'single', side: 'open', ank: 0, stakePaise: TEN };
  const closeSingle: BetRequest = { game: 'single', side: 'close', ank: 2, stakePaise: TEN };
  const jodi: BetRequest = { game: 'jodi', jodi: '02', stakePaise: TEN };
  const half: BetRequest = {
    game: 'halfSangam',
    variant: 'openPannaCloseAnk',
    panna: '479',
    ank: 2,
    stakePaise: TEN,
  };
  const full: BetRequest = {
    game: 'fullSangam',
    openPanna: '479',
    closePanna: '499',
    stakePaise: TEN,
  };

  it('accepts every game before the open cutoff', () => {
    assert.equal(accept(openSingle).slips.length, 1);
    assert.equal(accept(closeSingle).slips.length, 1);
    assert.equal(accept(jodi).slips.length, 1);
    assert.equal(accept(half).slips.length, 1);
    assert.equal(accept(full).slips.length, 1);
  });

  it('keeps close-side bets and jodi open after the open cutoff', () => {
    assert.throws(
      () => acceptBet('afterOpenCutoff', openSingle, CARD, DEFAULT_STAKE_LIMITS),
      /Open-side bets are closed/,
    );
    assert.throws(
      () => acceptBet('afterOpenCutoff', half, CARD, DEFAULT_STAKE_LIMITS),
      /Sangam bets close/,
    );
    assert.throws(
      () => acceptBet('afterOpenCutoff', full, CARD, DEFAULT_STAKE_LIMITS),
      /Sangam bets close/,
    );
    assert.equal(
      acceptBet('afterOpenCutoff', closeSingle, CARD, DEFAULT_STAKE_LIMITS).slips[0]?.slip.type,
      'single',
    );
    assert.equal(
      acceptBet('afterOpenCutoff', jodi, CARD, DEFAULT_STAKE_LIMITS).slips[0]?.rateKey,
      'jodi',
    );
  });

  it('rejects every new bet after the close cutoff or when the market is off', () => {
    assert.throws(
      () => acceptBet('closed', closeSingle, CARD, DEFAULT_STAKE_LIMITS),
      /Betting is closed/,
    );
    assert.throws(
      () => acceptBet('closed', jodi, CARD, DEFAULT_STAKE_LIMITS),
      /Betting is closed/,
    );
    assert.throws(
      () => acceptBet('cancelled', openSingle, CARD, DEFAULT_STAKE_LIMITS),
      /not taking bets/,
    );
  });
});

describe('number conditions', () => {
  it('stores 821 as the canonical panna 128', () => {
    const accepted = accept({ game: 'sp', side: 'open', panna: '821', stakePaise: TEN });
    const slip = accepted.slips[0]?.slip;
    assert.equal(slip?.type, 'panna');
    if (slip?.type === 'panna') {
      assert.equal(slip.panna, '128');
    }
  });

  it('rejects a double panna typed on the single panna screen', () => {
    assert.throws(
      () => accept({ game: 'sp', side: 'open', panna: '112', stakePaise: TEN }),
      MatkaRulesError,
    );
  });

  it('rejects a stake outside ₹10 to ₹10,000 per slip', () => {
    assert.throws(
      () => accept({ game: 'single', side: 'open', ank: 1, stakePaise: rupeesToPaise(9) }),
      /outside the limits/,
    );
    assert.throws(
      () => accept({ game: 'single', side: 'open', ank: 1, stakePaise: rupeesToPaise(10_001) }),
      /outside the limits/,
    );
  });
});

describe('winning amount on 479-02-499', () => {
  it('pays ₹950 for a ₹100 open single at 9.5 and ignores a later rate change', () => {
    const card: RateCard = { ...CARD, single: { ...CARD.single } };
    const accepted = acceptBet(
      'preOpen',
      { game: 'single', side: 'open', ank: 0, stakePaise: HUNDRED },
      card,
      DEFAULT_STAKE_LIMITS,
    );
    card.single = { numerator: 10, denominator: 1 };
    const batch = declareOpen('479', accepted.slips);
    assert.equal(batch.creditPaise, 950 * 100);
    assert.equal(batch.outcomes[0]?.status, 'won');
    assert.equal(batch.result?.phase === 'open' && batch.result.line, '479-0');
  });

  it('pays jodi 02 and not jodi 20', () => {
    const accepted = accept({ game: 'jodiBulk', jodis: ['02', '20'], stakePaise: HUNDRED });
    const close = declareClose('479', '499', accepted.slips);
    const paid = close.outcomes.filter((outcome) => outcome.status === 'won');
    assert.equal(paid.length, 1);
    assert.equal(paid[0]?.winningPaise, 95 * HUNDRED);
    assert.equal(close.outcomes.find((outcome) => outcome.status === 'lost')?.winningPaise, 0);
  });

  it('pays one panna inside SD DP TP at that panna rate only', () => {
    const openBracket = accept({ game: 'sdDpTp', side: 'open', ank: 0, stakePaise: TEN });
    const closeBracket = accept({ game: 'sdDpTp', side: 'close', ank: 2, stakePaise: TEN });
    assert.equal(openBracket.totalStakePaise, 22 * TEN);

    const openPay = declareOpen('479', openBracket.slips);
    const openWins = openPay.outcomes.filter((outcome) => outcome.status === 'won');
    assert.equal(openWins.length, 1);
    assert.equal(openWins[0]?.winningPaise, 140 * TEN);
    assert.equal(openPay.creditPaise, 140 * TEN);

    const closePay = declareClose('479', '499', closeBracket.slips);
    const closeWins = closePay.outcomes.filter((outcome) => outcome.status === 'won');
    assert.equal(closeWins.length, 1);
    assert.equal(closeWins[0]?.winningPaise, 280 * TEN);
  });

  it('pays half sangam and full sangam only when both parts match in order', () => {
    const half = accept({
      game: 'halfSangam',
      variant: 'openPannaCloseAnk',
      panna: '974',
      ank: 2,
      stakePaise: TEN,
    });
    const wrongHalf = accept({
      game: 'halfSangam',
      variant: 'openAnkClosePanna',
      panna: '499',
      ank: 1,
      stakePaise: TEN,
    });
    const full = accept({
      game: 'fullSangam',
      openPanna: '479',
      closePanna: '499',
      stakePaise: TEN,
    });
    const swapped = accept({
      game: 'fullSangam',
      openPanna: '499',
      closePanna: '479',
      stakePaise: TEN,
    });

    assert.equal(declareClose('479', '499', half.slips).creditPaise, 1000 * TEN);
    assert.equal(declareClose('479', '499', wrongHalf.slips).creditPaise, 0);
    assert.equal(declareClose('479', '499', full.slips).creditPaise, 10000 * TEN);
    assert.equal(declareClose('479', '499', swapped.slips).creditPaise, 0);
  });

  it('credits open winners on the open declaration and the rest on the close', () => {
    const single = accept({ game: 'single', side: 'open', ank: 0, stakePaise: HUNDRED });
    const jodi = accept({ game: 'jodi', jodi: '02', stakePaise: HUNDRED });
    const slips = [...single.slips, ...jodi.slips];
    const open = declareOpen('974', slips);
    const close = declareClose('479', '994', slips);
    assert.equal(open.creditPaise, 950 * 100);
    assert.equal(close.creditPaise, 95 * HUNDRED);
    assert.equal(close.outcomes.every((outcome) => outcome.slip.type === 'jodi'), true);
  });
});

describe('declaration once', () => {
  it('does not pay a repeated panna and rejects a different one until reverse', () => {
    const accepted = accept({ game: 'single', side: 'open', ank: 0, stakePaise: HUNDRED });
    const first = declareOpen('479', accepted.slips);
    const repeat = declareOpen('974', accepted.slips, '479');
    assert.equal(first.creditPaise, 950 * 100);
    assert.equal(repeat.noop, true);
    assert.equal(repeat.creditPaise, 0);
    assert.equal(reverseDeclaration(repeat).debitPaise, 0);
    assert.equal(reverseDeclaration(first).debitPaise, first.creditPaise);
    assert.throws(() => declareOpen('128', accepted.slips, '479'), /already declared/);
    const corrected = declareOpen('128', accepted.slips, null);
    assert.equal(corrected.creditPaise, 0);
    assert.equal(corrected.outcomes[0]?.status, 'lost');
  });

  it('refunds unsettled stakes when the market is cancelled and pays no win', () => {
    const openBet = accept({ game: 'single', side: 'open', ank: 0, stakePaise: TEN });
    const jodi = accept({ game: 'jodi', jodi: '02', stakePaise: HUNDRED });
    const slips = [...openBet.slips, ...jodi.slips];
    const beforeDeclare = refundUnsettled(null, slips);
    assert.equal(beforeDeclare.refundPaise, TEN + HUNDRED);
    assert.equal(beforeDeclare.outcomes.every((outcome) => outcome.winningPaise === 0), true);

    const open = declareOpen('479', slips);
    const afterOpen = refundUnsettled(open.result, slips);
    assert.equal(afterOpen.refundPaise, HUNDRED);
    assert.equal(afterOpen.outcomes.length, 1);
  });
});
