import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

interface AmountChipsProps {
  amounts: number[];
  onSelect: (amount: number) => void;
}

export const AmountChips: React.FC<AmountChipsProps> = ({
  amounts,
  onSelect,
}) => (
  <View style={styles.grid}>
    {amounts.map(amount => (
      <Pressable
        key={amount}
        accessibilityRole="button"
        accessibilityLabel={`Add ${amount}`}
        onPress={() => onSelect(amount)}
        style={styles.chip}>
        <Text style={styles.label}>{amount}</Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 8,
    marginTop: 16,
  },
  chip: {
    width: '30.5%',
    height: 52,
    borderRadius: 26,
    backgroundColor: APP_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: APP_COLORS.dark,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    color: APP_COLORS.textPrimary,
    fontSize: 18,
  },
});
