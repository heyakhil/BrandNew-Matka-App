import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

interface PromoHeroBannerProps {
  onRatesPress: () => void;
}

export const PromoHeroBanner: React.FC<PromoHeroBannerProps> = ({
  onRatesPress,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="View win rates"
    onPress={onRatesPress}
    style={styles.banner}>
    <Icon source="trophy-outline" size={34} color={APP_COLORS.accent} />
    <Text style={styles.headline}>FULL RATES. FULL THRILL!</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 138,
    backgroundColor: '#17606B',
  },
  headline: {
    color: APP_COLORS.white,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
