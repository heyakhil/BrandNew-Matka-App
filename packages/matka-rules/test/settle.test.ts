import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createFullSangamSlip,
  createHalfSangamSlip,
  createJodiSlip,
  createPannaSlip,
  createSingleSlip,
  expandCyclePatti,
  expandJodiFamily,
  expandPannaFamily,
  expandRedJodi,
  expandSdDpTp,
  expandSpMotor,
  parseResultLine,
  settle,
} from '../src/index';

const LINE = parseResultLine('479-02-499');
const HALF = parseResultLine('479-0');
const RED_LINE = parseResultLine('777-16-222');
const CHART_LINE = parseResultLine('458-74-239');

function winningPannas(slips: readonly { type: string; panna?: string; side?: string }[]) {
  return slips
    .map((slip) => {
      if (slip.type !== 'panna' || !slip.panna || !slip.side) {
        return null;
      }
      const outcome = settle(
        LINE,
        createPannaSlip(slip.side === 'close' ? 'close' : 'open', slip.panna, 10),
      );
      return outcome.status === 'won' ? { panna: slip.panna, rateKey: outcome.rateKey } : null;
    })
    .filter((hit) => hit !== null);
}

describe('settlement of 479-02-499', () => {
  it('pays the open ank, the close ank, and the exact jodi', () => {
    assert.deepEqual(settle(LINE, createSingleSlip('open', 0, 10)), {
      status: 'won',
      rateKey: 'single',
    });
    assert.deepEqual(settle(LINE, createSingleSlip('close', 2, 10)), {
      status: 'won',
      rateKey: 'single',
    });
    assert.deepEqual(settle(LINE, createSingleSlip('open', 2, 10)), { status: 'lost' });
    assert.deepEqual(settle(LINE, createJodiSlip('02', 10)), { status: 'won', rateKey: 'jodi' });
    assert.deepEqual(settle(LINE, createJodiSlip('20', 10)), { status: 'lost' });
  });

  it('pays a panna only when the digits match', () => {
    assert.deepEqual(settle(LINE, createPannaSlip('open', '479', 10, 'sp')), {
      status: 'won',
      rateKey: 'sp',
    });
    assert.deepEqual(settle(LINE, createPannaSlip('close', '499', 10, 'dp')), {
      status: 'won',
      rateKey: 'dp',
    });
    assert.deepEqual(settle(LINE, createPannaSlip('close', '129', 10, 'sp')), { status: 'lost' });
    assert.deepEqual(settle(LINE, createPannaSlip('open', '777', 10, 'tp')), { status: 'lost' });
  });

  it('pays both half sangams and the full sangam', () => {
    assert.deepEqual(
      settle(LINE, createHalfSangamSlip('openPannaCloseAnk', '479', 2, 10)),
      { status: 'won', rateKey: 'halfSangam' },
    );
    assert.deepEqual(
      settle(LINE, createHalfSangamSlip('openAnkClosePanna', '499', 0, 10)),
      { status: 'won', rateKey: 'halfSangam' },
    );
    assert.deepEqual(
      settle(LINE, createHalfSangamSlip('openPannaCloseAnk', '479', 3, 10)),
      { status: 'lost' },
    );
    assert.deepEqual(settle(LINE, createFullSangamSlip('479', '499', 10)), {
      status: 'won',
      rateKey: 'fullSangam',
    });
    assert.deepEqual(settle(LINE, createFullSangamSlip('499', '479', 10)), { status: 'lost' });
  });

  it('pays one panna inside an SD DP TP, motor, family, or cycle', () => {
    const openBracket = expandSdDpTp('open', 0, 10);
    const closeBracket = expandSdDpTp('close', 2, 10);
    assert.deepEqual(
      openBracket.slips.map((slip) => settle(LINE, slip)).filter((outcome) => outcome.status === 'won'),
      [{ status: 'won', rateKey: 'sp' }],
    );
    assert.deepEqual(
      closeBracket.slips
        .map((slip) => settle(LINE, slip))
        .filter((outcome) => outcome.status === 'won'),
      [{ status: 'won', rateKey: 'dp' }],
    );

    const motor = expandSpMotor('open', [2, 4, 7, 9], 10);
    assert.deepEqual(winningPannas(motor.slips), [{ panna: '479', rateKey: 'sp' }]);

    const cycle = expandCyclePatti('close', 4, 9, 10);
    assert.deepEqual(winningPannas(cycle.slips), [{ panna: '499', rateKey: 'dp' }]);

    const family = expandPannaFamily('open', '111', 10);
    assert.deepEqual(
      family.slips.map((slip) => settle(LINE, slip)).every((outcome) => outcome.status === 'lost'),
      true,
    );

    const jodis = expandJodiFamily('02', 10);
    assert.deepEqual(
      jodis.slips.map((slip) => settle(LINE, slip)).filter((outcome) => outcome.status === 'won'),
      [{ status: 'won', rateKey: 'jodi' }],
    );

    const red = expandRedJodi(10);
    assert.equal(
      red.slips.every((slip) => settle(LINE, slip).status === 'lost'),
      true,
    );
  });
});

