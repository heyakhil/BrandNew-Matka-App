import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Icon,
  Modal,
  Portal,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type {
  SidebarScreenKey,
  TabKey,
  UserProfile,
} from '../../types/matka';

interface AppDrawerModalProps {
  visible: boolean;
  onDismiss: () => void;
  profile: UserProfile;
  onOpenScreen: (screen: SidebarScreenKey) => void;
  onTabPress: (tab: TabKey) => void;
  onShareApp: () => void;
  onLogoutPress: () => void;
}

interface SidebarOption {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

const DRAWER_GRADIENT: string[] = [APP_COLORS.primaryBackground, '#EFEFEF'];

export const AppDrawerModal: React.FC<AppDrawerModalProps> = ({
  visible,
  onDismiss,
  profile,
  onOpenScreen,
  onTabPress,
  onShareApp,
  onLogoutPress,
}) => {
  const openAndClose = (cb: () => void): (() => void) => {
    return () => {
      onDismiss();
      cb();
    };
  };

  const options: SidebarOption[] = [
    { id: 'home', label: 'Home', icon: 'home-outline', action: openAndClose(() => onTabPress('home')) },
    { id: 'bids', label: 'My Bids', icon: 'gavel', action: openAndClose(() => onTabPress('allBids')) },
    { id: 'passbook', label: 'Passbook', icon: 'credit-card-outline', action: openAndClose(() => onTabPress('history')) },
    { id: 'chat', label: 'Chat', icon: 'chat-outline', action: openAndClose(() => onTabPress('chat')) },
    { id: 'funds', label: 'Funds', icon: 'bank-outline', action: openAndClose(() => onTabPress('wallet')) },
    { id: 'notice', label: 'Notice Board / Rules', icon: 'alert-outline', action: openAndClose(() => onOpenScreen('notice')) },
    { id: 'rates', label: 'Game Rates', icon: 'star-four-points-outline', action: openAndClose(() => onOpenScreen('gameRates')) },
    { id: 'timing', label: 'Game Timing', icon: 'clock-outline', action: openAndClose(() => onOpenScreen('gameTiming')) },
    { id: 'charts', label: 'Charts', icon: 'chart-timeline-variant', action: openAndClose(() => onOpenScreen('gameChart')) },
    { id: 'password', label: 'Change Password', icon: 'lock-outline', action: openAndClose(() => onOpenScreen('changePassword')) },
    { id: 'invite', label: 'Invite And Earn', icon: 'star-four-points-outline', action: openAndClose(onShareApp) },
    { id: 'share', label: 'Share Application', icon: 'share-outline', action: openAndClose(onShareApp) },
    { id: 'logout', label: 'Logout', icon: 'power', action: openAndClose(onLogoutPress) },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}>
        <LinearGradient colors={DRAWER_GRADIENT} style={styles.drawer}>
          <TouchableRipple
            onPress={openAndClose(() => onOpenScreen('profile'))}
            style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.avatar}>
                <Icon source="account-outline" size={52} color={APP_COLORS.textPrimary} />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.userName} numberOfLines={1}>
                  {profile.name}
                </Text>
                <Text style={styles.phone}>{profile.phone}</Text>
              </View>
            </View>
          </TouchableRipple>

          <View style={styles.divider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map(opt => (
              <TouchableRipple key={opt.id} onPress={opt.action} style={styles.row}>
                <View style={styles.rowContent}>
                  <Icon source={opt.icon} size={28} color={APP_COLORS.textPrimary} />
                  <Text style={styles.rowLabel}>{opt.label}</Text>
                </View>
              </TouchableRipple>
            ))}
          </ScrollView>
        </LinearGradient>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    width: '72%',
    maxWidth: 300,
    height: '100%',
    justifyContent: 'flex-start',
  },
  drawer: {
    flex: 1,
    paddingTop: 36,
  },
  profileCard: {
    marginHorizontal: 14,
    borderRadius: 18,
    backgroundColor: APP_COLORS.white,
    elevation: 4,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: APP_COLORS.primaryBackground,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
  },
  userName: {
    color: APP_COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  phone: {
    color: APP_COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
    marginVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  rowLabel: {
    color: APP_COLORS.textSecondary,
    fontSize: 15,
  },
});
