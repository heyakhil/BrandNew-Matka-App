import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullResult,
  buildOpenResult,
  isRedJodi,
  jodiFamily,
  MatkaRulesError,
  parseResultLine,
  RED_JODIS,
} from '../src/index';

const PUBLISHED_RED_JODIS = [
  '00',
  '05',
  '11',
  '16',
  '22',
  '27',
  '33',
  '38',
  '44',
  '49',
  '50',
  '55',
  '61',
  '66',
  '72',
  '77',
  '83',
  '88',
  '94',
  '99',
];

describe('result line', () => {
  it('derives 458-74-239 from the two pannas', () => {
    const result = buildFullResult('458', '239');
    assert.equal(result.line, '458-74-239');
    assert.equal(result.openAnk, 7);
    assert.equal(result.closeAnk, 4);
    assert.equal(result.jodi, '74');
    assert.deepEqual(parseResultLine('458-74-239'), result);
  });

  it('derives 479-02-499 and keeps a leading zero in the jodi', () => {
    const result = parseResultLine('479-02-499');
    assert.equal(result.phase, 'full');
    if (result.phase !== 'full') {
      return;
    }
    assert.equal(result.openAnk, 0);
    assert.equal(result.closeAnk, 2);
    assert.equal(result.jodi, '02');
  });

  it('parses a half line before the close is out', () => {
    const result = parseResultLine(' 458-7 ');
    assert.deepEqual(result, buildOpenResult('458'));
    assert.equal(result.line, '458-7');
  });

  it('rejects a jodi that does not match the pannas', () => {
    assert.throws(() => parseResultLine('458-75-239'), MatkaRulesError);
    assert.throws(() => parseResultLine('458-8'), MatkaRulesError);
  });

  it('rejects a non-canonical panna', () => {
    assert.throws(() => parseResultLine('231-69-456'), MatkaRulesError);
    assert.throws(() => buildFullResult('401', '239'), MatkaRulesError);
  });

  it('lists the 20 red jodis', () => {
    assert.deepEqual([...RED_JODIS], PUBLISHED_RED_JODIS);
    assert.equal(isRedJodi('16'), true);
    assert.equal(isRedJodi('02'), false);
    assert.equal(isRedJodi('74'), false);
  });

  it('builds jodi families of 8 and of 4', () => {
    assert.deepEqual(jodiFamily('02'), ['02', '07', '20', '25', '52', '57', '70', '75']);
    assert.deepEqual(jodiFamily('22'), ['22', '27', '72', '77']);
  });
});