describe('half result and other lines', () => {
  it('settles open bets and leaves close-dependent bets pending', () => {
    assert.deepEqual(settle(HALF, createSingleSlip('open', 0, 10)), {
      status: 'won',
      rateKey: 'single',
    });
    assert.deepEqual(settle(HALF, createPannaSlip('open', '128', 10, 'sp')), { status: 'lost' });
    assert.deepEqual(settle(HALF, createSingleSlip('close', 2, 10)), { status: 'pending' });
    assert.deepEqual(settle(HALF, createPannaSlip('close', '499', 10, 'dp')), { status: 'pending' });
    assert.deepEqual(settle(HALF, createJodiSlip('02', 10)), { status: 'pending' });
    assert.deepEqual(
      settle(HALF, createHalfSangamSlip('openPannaCloseAnk', '479', 2, 10)),
      { status: 'pending' },
    );
    assert.deepEqual(settle(HALF, createFullSangamSlip('479', '499', 10)), { status: 'pending' });
  });

  it('pays a triple panna and a red jodi on 777-16-222', () => {
    assert.deepEqual(settle(RED_LINE, createPannaSlip('open', '777', 10, 'tp')), {
      status: 'won',
      rateKey: 'tp',
    });
    assert.deepEqual(settle(RED_LINE, createJodiSlip('16', 10)), {
      status: 'won',
      rateKey: 'jodi',
    });
    const red = expandRedJodi(10);
    assert.deepEqual(
      red.slips.map((slip) => settle(RED_LINE, slip)).filter((outcome) => outcome.status === 'won'),
      [{ status: 'won', rateKey: 'jodi' }],
    );
  });

  it('reads 458-74-239 as open 7, close 4, and jodi 74', () => {
    assert.deepEqual(settle(CHART_LINE, createSingleSlip('open', 7, 10)), {
      status: 'won',
      rateKey: 'single',
    });
    assert.deepEqual(settle(CHART_LINE, createSingleSlip('close', 4, 10)), {
      status: 'won',
      rateKey: 'single',
    });
    assert.deepEqual(settle(CHART_LINE, createJodiSlip('74', 10)), {
      status: 'won',
      rateKey: 'jodi',
    });
    assert.deepEqual(settle(CHART_LINE, createPannaSlip('open', '458', 10, 'sp')), {
      status: 'won',
      rateKey: 'sp',
    });
    assert.deepEqual(settle(CHART_LINE, createPannaSlip('close', '239', 10, 'sp')), {
      status: 'won',
      rateKey: 'sp',
    });
    assert.deepEqual(settle(CHART_LINE, createFullSangamSlip('458', '239', 10)), {
      status: 'won',
      rateKey: 'fullSangam',
    });
  });
});
