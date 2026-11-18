import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Chip,
  HelperText,
  Icon,
  IconButton,
  Modal,
  Portal,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { WalletActionCard } from '../../components/molecules/WalletActionCard';
import { APP_COLORS } from '../../theme/paperTheme';
import type { BankDetails, WalletTransaction } from '../../types/matka';
import { formatRupees } from '../../utils/matkaHelpers';
import { styles } from './styles';

interface WalletScreenProps {
  balanceRupees: number;
  transactions: WalletTransaction[];
  bankDetails: BankDetails;
  subView: WalletSubView;
  onSubViewChange: (view: WalletSubView) => void;
  onAddFund: (amount: number) => void;
  onWithdrawFund: (amount: number) => void;
  onSaveBankDetails: (details: BankDetails) => void;
}

type WalletSheetKind = 'add' | 'withdraw' | null;
export type WalletSubView = 'menu' | 'history' | 'addHistory' | 'bank';

const QUICK_ADD_AMOUNTS = [100, 500, 1000, 5000];

export const WalletScreen: React.FC<WalletScreenProps> = ({
  balanceRupees,
  transactions,
  bankDetails,
  subView,
  onSubViewChange: setSubView,
  onAddFund,
  onWithdrawFund,
  onSaveBankDetails,
}) => {
  const [sheetKind, setSheetKind] = useState<WalletSheetKind>(null);
  const [amountText, setAmountText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const [accNo, setAccNo] = useState(bankDetails.accountNumber);
  const [holder, setHolder] = useState(bankDetails.accountHolder);
  const [ifsc, setIfsc] = useState(bankDetails.ifscCode);
  const [upi, setUpi] = useState(bankDetails.upiId);

  const hasBankDetails = Boolean(
    bankDetails.accountNumber.trim() || bankDetails.upiId.trim(),
  );

  const depositTransactions = useMemo(
    () => transactions.filter(t => t.type === 'deposit'),
    [transactions],
  );

  const pageSize = 5;
  const pagedTransactions = useMemo(() => {
    const start = page * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, page]);

  const openSheet = (kind: WalletSheetKind): void => {
    setErrorText(null);
    setAmountText('');
    setSheetKind(kind);
  };

  const handleSubmitSheet = (): void => {
    const amount = Number(amountText);
    const min = sheetKind === 'withdraw' ? 500 : 100;
    if (!Number.isFinite(amount) || amount < min) {
      setErrorText(`Minimum amount is ₹${min}.`);
      return;
    }
    if (sheetKind === 'withdraw' && amount > balanceRupees) {
      setErrorText('Insufficient wallet balance.');
      return;
    }
    if (sheetKind === 'add') {
      onAddFund(amount);
    } else if (sheetKind === 'withdraw') {
      onWithdrawFund(amount);
    }
    setSheetKind(null);
    setAmountText('');
  };

  const handleSaveBank = (): void => {
    if (!holder.trim() || (!accNo.trim() && !upi.trim())) {
      setErrorText('Enter account name and account number or UPI ID.');
      return;
    }
    onSaveBankDetails({
      accountHolder: holder.trim(),
      bankName: bankDetails.bankName,
      accountNumber: accNo.trim(),
      ifscCode: ifsc.trim().toUpperCase(),
      upiId: upi.trim(),
    });
    setErrorText(null);
    setSubView('menu');
  };

  if (subView === 'history') {
    const startNum = transactions.length === 0 ? 0 : page * pageSize + 1;
    const endNum = Math.min((page + 1) * pageSize, transactions.length);

    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <IconButton
            icon="arrow-left"
            iconColor={APP_COLORS.textPrimary}
            onPress={() => setSubView('menu')}
          />
          <Text variant="titleMedium" style={styles.subHeaderTitle}>
            Deposit & Withdraw History
          </Text>
          <Button
            mode="text"
            compact
            textColor={APP_COLORS.accent}
            onPress={() => setSubView('addHistory')}>
            Add Fund List
          </Button>
        </View>

        <View style={styles.paginationRow}>
          <Text variant="bodySmall" style={styles.paginationText}>
            Displaying {startNum} - {endNum} of {transactions.length} results
          </Text>
          <View style={styles.paginationBtns}>
            <IconButton
              icon="arrow-left"
              mode="contained"
              size={18}
              disabled={page === 0}
              containerColor={APP_COLORS.secondary}
              iconColor={APP_COLORS.textPrimary}
              onPress={() => setPage(p => Math.max(0, p - 1))}
            />
            <IconButton
              icon="arrow-right"
              mode="contained"
              size={18}
              disabled={endNum >= transactions.length}
              containerColor={APP_COLORS.secondary}
              iconColor={APP_COLORS.textPrimary}
              onPress={() => setPage(p => p + 1)}
            />
          </View>
        </View>

        <FlatList
          data={pagedTransactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={styles.historyCard} mode="contained">
              <Card.Content>
                <View style={styles.historyTop}>
                  <Text variant="labelLarge" style={styles.historyDate}>
                    {item.timestamp}
                  </Text>
                  <Chip
                    compact
                    style={styles.sourceChip}
                    textStyle={styles.sourceChipText}>
                    {item.status.toUpperCase()}
                  </Chip>
                </View>

                <View style={styles.tripleRow}>
                  <View style={styles.tripleCol}>
                    <Text style={styles.tripleLabel}>Before</Text>
                    <Text style={styles.tripleValue}>
                      {formatRupees(item.beforeBalance ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.tripleCol}>
                    <Text style={styles.tripleLabel}>Amount</Text>
                    <Text
                      style={[
                        styles.tripleValue,
                        {
                          color:
                            item.type === 'deposit' || item.type === 'win'
                              ? APP_COLORS.success
                              : APP_COLORS.danger,
                        },
                      ]}>
                      {formatRupees(item.amountRupees)}
                    </Text>
                  </View>
                  <View style={styles.tripleCol}>
                    <Text style={styles.tripleLabel}>After</Text>
                    <Text style={styles.tripleValue}>
                      {formatRupees(item.afterBalance ?? balanceRupees)}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestTypeRow}>
                  <Icon
                    source="wallet-outline"
                    size={20}
                    color={APP_COLORS.accent}
                  />
                  <View>
                    <Text style={styles.requestTypeLabel}>Request Type</Text>
                    <Text variant="labelLarge" style={styles.requestTypeVal}>
                      {item.title}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      </View>
    );
  }

  if (subView === 'addHistory') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <IconButton
            icon="arrow-left"
            iconColor={APP_COLORS.textPrimary}
            onPress={() => setSubView('menu')}
          />
          <Text variant="titleMedium" style={styles.subHeaderTitle}>
            Add Fund History
          </Text>
        </View>

        <FlatList
          data={depositTransactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card style={styles.emptyCard} mode="contained">
              <Card.Content>
                <Text style={styles.emptyText}>No Add Fund records yet.</Text>
              </Card.Content>
            </Card>
          }
          renderItem={({ item }) => (
            <Card style={styles.addFundCard} mode="contained">
              <View style={styles.addFundHeader}>
                <Text variant="titleSmall" style={styles.addFundHeaderText}>
                  Amount:
                </Text>
                <Text variant="titleSmall" style={styles.addFundHeaderText}>
                  {formatRupees(item.amountRupees)}
                </Text>
              </View>
              <Card.Content style={styles.addFundBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Status:</Text>
                  <Text
                    style={[
                      styles.detailVal,
                      {
                        color:
                          item.status === 'Completed'
                            ? APP_COLORS.success
                            : APP_COLORS.accent,
                      },
                    ]}>
                    {item.status}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailVal}>{item.timestamp}</Text>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      </View>
    );
  }

  if (subView === 'bank') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <IconButton
            icon="arrow-left"
            iconColor={APP_COLORS.textPrimary}
            onPress={() => setSubView('menu')}
          />
          <Text variant="titleMedium" style={styles.subHeaderTitle}>
            Bank Details
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <TextInput
            mode="outlined"
            placeholder="Enter account number"
            value={accNo}
            onChangeText={val => {
              setAccNo(val.replace(/\D/g, ''));
              setErrorText(null);
            }}
            keyboardType="number-pad"
            right={<TextInput.Icon icon="bank" color={APP_COLORS.accent} />}
            outlineStyle={styles.pillOutline}
            style={styles.pillInput}
            outlineColor={APP_COLORS.border}
            activeOutlineColor={APP_COLORS.accent}
          />
          <TextInput
            mode="outlined"
            placeholder="Enter account name"
            value={holder}
            onChangeText={val => {
              setHolder(val);
              setErrorText(null);
            }}
            right={
              <TextInput.Icon
                icon="account-outline"
                color={APP_COLORS.accent}
              />
            }
            outlineStyle={styles.pillOutline}
            style={styles.pillInput}
            outlineColor={APP_COLORS.border}
            activeOutlineColor={APP_COLORS.accent}
          />
          <TextInput
            mode="outlined"
            placeholder="Enter bank IFSC code"
            value={ifsc}
            onChangeText={val => {
              setIfsc(val);
              setErrorText(null);
            }}
            autoCapitalize="characters"
            right={
              <TextInput.Icon icon="key-outline" color={APP_COLORS.accent} />
            }
            outlineStyle={styles.pillOutline}
            style={styles.pillInput}
            outlineColor={APP_COLORS.border}
            activeOutlineColor={APP_COLORS.accent}
          />
          <TextInput
            mode="outlined"
            placeholder="Enter UPI ID (optional)"
            value={upi}
            onChangeText={val => {
              setUpi(val);
              setErrorText(null);
            }}
            right={<TextInput.Icon icon="qrcode" color={APP_COLORS.accent} />}
            outlineStyle={styles.pillOutline}
            style={styles.pillInput}
            outlineColor={APP_COLORS.border}
            activeOutlineColor={APP_COLORS.accent}
          />

          {errorText && (
            <HelperText type="error" visible={Boolean(errorText)}>
              {errorText}
            </HelperText>
          )}

          <Button
            mode="contained"
            icon="bank"
            onPress={handleSaveBank}
            buttonColor={APP_COLORS.accent}
            textColor={APP_COLORS.primaryBackground}
            style={styles.primaryBtn}
            labelStyle={styles.primaryBtnLabel}>
            Update Bank
          </Button>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <WalletActionCard
          title="Add Fund"
          subtitle="Instant deposit via UPI, NetBanking & QR"
          icon="cash-plus"
          accentColor={APP_COLORS.pink}
          onPress={() => openSheet('add')}
        />

        <WalletActionCard
          title="Withdraw Fund"
          subtitle="Fast withdrawal to your linked bank or UPI"
          icon="bank-transfer-out"
          accentColor={APP_COLORS.purple}
          onPress={() => openSheet('withdraw')}
        />

        <WalletActionCard
          title="Deposit & Withdraw History"
          subtitle={`${transactions.length} recent wallet transactions`}
          icon="file-document-outline"
          accentColor={APP_COLORS.accent}
          onPress={() => setSubView('history')}
        />

        <WalletActionCard
          title="Add Fund History"
          subtitle={`${depositTransactions.length} deposit requests`}
          icon="receipt-text-outline"
          accentColor={APP_COLORS.info}
          onPress={() => setSubView('addHistory')}
        />

        <WalletActionCard
          title="Add Bank Details"
          subtitle={
            hasBankDetails
              ? `Saved: ${bankDetails.upiId || bankDetails.accountNumber}`
              : 'Link bank account or UPI ID for payouts'
          }
          icon="bank-outline"
          accentColor={APP_COLORS.success}
          onPress={() => setSubView('bank')}
        />
      </ScrollView>

      <Portal>
        <Modal
          visible={Boolean(sheetKind)}
          onDismiss={() => setSheetKind(null)}
          contentContainerStyle={styles.sheetModal}>
          <Surface style={styles.sheetSurface} elevation={5}>
            <View style={styles.sheetHandle} />
            <Text variant="titleLarge" style={styles.sheetTitle}>
              {sheetKind === 'add' ? 'Add Fund' : 'Withdraw Fund'}
            </Text>

            {sheetKind === 'add' && (
              <Avatar.Icon
                size={68}
                icon="credit-card-plus-outline"
                color={APP_COLORS.accent}
                style={styles.illustrationBadge}
              />
            )}

            <Surface style={styles.balanceBox} elevation={0}>
              <View style={styles.balanceIconWrap}>
                <Icon
                  source="wallet-outline"
                  size={22}
                  color={APP_COLORS.accent}
                />
              </View>
              <View>
                <Text variant="titleMedium" style={styles.balanceAmount}>
                  {formatRupees(balanceRupees)}
                </Text>
                <Text variant="bodySmall" style={styles.balanceCaption}>
                  Total Wallet Balance
                </Text>
              </View>
            </Surface>

            <Text variant="labelLarge" style={styles.fieldLabel}>
              Amount*
            </Text>
            <TextInput
              mode="outlined"
              placeholder={
                sheetKind === 'add'
                  ? 'Enter amount (min: ₹100)'
                  : 'Enter amount (min: ₹500)'
              }
              value={amountText}
              onChangeText={val => {
                setAmountText(val.replace(/\D/g, ''));
                setErrorText(null);
              }}
              keyboardType="number-pad"
              right={
                <TextInput.Icon
                  icon="wallet-outline"
                  color={APP_COLORS.accent}
                />
              }
              outlineStyle={styles.pillOutline}
              style={styles.pillInput}
              outlineColor={APP_COLORS.border}
              activeOutlineColor={APP_COLORS.accent}
            />

            {sheetKind === 'add' && (
              <View style={styles.quickChips}>
                {QUICK_ADD_AMOUNTS.map(amt => (
                  <Chip
                    key={amt}
                    compact
                    onPress={() => {
                      setAmountText(String(amt));
                      setErrorText(null);
                    }}
                    style={styles.quickChip}
                    textStyle={styles.quickChipText}>
                    +₹{amt}
                  </Chip>
                ))}
              </View>
            )}

            {errorText && (
              <HelperText type="error" visible={Boolean(errorText)}>
                {errorText}
              </HelperText>
            )}

            {sheetKind === 'withdraw' && !hasBankDetails ? (
              <Button
                mode="contained"
                onPress={() => {
                  setSheetKind(null);
                  setSubView('bank');
                }}
                buttonColor={APP_COLORS.accent}
                textColor={APP_COLORS.primaryBackground}
                style={styles.primaryBtn}
                labelStyle={styles.primaryBtnLabel}>
                Update Bank Details
              </Button>
            ) : (
              <Button
                mode="contained"
                disabled={!amountText}
                onPress={handleSubmitSheet}
                buttonColor={
                  amountText ? APP_COLORS.accent : APP_COLORS.border
                }
                textColor={
                  amountText
                    ? APP_COLORS.primaryBackground
                    : APP_COLORS.textSecondary
                }
                style={styles.primaryBtn}
                labelStyle={styles.primaryBtnLabel}>
                {sheetKind === 'add' ? 'Send Request' : 'Withdraw Request'}
              </Button>
            )}

            {sheetKind === 'withdraw' && (
              <View style={styles.rulesBox}>
                <Text variant="bodySmall" style={styles.ruleText}>
                  • Withdrawal limit is ₹500 to ₹99,999
                </Text>
                <Text variant="bodySmall" style={styles.ruleText}>
                  • Withdrawal Request timing is 10:30 AM to 10:30 PM
                </Text>
              </View>
            )}
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
};
