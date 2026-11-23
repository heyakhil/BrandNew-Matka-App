import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_GRADIENT } from '../../theme/paperTheme';

interface GradientCircleProps {
  size: number;
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  muted?: boolean;
  accessibilityLabel?: string;
}

export const GradientCircle: React.FC<GradientCircleProps> = ({
  size,
  children,
  onPress,
  disabled = false,
  muted = false,
  accessibilityLabel,
}) => (
  <Pressable
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={accessibilityLabel}
    disabled={disabled || !onPress}
    onPress={onPress}
    style={disabled || muted ? styles.disabled : undefined}>
    <LinearGradient
      colors={BRAND_GRADIENT}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      {children}
    </LinearGradient>
  </Pressable>
);

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.55,
  },
});
