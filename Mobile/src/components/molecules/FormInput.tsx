import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import type { TextInputProps } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

export interface FormInputProps extends Omit<TextInputProps, 'label' | 'mode'> {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  containerStyle,
  labelStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      <Text
        variant="labelLarge"
        numberOfLines={1}
        style={[styles.label, focused && styles.labelFocused, labelStyle]}>
        {label}
      </Text>
      <TextInput
        mode="outlined"
        accessibilityLabel={label}
        {...rest}
        onFocus={args => {
          setFocused(true);
          onFocus?.(args);
        }}
        onBlur={args => {
          setFocused(false);
          onBlur?.(args);
        }}
        style={[styles.input, style]}
        textColor={APP_COLORS.textPrimary}
        cursorColor={APP_COLORS.accent}
        selectionColor={APP_COLORS.accentMuted}
        outlineColor={APP_COLORS.border}
        activeOutlineColor={APP_COLORS.accent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    color: APP_COLORS.textSecondary,
    fontWeight: '700',
    marginLeft: 4,
    marginBottom: 6,
  },
  labelFocused: {
    color: APP_COLORS.textPrimary,
  },
  input: {
    backgroundColor: APP_COLORS.secondary,
  },
});
