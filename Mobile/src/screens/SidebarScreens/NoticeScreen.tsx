import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

const NOTICES = [
  {
    id: 'n1',
    title: 'Security & OTP Warning',
    body: 'RoyalClubMatka never asks for your OTP, PIN, or password over call or WhatsApp.',
  },
  {
    id: 'n2',
    title: 'Withdrawal Timings',
    body: 'Minimum withdrawal is ₹500. Requests are processed daily between 10:00 AM and 10:00 PM.',
  },
  {
    id: 'n3',
    title: 'Market Cutoff Rules',
    body: 'Open-side bets close 10 minutes before Open draw. Jodi, Red Bracket & Sangam also close at Open cutoff.',
  },
];

export const NoticeScreen: React.FC = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {NOTICES.map(item => (
        <Card key={item.id} style={styles.card} mode="contained">
          <Card.Content>
            <View style={styles.titleRow}>
              <Icon
                source="bullhorn-outline"
                size={20}
                color={APP_COLORS.accent}
              />
              <Text variant="titleSmall" style={styles.title}>
                {item.title}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.body}>
              {item.body}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: APP_COLORS.accent,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  body: {
    color: APP_COLORS.textSecondary,
    lineHeight: 20,
  },
});
