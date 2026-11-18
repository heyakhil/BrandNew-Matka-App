import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ALL_PANNAS,
  ankOf,
  canonicalizeDigits,
  classifyPanna,
  cutDigit,
  cyclePatti,
  dpMotorPannas,
  MatkaRulesError,
  pannasOfAnk,
  pannaFamily,
  spMotorPannas,
} from '../src/index';

const ANK_0_SP = [
  '127',
  '136',
  '145',
  '190',
  '235',
  '280',
  '370',
  '389',
  '460',
  '479',
  '569',
  '578',
];
const ANK_0_DP = ['118', '226', '244', '299', '334', '488', '550', '668', '677'];

describe('panna catalog', () => {
  it('writes digits smallest first and keeps 0 last', () => {
    assert.equal(canonicalizeDigits([4, 0, 1]), '140');
    assert.equal(canonicalizeDigits([0, 0, 0]), '000');
    assert.equal(canonicalizeDigits([8, 2, 1]), '128');
  });

  it('rejects a panna that is not three digits', () => {
    assert.throws(() => canonicalizeDigits([1, 2]), MatkaRulesError);
  });

  it('contains 120 single, 90 double, and 10 triple pannas', () => {
    const counts = { sp: 0, dp: 0, tp: 0 };
    for (const panna of ALL_PANNAS) {
      counts[classifyPanna(panna)] += 1;
    }
    assert.equal(ALL_PANNAS.length, 220);
    assert.deepEqual(counts, { sp: 120, dp: 90, tp: 10 });
  });

  it('gives every ank 12 single, 9 double, and 1 triple panna', () => {
    for (let ank = 0; ank <= 9; ank += 1) {
      const group = pannasOfAnk(ank);
      assert.equal(group.sp.length, 12);
      assert.equal(group.dp.length, 9);
      assert.equal(group.tp.length, 1);
      assert.equal(group.all.length, 22);
      for (const panna of group.all) {
        assert.equal(ankOf(panna), ank);
      }
    }
  });

  it('matches the published ank 0 chart', () => {
    const group = pannasOfAnk(0);
    assert.deepEqual([...group.sp].sort(), [...ANK_0_SP].sort());
    assert.deepEqual([...group.dp].sort(), [...ANK_0_DP].sort());
    assert.deepEqual(group.tp, ['000']);
  });

  it('reads an ank from the units digit of the digit sum', () => {
    assert.equal(ankOf('458'), 7);
    assert.equal(ankOf('239'), 4);
    assert.equal(ankOf('479'), 0);
    assert.equal(ankOf('499'), 2);
    assert.equal(ankOf('777'), 1);
    assert.equal(classifyPanna('458'), 'sp');
    assert.equal(classifyPanna('499'), 'dp');
    assert.equal(classifyPanna('777'), 'tp');
  });

  it('pairs each digit with the digit five steps away', () => {
    assert.deepEqual(
      [0, 1, 2, 3, 4].map((digit) => [digit, cutDigit(digit)]),
      [
        [0, 5],
        [1, 6],
        [2, 7],
        [3, 8],
        [4, 9],
      ],
    );
  });

  it('builds the 111 and 123 panna families', () => {
    assert.deepEqual(pannaFamily('111'), ['111', '116', '166', '666']);
    assert.deepEqual(pannaFamily('123'), ['123', '128', '137', '178', '236', '268', '367', '678']);
  });

  it('splits the 220 pannas into 35 families', () => {
    const owner = new Map<string, string>();
    for (const panna of ALL_PANNAS) {
      owner.set(panna, pannaFamily(panna).join(','));
    }
    assert.equal(owner.size, 220);
    assert.equal(new Set(owner.values()).size, 35);
  });

  it('expands an SP motor to every single panna of the chosen digits', () => {
    assert.deepEqual(spMotorPannas([9, 4, 7]), ['479']);
    assert.deepEqual(spMotorPannas([2, 4, 7, 9]), ['247', '249', '279', '479']);
    assert.equal(spMotorPannas([1, 2, 3, 4, 5]).length, 10);
  });

  it('expands a DP motor without triples', () => {
    assert.deepEqual(dpMotorPannas([4, 9]), ['449', '499']);
    assert.deepEqual(dpMotorPannas([2, 4, 7, 9]), [
      '224',
      '227',
      '229',
      '244',
      '277',
      '299',
      '447',
      '449',
      '477',
      '499',
      '779',
      '799',
    ]);
    assert.equal(dpMotorPannas([1, 2, 4]).length, 6);
    assert.equal(dpMotorPannas([1, 2, 3, 4, 5]).includes('111'), false);
  });

  it('builds the ten pannas of a cycle', () => {
    assert.deepEqual(cyclePatti(4, 9), [
      '149',
      '249',
      '349',
      '449',
      '459',
      '469',
      '479',
      '489',
      '490',
      '499',
    ]);
  });

  it('rejects repeated motor digits and a cycle of one digit', () => {
    assert.throws(() => spMotorPannas([4, 4, 7, 9]), MatkaRulesError);
    assert.throws(() => dpMotorPannas([4]), MatkaRulesError);
    assert.throws(() => cyclePatti(4, 4), MatkaRulesError);
  });
});
