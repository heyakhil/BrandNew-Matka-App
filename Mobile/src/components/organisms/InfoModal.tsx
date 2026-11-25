import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Modal, Portal, Surface, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import { GradientButton } from '../atoms/GradientButton';

export interface InfoModalRow {
  label: string;
  value: string;
}

export interface InfoModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  subtitle?: string;
  message?: string;
  rows?: InfoModalRow[];
  buttonLabel?: string;
  iconName?: string;
  iconColor?: string;
  iconBgColor?: string;
  titleColor?: string;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  onDismiss,
  title,
  subtitle,
  message,
  rows,
  buttonLabel = 'OK',
  iconName = 'close',
  iconColor = '#F42A35',
  iconBgColor = '#FCE8EA',
  titleColor = '#B8254F',
}) => (
  <Portal>
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.wrapper}>
      <Surface style={styles.card} elevation={5}>
        <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
          <Icon source={iconName} size={32} color={iconColor} />
        </View>

        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>

        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {rows && rows.length > 0 ? (
          <View style={styles.rowsContainer}>
            {rows.map(row => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <GradientButton
          label={buttonLabel}
          onPress={onDismiss}
          height={46}
          fontSize={16}
          style={styles.button}
        />
      </Surface>
    </Modal>
  </Portal>
);

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 24,
  },
  card: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 19,
    fontWeight: '800',
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  rowsContainer: {
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 6,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    fontSize: 14.5,
    color: APP_COLORS.textPrimary,
    fontWeight: '400',
  },
  rowValue: {
    fontSize: 14.5,
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  button: {
    width: '100%',
    marginTop: 22,
  },
});
