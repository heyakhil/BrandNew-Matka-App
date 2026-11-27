import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

export interface ChartOptionCardProps {
  title: string;
  subtitle: string;
  backgroundColor: string;
  iconBadgeColor: string;
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
}

export const ChartOptionCard: React.FC<ChartOptionCardProps> = ({
  title,
  subtitle,
  backgroundColor,
  iconBadgeColor,
  icon,
  onPress,
  accessibilityLabel,
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? `${title} chart`}
    style={[styles.card, { backgroundColor }]}>
    <View style={[styles.iconBadge, { backgroundColor: iconBadgeColor }]}>
      {icon}
    </View>
    <View style={styles.textBlock}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 176,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    marginTop: 24,
  },
  title: {
    color: APP_COLORS.white,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 24,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 2,
  },
});
