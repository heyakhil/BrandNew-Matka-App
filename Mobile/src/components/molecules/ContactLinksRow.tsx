import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import {
  SUPPORT_PHONE_DISPLAY,
  TELEGRAM_DISPLAY,
} from '../../constants/support';
import { APP_COLORS } from '../../theme/paperTheme';

interface ContactLinksRowProps {
  onWhatsAppPress: () => void;
  onTelegramPress: () => void;
}

export const ContactLinksRow: React.FC<ContactLinksRowProps> = ({
  onWhatsAppPress,
  onTelegramPress,
}) => (
  <View style={styles.row}>
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Chat on WhatsApp"
      onPress={onWhatsAppPress}
      style={styles.link}>
      <Icon source="whatsapp" size={24} color="#25D366" />
      <Text style={styles.text}>{SUPPORT_PHONE_DISPLAY}</Text>
    </Pressable>
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Join Telegram"
      onPress={onTelegramPress}
      style={styles.link}>
      <Icon source="send-circle" size={26} color="#2AABEE" />
      <Text style={styles.text} numberOfLines={1}>
        {TELEGRAM_DISPLAY}
      </Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  text: {
    color: APP_COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 17,
  },
});
