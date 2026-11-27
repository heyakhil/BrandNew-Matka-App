import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PaperProvider } from 'react-native-paper';
import { MarketChartModal } from '../src/components/organisms/MarketChartModal';
import { ChartOptionCard } from '../src/components/molecules/ChartOptionCard';
import { INITIAL_MARKETS } from '../src/data/mockData';
import { royalMatkaTheme } from '../src/theme/paperTheme';

describe('MarketChartModal', () => {
  const sampleMarket = INITIAL_MARKETS[0];

  test('renders header, Jodi/Panna cards, and footer text', async () => {
    const onDismiss = jest.fn();
    const onSelectChart = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PaperProvider theme={royalMatkaTheme}>
          <MarketChartModal
            visible
            market={sampleMarket}
            onDismiss={onDismiss}
            onSelectChart={onSelectChart}
          />
        </PaperProvider>,
      );
    });

    const textValues = renderer.root
      .findAllByType('Text' as unknown as React.ComponentType<{ children?: React.ReactNode }>)
      .map(node => node.props.children)
      .flat()
      .filter((item): item is string => typeof item === 'string');

    expect(textValues).toContain('CHARTS');
    expect(textValues).toContain(sampleMarket.name.toUpperCase());
    expect(textValues).toContain('Jodi');
    expect(textValues).toContain('Digit pair');
    expect(textValues).toContain('Panna');
    expect(textValues).toContain("Tap a chart to view today's numbers");

    const cards = renderer.root.findAllByType(ChartOptionCard);
    expect(cards).toHaveLength(2);

    await ReactTestRenderer.act(() => {
      cards[0].props.onPress();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onSelectChart).toHaveBeenCalledWith(sampleMarket, 'Jodi');

    await ReactTestRenderer.act(() => {
      cards[1].props.onPress();
    });
    expect(onDismiss).toHaveBeenCalledTimes(2);
    expect(onSelectChart).toHaveBeenCalledWith(sampleMarket, 'Panna');

    await ReactTestRenderer.act(() => renderer.unmount());
  });
});
