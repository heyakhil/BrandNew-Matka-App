import React from 'react';
import { Animated, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import ReactTestRenderer from 'react-test-renderer';
import { NoticeTicker } from '../src/components/molecules/NoticeTicker';

test('loops across the measured widths and restarts when the layout changes', async () => {
  const start = jest.fn();
  const stop = jest.fn();
  const timing = jest.spyOn(Animated, 'timing');
  const loop = jest.spyOn(Animated, 'loop').mockImplementation(animation => ({
    ...animation,
    start,
    stop,
  }));
  let renderer: ReactTestRenderer.ReactTestRenderer;

  try {
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<NoticeTicker message="Notice" />);
    });
    expect(loop).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      renderer.root.findByType(ScrollView).props.onLayout({
        nativeEvent: { layout: { width: 300 } },
      });
      renderer.root.findByType(Text).props.onLayout({
        nativeEvent: { layout: { width: 200 } },
      });
    });

    expect(timing).toHaveBeenLastCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({
        toValue: -200,
        duration: 10000,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    expect(start).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(() => {
      renderer.root.findByType(ScrollView).props.onLayout({
        nativeEvent: { layout: { width: 400 } },
      });
    });
    expect(stop).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenLastCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({ toValue: -200, duration: 12000 }),
    );

    await ReactTestRenderer.act(() => renderer.unmount());
    expect(stop).toHaveBeenCalledTimes(2);
  } finally {
    jest.restoreAllMocks();
  }
});
