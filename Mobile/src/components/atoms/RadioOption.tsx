import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

interface RadioOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const RadioOption: React.FC<RadioOptionProps> = ({
  label,
  selected,
  onPress,
}) => (
  <Pressable
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    onPress={onPress}
    style={styles.row}>
    <View style={styles.ring}>
      {selected && <View style={styles.dot} />}
    </View>
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ring: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: APP_COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: APP_COLORS.gradientStart,
  },
  label: {
    color: APP_COLORS.textPrimary,
    fontSize: 18,
  },
});
