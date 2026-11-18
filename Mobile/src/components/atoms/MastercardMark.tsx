import React from 'react';
import { StyleSheet, View } from 'react-native';

export const MastercardMark: React.FC = () => (
  <View style={styles.row} accessibilityElementsHidden>
    <View style={[styles.circle, styles.red]} />
    <View style={[styles.circle, styles.orange]} />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  red: {
    backgroundColor: '#E5173F',
  },
  orange: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    marginLeft: -14,
  },
});
