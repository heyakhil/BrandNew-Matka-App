import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

interface IconCircleProps {
  icon: string;
  size: number;
  backgroundColor: string;
  iconColor: string;
  borderColor?: string;
}

export const IconCircle: React.FC<IconCircleProps> = ({
  icon,
  size,
  backgroundColor,
  iconColor,
  borderColor,
}) => (
  <View
    style={[
      styles.circle,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        borderColor,
        borderWidth: borderColor ? 3 : 0,
      },
    ]}>
    <Icon source={icon} size={size * 0.55} color={iconColor} />
  </View>
);

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
