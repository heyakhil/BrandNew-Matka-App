import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Card, IconButton, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

interface WalletActionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  onPress: () => void;
}

export const WalletActionCard: React.FC<WalletActionCardProps> = ({
  title,
  subtitle,
  icon,
  accentColor,
  onPress,
}) => {
  return (
    <Card
      style={[styles.card, { borderLeftColor: accentColor }]}
      mode="contained"
      onPress={onPress}>
      <Card.Content style={styles.content}>
        <Avatar.Icon
          size={44}
          icon={icon}
          color={APP_COLORS.textPrimary}
          style={{ backgroundColor: accentColor }}
        />
        <View style={styles.textWrap}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          size={22}
          iconColor={APP_COLORS.textSecondary}
          onPress={onPress}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderLeftWidth: 5,
    marginBottom: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
});
