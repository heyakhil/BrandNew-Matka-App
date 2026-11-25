import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PaperProvider } from 'react-native-paper';
import { MarketGamesScreen } from '../src/screens/MarketGamesScreen';
import { PlayGameScreen } from '../src/screens/PlayGameScreen';
import { MARKET_GAME_OPTIONS } from '../src/data/mockData';
import { royalMatkaTheme } from '../src/theme/paperTheme';
import type { MarketItem } from '../src/types/matka';
import { getPannasForAnk } from '../src/utils/matkaHelpers';

const TEST_MARKET: MarketItem = {
  id: 'sridevi-night',
  name: 'SRIDEVI NIGHT',
  resultLine: '***-**-***',
  openTime: '07:05 PM',
  closeTime: '08:05 PM',
  status: 'open_running',
  category: 'main',
  recentChart: [],
};

describe('MarketGamesScreen & PlayGameScreen video parity', () => {
  test('renders exact 18 game options for main market', () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PaperProvider theme={royalMatkaTheme}>
          <MarketGamesScreen market={TEST_MARKET} onSelectGame={jest.fn()} />
        </PaperProvider>,
      );
    });

    const texts = renderer.root
      .findAllByType(require('react-native-paper').Text)
      .map(n => n.props.children)
      .filter((c): c is string => typeof c === 'string');

    expect(texts).toContain('Single Digit');
    expect(texts).toContain('Jodi');
    expect(texts).toContain('Jodi Bulk');
    expect(texts).toContain('Single Panna');
    expect(texts).toContain('Single Panna Bulk');
    expect(texts).toContain('Double Panna');
    expect(texts).toContain('Double Panna Bulk');
    expect(texts).toContain('Triple Panna');
    expect(texts).toContain('SP DP TP');
    expect(texts).toContain('SP Motor');
    expect(texts).toContain('DP Motor');
    expect(texts).toContain('Red Jodi');
    expect(texts).toContain('Panna Family');
    expect(texts).toContain('Cycle Patti');
    expect(texts).toContain('Jodi Family');
    expect(texts).toContain('Half Sangam');
    expect(texts).toContain('Full Sangam');
    expect(texts).not.toContain('Odd Even');
  });

  test('getPannasForAnk returns valid SP and DP pannas for ank 1', () => {
    const sp = getPannasForAnk(1, 'SP');
    const dp = getPannasForAnk(1, 'DP');
    expect(sp.length).toBe(12);
    expect(dp.length).toBe(9);
    expect(sp).toContain('128');
    expect(dp).toContain('119');
  });

  test('PlayGameScreen renders bulk keypad for SDB and 00-99 grid for JDB', () => {
    const sdbGame = MARKET_GAME_OPTIONS.find(g => g.id === 'SDB')!;
    const jdbGame = MARKET_GAME_OPTIONS.find(g => g.id === 'JDB')!;

    let sdbRenderer!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      sdbRenderer = ReactTestRenderer.create(
        <PaperProvider theme={royalMatkaTheme}>
          <PlayGameScreen
            market={TEST_MARKET}
            game={sdbGame}
            balanceRupees={1000}
            onBack={jest.fn()}
            onPlaceBets={jest.fn()}
          />
        </PaperProvider>,
      );
    });
    const sdbTexts = sdbRenderer.root
      .findAllByType(require('react-native-paper').Text)
      .map(n => n.props.children);
    expect(sdbTexts).toContain('0');
    expect(sdbTexts).toContain('9');
    expect(sdbTexts).toContain('Reset');

    let jdbRenderer!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      jdbRenderer = ReactTestRenderer.create(
        <PaperProvider theme={royalMatkaTheme}>
          <PlayGameScreen
            market={TEST_MARKET}
            game={jdbGame}
            balanceRupees={1000}
            onBack={jest.fn()}
            onPlaceBets={jest.fn()}
          />
        </PaperProvider>,
      );
    });
    const jdbTexts = jdbRenderer.root
      .findAllByType(require('react-native-paper').Text)
      .map(n => n.props.children);
    expect(jdbTexts).toContain('00');
    expect(jdbTexts).toContain('99');
  });
});
