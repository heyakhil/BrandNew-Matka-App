import React from 'react';
import { BackHandler } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { HomeHeader } from '../src/components/molecules/HomeHeader';
import { ScreenHeader } from '../src/components/molecules/ScreenHeader';
import { AppDrawerModal } from '../src/components/organisms/AppDrawerModal';
import { BottomTabBar } from '../src/components/organisms/BottomTabBar';
import { INITIAL_MARKETS } from '../src/data/mockData';
import { FundsScreen } from '../src/screens/FundsScreen';
import { GameChartScreen } from '../src/screens/SidebarScreens/GameChartScreen';

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

describe('app navigation headers', () => {
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

  const pressTab = async (key: 'home' | 'wallet'): Promise<void> => {
    await ReactTestRenderer.act(() => {
      renderer.root.findByType(BottomTabBar).props.onTabPress(key);
    });
  };

  test('shows the home header only on the home tab', async () => {
    expect(renderer.root.findAllByType(HomeHeader)).toHaveLength(1);
    await pressTab('wallet');
    expect(renderer.root.findAllByType(HomeHeader)).toHaveLength(0);
    expect(renderer.root.findAllByType(ScreenHeader)).toHaveLength(1);
  });

  test('hardware back closes a funds subview before leaving the tab', async () => {
    await pressTab('wallet');
    await ReactTestRenderer.act(() => {
      renderer.root.findByType(FundsScreen).props.onSubViewChange('addFund');
    });
    await ReactTestRenderer.act(() => {
      expect(hardwareBack?.()).toBe(true);
    });
    expect(renderer.root.findByType(FundsScreen).props.subView).toBe('menu');
  });

  test('leaving funds resets its subview', async () => {
    await pressTab('wallet');
    await ReactTestRenderer.act(() => {
      renderer.root.findByType(FundsScreen).props.onSubViewChange('bank');
    });
    await pressTab('home');
    await pressTab('wallet');
    expect(renderer.root.findByType(FundsScreen).props.subView).toBe('menu');
  });

  test('hardware back restores the chart list from chart detail', async () => {
    await ReactTestRenderer.act(() => {
      renderer.root.findByType(AppDrawerModal).props.onOpenScreen('gameChart');
    });
    await ReactTestRenderer.act(() => {
      renderer.root.findByType(GameChartScreen).props.onSelectChart({
        market: INITIAL_MARKETS[0],
        mode: 'Jodi',
      });
    });
    await ReactTestRenderer.act(() => {
      expect(hardwareBack?.()).toBe(true);
    });
    expect(renderer.root.findByType(GameChartScreen).props.selectedChart).toBeNull();
  });
});
