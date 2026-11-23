import React from 'react';
import { StyleSheet, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

interface AuthFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  maxLength?: number;
  textContentType?: TextInputProps['textContentType'];
  placeholder?: string;
}

export const AuthField: React.FC<AuthFieldProps> = ({ label, ...inputProps }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...inputProps}
      accessibilityLabel={label}
      mode="flat"
      underlineColor="transparent"
      activeUnderlineColor="transparent"
      selectionColor={APP_COLORS.gradientStart}
      style={styles.input}
      contentStyle={styles.inputContent}
    />
  </View>
);

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { color: APP_COLORS.textPrimary, fontSize: 16 },
  input: { height: 56, borderRadius: 16, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  inputContent: { fontSize: 17 },
});
