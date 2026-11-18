import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { WITHDRAW_TERMS } from '../../constants/funds';
import { APP_COLORS } from '../../theme/paperTheme';
import { GradientButton } from '../atoms/GradientButton';

interface TermsDialogProps {
  visible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export const TermsDialog: React.FC<TermsDialogProps> = ({
  visible,
  onAccept,
  onDismiss,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onDismiss}>
    <View style={styles.backdrop}>
      <View style={styles.dialog}>
        <Text style={styles.title}>Terms and Conditions</Text>
        <View style={styles.terms}>
          {WITHDRAW_TERMS.map(term => (
            <View key={term} style={styles.term}>
              <Icon source="thumb-up" size={22} color="#F5B21F" />
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>
        <GradientButton label="ACCEPT" onPress={onAccept} fontSize={16} />
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  dialog: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 16,
    padding: 28,
  },
  title: {
    color: APP_COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  terms: {
    gap: 6,
    marginVertical: 24,
  },
  term: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  termText: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontSize: 17,
  },
});
