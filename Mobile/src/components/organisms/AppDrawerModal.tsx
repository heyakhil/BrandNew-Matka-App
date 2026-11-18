import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Divider,
  Icon,
  IconButton,
  Modal,
  Portal,
  Surface,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { SidebarScreenKey, UserProfile } from '../../types/matka';

interface AppDrawerModalProps {
  visible: boolean;
  onDismiss: () => void;
  profile: UserProfile;
  onOpenScreen: (screen: SidebarScreenKey) => void;
  onShareApp: () => void;
  onJoinTelegram: () => void;
  onLogoutPress: () => void;
}

interface SidebarOption {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export const AppDrawerModal: React.FC<AppDrawerModalProps> = ({
  visible,
  onDismiss,
  profile,
  onOpenScreen,
  onShareApp,
  onJoinTelegram,
  onLogoutPress,
}) => {
  const openAndClose = (cb: () => void): void => {
    onDismiss();
    cb();
  };

  const options: SidebarOption[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: 'account',
      action: () => openAndClose(() => onOpenScreen('profile')),
    },
    {
      id: 'withdrawHistory',
      label: 'Withdraw History',
      icon: 'cash-clock',
      action: () => openAndClose(() => onOpenScreen('withdrawHistory')),
    },
    {
      id: 'notice',
      label: 'Notice',
      icon: 'clipboard-text-outline',
      action: () => openAndClose(() => onOpenScreen('notice')),
    },
    {
      id: 'gameRates',
      label: 'Game Rate',
      icon: 'gamepad-variant-outline',
      action: () => openAndClose(() => onOpenScreen('gameRates')),
    },
    {
      id: 'withdrawRequest',
      label: 'Withdraw Request',
      icon: 'bank-transfer-out',
      action: () => openAndClose(() => onOpenScreen('withdrawRequest')),
    },
    {
      id: 'transaction',
      label: 'Transaction',
      icon: 'swap-horizontal-circle-outline',
      action: () => openAndClose(() => onOpenScreen('transaction')),
    },
    {
      id: 'gameTiming',
      label: 'Game Timing',
      icon: 'clock-outline',
      action: () => openAndClose(() => onOpenScreen('gameTiming')),
    },
    {
      id: 'gameChart',
      label: 'Game Chart',
      icon: 'table-large',
      action: () => openAndClose(() => onOpenScreen('gameChart')),
    },
    {
      id: 'changePassword',
      label: 'Change Password',
      icon: 'key-variant',
      action: () => openAndClose(() => onOpenScreen('changePassword')),
    },
    {
      id: 'share',
      label: 'Share',
      icon: 'share-variant',
      action: () => openAndClose(onShareApp),
    },
    {
      id: 'telegram',
      label: 'Join Telegram',
      icon: 'send',
      action: () => openAndClose(onJoinTelegram),
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      action: () => openAndClose(onLogoutPress),
    },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}>
        <Surface style={styles.drawerSurface} elevation={4}>
          <View style={styles.profileHeader}>
            <View style={styles.profileLeft}>
              <Text variant="titleLarge" style={styles.greeting}>
                Hello,
              </Text>
              <Text variant="titleMedium" style={styles.userName}>
                {profile.name}
              </Text>
              <View style={styles.phoneRow}>
                <Icon
                  source="cellphone"
                  size={15}
                  color={APP_COLORS.accent}
                />
                <Text variant="labelLarge" style={styles.pipeSep}>
                  |
                </Text>
                <Text variant="bodySmall" style={styles.phoneText}>
                  {profile.phone}
                </Text>
              </View>
            </View>

            <IconButton
              icon="close"
              mode="contained"
              size={18}
              containerColor={APP_COLORS.primaryBackground}
              iconColor={APP_COLORS.textPrimary}
              onPress={onDismiss}
              style={styles.closeBtn}
            />
          </View>

          <Divider style={styles.divider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((opt, idx) => (
              <React.Fragment key={opt.id}>
                <TouchableRipple onPress={opt.action} style={styles.rowTouch}>
                  <View style={styles.rowContent}>
                    <Avatar.Icon
                      size={32}
                      icon={opt.icon}
                      color={APP_COLORS.primaryBackground}
                      style={styles.iconCircle}
                    />
                    <Text variant="bodyMedium" style={styles.rowPipe}>
                      |
                    </Text>
                    <Text variant="bodyLarge" style={styles.rowLabel}>
                      {opt.label}
                    </Text>
                  </View>
                </TouchableRipple>
                {idx < options.length - 1 && (
                  <Divider style={styles.rowDivider} />
                )}
              </React.Fragment>
            ))}
          </ScrollView>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    width: '78%',
    maxWidth: 310,
    height: '100%',
    justifyContent: 'flex-start',
  },
  drawerSurface: {
    flex: 1,
    backgroundColor: APP_COLORS.secondary,
    borderRightWidth: 1,
    borderRightColor: APP_COLORS.border,
    paddingTop: 18,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  profileLeft: {
    flex: 1,
  },
  greeting: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  userName: {
    color: APP_COLORS.accent,
    fontWeight: '700',
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  pipeSep: {
    color: APP_COLORS.textSecondary,
  },
  phoneText: {
    color: APP_COLORS.textPrimary,
    fontWeight: '600',
  },
  closeBtn: {
    margin: 0,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  divider: {
    backgroundColor: APP_COLORS.border,
  },
  rowTouch: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    backgroundColor: APP_COLORS.accent,
  },
  rowPipe: {
    color: APP_COLORS.textSecondary,
  },
  rowLabel: {
    color: APP_COLORS.textPrimary,
    fontWeight: '600',
  },
  rowDivider: {
    backgroundColor: APP_COLORS.border,
    opacity: 0.6,
  },
});
