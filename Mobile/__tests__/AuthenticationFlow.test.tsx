import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { GradientButton } from '../src/components/atoms/GradientButton';
import { AuthField } from '../src/components/molecules/AuthField';
import { LoginScreen } from '../src/screens/LoginScreen';
import {
  loginPlayer, resetPlayerPassword, startPlayerPasswordReset, startPlayerRegistration,
  verifyPlayerPasswordReset, verifyPlayerRegistration,
} from '../src/services/api';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('../src/services/api', () => ({
  loginPlayer: jest.fn(), resetPlayerPassword: jest.fn(),
  startPlayerPasswordReset: jest.fn(), verifyPlayerPasswordReset: jest.fn(),
  startPlayerRegistration: jest.fn(), verifyPlayerRegistration: jest.fn(),
}));
jest.mock('../src/services/flashMessage', () => ({
  notifyError: jest.fn(), notifySuccess: jest.fn(), notifyWarning: jest.fn(),
}));

describe('player authentication', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  const authenticated = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LoginScreen onAuthenticated={authenticated} />);
    });
  });

  afterEach(async () => {
    await ReactTestRenderer.act(() => renderer.unmount());
  });

  const fill = async (label: string, value: string): Promise<void> => {
    const field = renderer.root.findAllByType(AuthField).find(item => item.props.label === label);
    if (!field) throw new Error(`Field missing: ${label}`);
    await ReactTestRenderer.act(() => field.props.onChangeText(value));
  };

  const pressLink = async (label: string): Promise<void> => {
    const link = renderer.root.findAll(item => item.props.accessibilityLabel === label && typeof item.props.onPress === 'function')[0];
    if (!link) throw new Error(`Link missing: ${label}`);
    await ReactTestRenderer.act(() => link.props.onPress());
  };

  const submit = async (): Promise<void> => {
    await ReactTestRenderer.act(async () => {
      await renderer.root.findByType(GradientButton).props.onPress();
    });
  };

  test('logs in with mobile number and password', async () => {
    jest.mocked(loginPlayer).mockResolvedValue({ token: 'login-token', user: { name: 'A', phone: '9876543210', balancePaise: 0 } });
    await fill('Enter Mobile', '9876543210');
    await fill('Enter Password', 'password-123');
    await submit();
    expect(loginPlayer).toHaveBeenCalledWith('9876543210', 'password-123');
    expect(authenticated).toHaveBeenCalledWith('login-token');
  });

  test('registers after a four-digit OTP and signs in directly', async () => {
    jest.mocked(startPlayerRegistration).mockResolvedValue({ challengeId: 'a'.repeat(24) });
    jest.mocked(verifyPlayerRegistration).mockResolvedValue({ token: 'new-token', user: { name: 'A', phone: '9876543210', balancePaise: 0 } });
    await pressLink('Sign-Up');
    expect(renderer.root.findAllByType(AuthField).map(field => field.props.label)).toEqual([
      'Enter Name', 'Enter Mobile', 'Date of Birth', 'Enter Password', 'Confirm Password',
    ]);
    await fill('Enter Name', 'Akhil');
    await fill('Enter Mobile', '9876543210');
    await fill('Date of Birth', '1995-04-12');
    await fill('Enter Password', 'password-123');
    await fill('Confirm Password', 'password-123');
    await submit();
    expect(startPlayerRegistration).toHaveBeenCalledWith({
      name: 'Akhil', phone: '9876543210', dob: '1995-04-12',
      password: 'password-123', confirmPassword: 'password-123',
    });
    await fill('Enter 4-digit OTP', '1234');
    await submit();
    expect(verifyPlayerRegistration).toHaveBeenCalledWith('a'.repeat(24), '1234');
    expect(authenticated).toHaveBeenCalledWith('new-token');
  });

  test('resets password through a four-digit SMS code then returns to login', async () => {
    jest.mocked(startPlayerPasswordReset).mockResolvedValue({ challengeId: 'b'.repeat(24) });
    jest.mocked(verifyPlayerPasswordReset).mockResolvedValue({ resetToken: 'c'.repeat(64) });
    jest.mocked(resetPlayerPassword).mockResolvedValue();
    await pressLink('Forgot password?');
    await fill('Enter Mobile', '9876543210');
    await submit();
    expect(startPlayerPasswordReset).toHaveBeenCalledWith('9876543210');
    await fill('Enter 4-digit OTP', '1234');
    await submit();
    expect(verifyPlayerPasswordReset).toHaveBeenCalledWith('b'.repeat(24), '1234');
    await fill('New Password', 'new-password-123');
    await fill('Confirm Password', 'new-password-123');
    await submit();
    expect(resetPlayerPassword).toHaveBeenCalledWith('b'.repeat(24), 'c'.repeat(64), 'new-password-123', 'new-password-123');
    expect(renderer.root.findAllByType(AuthField).map(field => field.props.label)).toEqual(['Enter Mobile', 'Enter Password']);
  });
});
