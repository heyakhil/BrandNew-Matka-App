import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

interface NoticeTickerProps {
  message?: string;
}

const SCROLL_SPEED = 50;

export const NoticeTicker: React.FC<NoticeTickerProps> = ({
  message = 'RoyalClubMatka never asks for your OTP — Team RoyalClubMatka',
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [viewportWidth, setViewportWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (viewportWidth <= 0 || textWidth <= 0) {
      return;
    }

    translateX.setValue(viewportWidth);
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -textWidth,
        duration: ((viewportWidth + textWidth) / SCROLL_SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    animation.start();

    return () => animation.stop();
  }, [message, textWidth, translateX, viewportWidth]);

  return (
    <Surface
      style={styles.bar}
      elevation={0}
      accessible
      accessibilityLabel={message}>
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onLayout={event => setViewportWidth(event.nativeEvent.layout.width)}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Text
            variant="labelMedium"
            numberOfLines={1}
            style={styles.text}
            onLayout={event => setTextWidth(event.nativeEvent.layout.width)}>
            {message}
          </Text>
        </Animated.View>
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#161E2E',
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  text: {
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
});
