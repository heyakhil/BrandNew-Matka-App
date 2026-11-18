import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

interface PromoHeroBannerProps {
  onRatesPress: () => void;
}

export const PromoHeroBanner: React.FC<PromoHeroBannerProps> = ({
  onRatesPress,
}) => {
  return (
    <Card style={styles.card} mode="contained">
      <Card.Content style={styles.content}>
        <View style={styles.leftColumn}>
          <Text variant="labelSmall" style={styles.eyebrow}>
            ROYALCLUBMATKA OFFICIAL
          </Text>
          <Text variant="titleLarge" style={styles.headline}>
            FULL RATES. FULL THRILL!
          </Text>
          <Text variant="bodySmall" style={styles.subtext}>
            Play Smart • Instant Settlement • 24×7 Support
          </Text>
        </View>
        <Button
          mode="contained"
          compact
          onPress={onRatesPress}
          buttonColor={APP_COLORS.accent}
          textColor={APP_COLORS.primaryBackground}
          labelStyle={styles.ctaLabel}
          style={styles.ctaButton}>
          Win Rates
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.accent,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
  },
  leftColumn: {
    flex: 1,
  },
  eyebrow: {
    color: APP_COLORS.accent,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headline: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtext: {
    color: APP_COLORS.textSecondary,
    marginTop: 4,
  },
  ctaButton: {
    borderRadius: 10,
  },
  ctaLabel: {
    fontWeight: '700',
    fontSize: 12,
  },
});
