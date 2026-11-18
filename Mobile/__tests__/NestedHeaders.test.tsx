import React from 'react';
import { BackHandler } from 'react-native';
import { BottomNavigation, IconButton } from 'react-native-paper';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { NoticeTicker } from '../src/components/molecules/NoticeTicker';
import { TopAppBar } from '../src/components/molecules/TopAppBar';
import { AppDrawerModal } from '../src/components/organisms/AppDrawerModal';
import { INITIAL_MARKETS } from '../src/data/mockData';
import { GameChartScreen } from '../src/screens/SidebarScreens/GameChartScreen';
import { WalletScreen } from '../src/screens/WalletScreen';

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/molecules/TopAppBar', () => ({
  TopAppBar: jest.fn(() => null),
}));

describe('nested screen headers', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  let hardwareBack: (() => boolean | null | undefined) | undefined;

  beforeEach(async () => {
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, handler) => {
      hardwareBack = () => handler({ type: 'hardwareBackPress', timeStamp: 0 });
      return { remove: jest.fn() };
    });
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<App />);
    });
  });

  afterEach(async () => {
    await ReactTestRenderer.act(() => renderer.unmount());
    jest.restoreAllMocks();
    hardwareBack = undefined;
  });

  const expectParentHeader = (visible: boolean): void => {
    expect(renderer.root.findAllByType(TopAppBar)).toHaveLength(visible ? 1 : 0);
    expect(renderer.root.findAllByType(NoticeTicker)).toHaveLength(visible ? 1 : 0);
  };

  const openWallet = async (): Promise<void> => {
    await ReactTestRenderer.act(() => {
      const bar = renderer.root.findByType(BottomNavigation.Bar);
      bar.props.onTabPress({
        route: { key: 'wallet' },
        preventDefault: jest.fn(),
      });
    });
  };

  test.each(['history', 'addHistory', 'bank'] as const)(
    'hides the parent header in wallet %s and restores it on back',
    async subView => {
      await openWallet();
      expectParentHeader(true);

      await ReactTestRenderer.act(() => {
        renderer.root.findByType(WalletScreen).props.onSubViewChange(subView);
      });
      expectParentHeader(false);

      await ReactTestRenderer.act(() => {
        renderer.root
          .findByType(WalletScreen)
          .findAllByType(IconButton)
          .find(button => button.props.icon === 'arrow-left')
          ?.props.onPress();
      });
      expect(renderer.root.findByType(WalletScreen).props.subView).toBe('menu');
      expectParentHeader(true);
    },
  );

  test('hardware back closes a wallet subview before leaving the wallet', async () => {
    await openWallet();
    await ReactTestRenderer.act(() => {
      renderer.root.findByType(WalletScreen).props.onSubViewChange('history');
    });
    await ReactTestRenderer.act(() => {
      expect(hardwareBack?.()).toBe(true);
    });
    expect(renderer.root.findByType(WalletScreen).props.subView).toBe('menu');
    expectParentHeader(true);
  });

  test('leaving the wallet resets its subview without resetting it on a same-tab press', async () => {
    await openWallet();
    await ReactTestRenderer.act(() => {
      renderer.root.findByType(WalletScreen).props.onSubViewChange('bank');
    });
    await openWallet();
    expect(renderer.root.findByType(WalletScreen).props.subView).toBe('bank');
    expectParentHeader(false);

    await ReactTestRenderer.act(() => {
      renderer.root.findByType(BottomNavigation.Bar).props.onTabPress({
        route: { key: 'home' },
        preventDefault: jest.fn(),
      });
    });
    expectParentHeader(true);
    await openWallet();
    expect(renderer.root.findByType(WalletScreen).props.subView).toBe('menu');
    expectParentHeader(true);
  });

  test('chart detail hides the parent header and hardware back restores the chart list', async () => {
    await ReactTestRenderer.act(() => {
      renderer.root.findByType(AppDrawerModal).props.onOpenScreen('gameChart');
    });
    expectParentHeader(true);

    await ReactTestRenderer.act(() => {
      renderer.root.findByType(GameChartScreen).props.onSelectChart({
        market: INITIAL_MARKETS[0],
        mode: 'Jodi',
      });
    });
    expectParentHeader(false);

    await ReactTestRenderer.act(() => {
      expect(hardwareBack?.()).toBe(true);
    });
    expect(renderer.root.findByType(GameChartScreen).props.selectedChart).toBeNull();
    expectParentHeader(true);
  });
});
