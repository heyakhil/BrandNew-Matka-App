import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
    <Icon source="star-four-points" size={27} color={APP_COLORS.accent} />
    <View style={styles.copy}>
      <Text style={styles.headline}>ROYAL CLUB</Text>
      <Text style={styles.subtitle}>— Welcome to Matka —</Text>
    </View>
    <Icon source="star-four-points" size={27} color={APP_COLORS.accent} />
  </Pressable>
);

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 78,
    backgroundColor: '#FFD495',
  },
  copy: { alignItems: 'center' },
  headline: {
    color: '#9D4E00',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: { color: '#A85B05', fontSize: 14, fontWeight: '700', fontStyle: 'italic' },
});
