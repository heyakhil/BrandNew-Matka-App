import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GradientButton } from '../atoms/GradientButton';
import { IconCircle } from '../atoms/IconCircle';
import { APP_COLORS } from '../../theme/paperTheme';

interface QuickActionGridProps {
  onAddFunds: () => void;
  onWithdraw: () => void;
  onInvite: () => void;
}

interface QuickAction {
  label: string;
  icon: string;
  onPress: () => void;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onAddFunds,
  onWithdraw,
  onInvite,
}) => {
  const actions: QuickAction[] = [
    { label: 'Add Funds', icon: 'bank', onPress: onAddFunds },
    { label: 'Withdrawal', icon: 'cash-multiple', onPress: onWithdraw },
    { label: 'Invite & Earn', icon: 'account-cash', onPress: onInvite },
  ];

  return (
    <View style={styles.grid}>
      {actions.map(action => (
        <GradientButton
          key={action.label}
          label={action.label}
          onPress={action.onPress}
          height={58}
          fontSize={16}
          style={styles.cell}
          leading={
            <IconCircle
              icon={action.icon}
              size={58}
              backgroundColor={APP_COLORS.white}
              iconColor={APP_COLORS.gradientStart}
              borderColor={APP_COLORS.gradientStart}
            />
          }
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 8,
    rowGap: 14,
    paddingHorizontal: 8,
    paddingTop: 14,
  },
  cell: {
    width: '48.5%',
  },
});
