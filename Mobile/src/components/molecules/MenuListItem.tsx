import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

interface MenuListItemProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

export const MenuListItem: React.FC<MenuListItemProps> = ({
  title,
  subtitle,
  icon,
  onPress,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={title}
    onPress={onPress}
    style={styles.card}>
    <View style={styles.iconWrap}>
      <Icon source={icon} size={34} color={APP_COLORS.accent} />
    </View>
    <View style={styles.textWrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    <View style={styles.chevron}>
      <Icon source="chevron-right" size={24} color={APP_COLORS.accent} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 3,
    shadowColor: APP_COLORS.dark,
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  iconWrap: {
    width: 44,
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    color: APP_COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: APP_COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 15,
    marginTop: 2,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
