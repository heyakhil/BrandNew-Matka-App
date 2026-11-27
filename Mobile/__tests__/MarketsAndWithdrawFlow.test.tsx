import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { QuickActionGrid } from '../src/components/organisms/QuickActionGrid';
import { FundsScreen } from '../src/screens/FundsScreen';
import { formatDisplayTime, sortMarketsByOpenTime } from '../src/utils/matkaHelpers';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-flash-message', () => ({
  __esModule: true,
  default: 'FlashMessage',
  showMessage: jest.fn(),
}));

describe('Market timing formatting, sorting, and Withdrawal navigation', () => {
  test('formatDisplayTime converts 24-hour and 12-hour strings to AM/PM', () => {
    expect(formatDisplayTime('00:15')).toBe('12:15 AM');
    expect(formatDisplayTime('11:35')).toBe('11:35 AM');
    expect(formatDisplayTime('12:00')).toBe('12:00 PM');
    expect(formatDisplayTime('13:30')).toBe('01:30 PM');
    expect(formatDisplayTime('06:40 pm')).toBe('06:40 PM');
  });

  test('sortMarketsByOpenTime orders earliest market first and updates on time change', () => {
    const initial = [
      { id: 'c', name: 'NIGHT', openTime: '22:00', closeTime: '23:00' },
      { id: 'a', name: 'MORNING', openTime: '09:30 AM', closeTime: '10:30 AM' },
      { id: 'b', name: 'AFTERNOON', openTime: '13:15', closeTime: '14:15' },
    ];
    expect(sortMarketsByOpenTime(initial).map(m => m.id)).toEqual(['a', 'b', 'c']);

    const updated = initial.map(m =>
      m.id === 'c' ? { ...m, openTime: '08:00 AM' } : m,
    );
    expect(sortMarketsByOpenTime(updated).map(m => m.id)).toEqual(['c', 'a', 'b']);
  });

  test('HomeScreen Withdrawal button opens Withdraw Fund screen instead of WhatsApp for live sessions', async () => {
    const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <App initialSession={{ token: 'live-test-token' }} />,
      );
    });

    await ReactTestRenderer.act(() => {
      renderer.root.findByType(QuickActionGrid).props.onWithdraw();
    });

    expect(openUrlSpy).not.toHaveBeenCalled();
    const funds = renderer.root.findByType(FundsScreen);
    expect(funds.props.subView).toBe('withdraw');

    await ReactTestRenderer.act(() => renderer.unmount());
    openUrlSpy.mockRestore();
  });
});
