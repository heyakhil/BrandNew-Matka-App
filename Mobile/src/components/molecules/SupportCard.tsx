import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { SUPPORT_HOURS, SUPPORT_PHONE_DISPLAY } from '../../constants/support';
import { APP_COLORS } from '../../theme/paperTheme';

interface SupportCardProps {
  onPress: () => void;
}

export const SupportCard: React.FC<SupportCardProps> = ({ onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Contact support on WhatsApp"
    onPress={onPress}
    style={styles.card}>
    <Text style={styles.heading}>
      Call or WhatsApp for Withdraw Related Queries
    </Text>
    <View style={styles.row}>
      <Icon source="whatsapp" size={64} color="#25D366" />
      <View style={styles.info}>
        <Text style={styles.hours}>{SUPPORT_HOURS}</Text>
        <Text style={styles.phone}>{SUPPORT_PHONE_DISPLAY}</Text>
      </View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
    elevation: 3,
    shadowColor: APP_COLORS.dark,
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  heading: {
    color: APP_COLORS.textPrimary,
    fontSize: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  info: {
    flex: 1,
  },
  hours: {
    color: APP_COLORS.success,
    fontSize: 22,
  },
  phone: {
    color: APP_COLORS.textPrimary,
    fontSize: 15,
  },
});
