/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { BottomTabBar } from '../src/components/organisms/BottomTabBar';
import { LoginScreen } from '../src/screens/LoginScreen';
import { getAuthToken, setAuthToken, removeAuthToken } from '../src/services/storage';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-flash-message', () => ({
  __esModule: true,
  default: 'FlashMessage',
  showMessage: jest.fn(),
}));

describe('App session persistence and storage', () => {
  beforeEach(async () => {
    await removeAuthToken();
  });

  test('correctly persists and clears auth token in storage', async () => {
    expect(await getAuthToken()).toBeNull();
    await setAuthToken('jwt-token-123');
    expect(await getAuthToken()).toBe('jwt-token-123');
    await removeAuthToken();
    expect(await getAuthToken()).toBeNull();
  });

  test('renders app in demo mode without login screen', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<App demo />);
    });
    expect(renderer.root.findAllByType(BottomTabBar).length).toBe(1);
    expect(renderer.root.findAllByType(LoginScreen).length).toBe(0);
  });

  test('renders app with session without login screen', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<App initialSession={{ token: 'mock-token' }} />);
    });
    expect(renderer.root.findAllByType(BottomTabBar).length).toBe(1);
    expect(renderer.root.findAllByType(LoginScreen).length).toBe(0);
  });
});
