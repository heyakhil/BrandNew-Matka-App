import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ActivityIndicator, Text } from 'react-native-paper';
import { APP_COLORS, BRAND_GRADIENT } from '../../theme/paperTheme';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  leading?: React.ReactNode;
  height?: number;
  fontSize?: number;
  contentPadding?: number;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  onPress,
  leading,
  height = 48,
  fontSize = 15,
  contentPadding = 10,
  disabled = false,
  loading = false,
  style,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled: disabled || loading, busy: loading }}
    disabled={disabled || loading}
    onPress={onPress}
    style={[
      styles.shadow,
      { borderRadius: height / 2 },
      (disabled || loading) && styles.disabled,
      style,
    ]}>
    <LinearGradient
      colors={BRAND_GRADIENT}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.gradient, { height, borderRadius: height / 2, paddingHorizontal: contentPadding }]}>
      {leading}
      {loading ? (
        <ActivityIndicator color={APP_COLORS.white} size="small" />
      ) : (
        <Text
          numberOfLines={1}
          style={[styles.label, { fontSize }, leading ? styles.labelWithLeading : null]}>
          {label}
        </Text>
      )}
    </LinearGradient>
  </Pressable>
);

const styles = StyleSheet.create({
  shadow: {
    elevation: 4,
    shadowColor: APP_COLORS.dark,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  label: {
    color: APP_COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelWithLeading: {
    flexShrink: 1,
    marginLeft: 4,
  },
  disabled: {
    opacity: 0.5,
  },
});
