/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-flash-message', () => ({ __esModule: true, default: 'FlashMessage', showMessage: jest.fn() }));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
