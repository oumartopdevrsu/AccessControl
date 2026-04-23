/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/services/initData', () => ({
  initLocalData: jest.fn(async () => undefined),
}));

jest.mock('../src/navigation/AppNavigator', () => ({
  AppNavigator: () => null,
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
