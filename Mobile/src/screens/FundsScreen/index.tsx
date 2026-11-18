import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { MenuListItem } from '../../components/molecules/MenuListItem';
import type {
  BankDetails,
  FundsSubView,
  UserProfile,
  WalletTransaction,
} from '../../types/matka';
import { PassbookScreen } from '../PassbookScreen';
import { AddFundForm } from './AddFundForm';
import { PaymentDetailsForm } from './PaymentDetailsForm';
import { styles } from './styles';
import { WithdrawForm } from './WithdrawForm';

interface FundsScreenProps {
  profile: UserProfile;
  balanceRupees: number;
  transactions: WalletTransaction[];
  bankDetails: BankDetails;
  subView: FundsSubView;
  onSubViewChange: (view: FundsSubView) => void;
  onAddFund: (amount: number) => void;
  onWithdrawFund: (amount: number) => void;
  onSaveBankDetails: (details: BankDetails) => void;
  onSupportPress: () => void;
}

interface FundsMenuItem {
  title: string;
  subtitle: string;
  icon: string;
  destination: Exclude<FundsSubView, 'menu'>;
}

const MENU_ITEMS: FundsMenuItem[] = [
  {
    title: 'Add Fund',
    subtitle: 'You can add fund to your wallet',
    icon: 'cash-plus',
    destination: 'addFund',
  },
  {
    title: 'Withdraw Fund',
    subtitle: 'You can withdraw winnings',
    icon: 'cash-minus',
    destination: 'withdraw',
  },
  {
    title: 'Add Bank Details',
    subtitle: 'You can add your bank details for withdrawals',
    icon: 'bank',
    destination: 'bank',
  },
  {
    title: 'Add UPI Details',
    subtitle: 'You can add your UPI details for withdrawals',
    icon: 'qrcode',
    destination: 'upi',
  },
  {
    title: 'Fund Deposit History',
    subtitle: 'You can see history of your deposit',
    icon: 'text-box-plus-outline',
    destination: 'depositHistory',
  },
  {
    title: 'Fund Withdraw History',
    subtitle: 'You can see history of your fund withdrawals',
    icon: 'file-clock-outline',
    destination: 'withdrawHistory',
  },
];

export const FundsScreen: React.FC<FundsScreenProps> = ({
  profile,
  balanceRupees,
  transactions,
  bankDetails,
  subView,
  onSubViewChange,
  onAddFund,
  onWithdrawFund,
  onSaveBankDetails,
  onSupportPress,
}) => {
  const depositTransactions = useMemo(
    () => transactions.filter(t => t.type === 'deposit'),
    [transactions],
  );
  const withdrawTransactions = useMemo(
    () => transactions.filter(t => t.type === 'withdraw'),
    [transactions],
  );

  switch (subView) {
    case 'addFund':
      return (
        <AddFundForm
          profile={profile}
          balanceRupees={balanceRupees}
          onSubmit={amount => {
            onAddFund(amount);
            onSubViewChange('menu');
          }}
        />
      );
    case 'withdraw':
      return (
        <WithdrawForm
          profile={profile}
          balanceRupees={balanceRupees}
          bankDetails={bankDetails}
          onSupportPress={onSupportPress}
          onDecline={() => onSubViewChange('menu')}
          onSubmit={amount => {
            onWithdrawFund(amount);
            onSubViewChange('menu');
          }}
        />
      );
    case 'bank':
    case 'upi':
      return (
        <PaymentDetailsForm
          key={subView}
          kind={subView}
          bankDetails={bankDetails}
          onSave={details => {
            onSaveBankDetails(details);
            onSubViewChange('menu');
          }}
        />
      );
    case 'depositHistory':
      return (
        <PassbookScreen
          transactions={depositTransactions}
          emptyText="No deposits found"
        />
      );
    case 'withdrawHistory':
      return (
        <PassbookScreen
          transactions={withdrawTransactions}
          emptyText="No withdrawals found"
        />
      );
    default:
      return (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {MENU_ITEMS.map(({ destination, ...item }) => (
            <MenuListItem
              key={destination}
              {...item}
              onPress={() => onSubViewChange(destination)}
            />
          ))}
        </ScrollView>
      );
  }
};
