import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import { IconCircle } from '../atoms/IconCircle';

interface PillInputProps {
  value: string;
  onChangeText: (value: string) => void;
  icon?: string;
  placeholder?: string;
  keyboardType?: 'number-pad' | 'default';
  autoCapitalize?: 'none' | 'characters';
  maxLength?: number;
  error?: string | null;
}

export const PillInput: React.FC<PillInputProps> = ({
  value,
  onChangeText,
  icon = 'cash-plus',
  placeholder = 'Enter Amount',
  keyboardType = 'number-pad',
  autoCapitalize = 'none',
  maxLength,
  error,
}) => (
  <View>
    <View style={styles.pill}>
      <IconCircle
        icon={icon}
        size={48}
        backgroundColor="#FBB92D"
        iconColor={APP_COLORS.white}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8A8A"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        accessibilityLabel={placeholder}
        style={styles.input}
      />
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    padding: 6,
    borderRadius: 30,
    backgroundColor: APP_COLORS.secondary,
    elevation: 3,
    shadowColor: APP_COLORS.dark,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
  },
  error: {
    color: APP_COLORS.danger,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 16,
  },
});
