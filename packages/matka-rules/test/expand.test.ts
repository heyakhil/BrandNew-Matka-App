import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  expandCyclePatti,
  expandDpMotor,
  expandJodiBulk,
  expandJodiFamily,
  expandPannaBulk,
  expandPannaFamily,
  expandRedJodi,
  expandSdDpTp,
  expandSingleBulk,
  expandSpMotor,
  MatkaRulesError,
  RED_JODIS,
} from '../src/index';

describe('bet expansion', () => {
  it('places one slip per single, jodi, and panna in a bulk', () => {
    const singles = expandSingleBulk('open', [0, 2], 10);
    assert.equal(singles.slips.length, 2);
    assert.equal(singles.totalStake, 20);
    assert.deepEqual(
      singles.slips.map((slip) => (slip.type === 'single' ? slip.ank : null)),
      [0, 2],
    );

    const jodis = expandJodiBulk(['02', '20'], 5);
    assert.equal(jodis.totalStake, 10);

    const pannas = expandPannaBulk('close', ['499', '449'], 'dp', 10);
    assert.equal(pannas.slips.length, 2);
    assert.throws(() => expandPannaBulk('close', ['479'], 'dp', 10), MatkaRulesError);
  });

  it('expands SD DP TP to the 22 pannas of an ank', () => {
    const bet = expandSdDpTp('open', 0, 10);
    assert.equal(bet.slips.length, 22);
    assert.equal(bet.totalStake, 220);
    assert.equal(
      bet.slips.some((slip) => slip.type === 'panna' && slip.panna === '479'),
      true,
    );
  });

  it('expands motors, families, cycle patti, and red jodi into concrete slips', () => {
    const spMotor = expandSpMotor('open', [2, 4, 7, 9], 10);
    assert.deepEqual(
      spMotor.slips.map((slip) => (slip.type === 'panna' ? slip.panna : '')),
      ['247', '249', '279', '479'],
    );
    assert.equal(spMotor.totalStake, 40);

    const dpMotor = expandDpMotor('close', [4, 9], 10);
    assert.deepEqual(
      dpMotor.slips.map((slip) => (slip.type === 'panna' ? slip.panna : '')),
      ['449', '499'],
    );

    const family = expandPannaFamily('open', '111', 10);
    assert.deepEqual(
      family.slips.map((slip) => (slip.type === 'panna' ? slip.panna : '')),
      ['111', '116', '166', '666'],
    );

    const cycle = expandCyclePatti('open', 4, 9, 10);
    assert.equal(cycle.slips.length, 10);
    assert.equal(
      cycle.slips.some((slip) => slip.type === 'panna' && slip.panna === '479'),
      true,
    );

    const jodis = expandJodiFamily('02', 10);
    assert.equal(jodis.slips.length, 8);
    assert.equal(jodis.totalStake, 80);

    const red = expandRedJodi(10);
    assert.equal(red.slips.length, RED_JODIS.length);
    assert.equal(red.totalStake, 200);
    assert.throws(() => expandRedJodi(10, ['02']), MatkaRulesError);
  });

  it('rejects an empty bulk and a non-positive stake', () => {
    assert.throws(() => expandSingleBulk('open', [], 10), MatkaRulesError);
    assert.throws(() => expandJodiBulk([], 10), MatkaRulesError);
    assert.throws(() => expandSingleBulk('open', [1, 1], 10), MatkaRulesError);
    assert.throws(() => expandSingleBulk('open', [1], 0), MatkaRulesError);
  });
});
