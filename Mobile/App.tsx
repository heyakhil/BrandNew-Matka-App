import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Linking,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  BottomNavigation,
  Button,
  Dialog,
  Icon,
  PaperProvider,
  Portal,
  Snackbar,
  Surface,
  Text,
} from 'react-native-paper';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NoticeTicker } from './src/components/molecules/NoticeTicker';
import { TopAppBar } from './src/components/molecules/TopAppBar';
import { AppDrawerModal } from './src/components/organisms/AppDrawerModal';
import { MarketChartModal } from './src/components/organisms/MarketChartModal';
import { INITIAL_MARKETS, INITIAL_TRANSACTIONS } from './src/data/mockData';
import { BidHistoryScreen } from './src/screens/BidHistoryScreen';
import { GameRatesScreen } from './src/screens/GameRatesScreen';
import { GameResultScreen } from './src/screens/GameResultScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MarketGamesScreen } from './src/screens/MarketGamesScreen';
import {
  PlayGameScreen,
  type SubmittedBidItem,
} from './src/screens/PlayGameScreen';
import { ChangePasswordScreen } from './src/screens/SidebarScreens/ChangePasswordScreen';
import {
  GameChartScreen,
  type SelectedChart,
} from './src/screens/SidebarScreens/GameChartScreen';
import { GameTimingScreen } from './src/screens/SidebarScreens/GameTimingScreen';
import { NoticeScreen } from './src/screens/SidebarScreens/NoticeScreen';
import { ProfileScreen } from './src/screens/SidebarScreens/ProfileScreen';
import { TransactionsListScreen } from './src/screens/SidebarScreens/TransactionsListScreen';
import { WithdrawFundScreen } from './src/screens/SidebarScreens/WithdrawFundScreen';
import { WalletScreen, type WalletSubView } from './src/screens/WalletScreen';
import { APP_COLORS, royalMatkaTheme } from './src/theme/paperTheme';
import type {
  BankDetails,
  BidRecord,
  MarketGameOption,
  MarketItem,
  SidebarScreenKey,
  TabKey,
  UserProfile,
  WalletTransaction,
} from './src/types/matka';
import { formatRupees } from './src/utils/matkaHelpers';

const WHATSAPP_APP_URL =
  'whatsapp://send?phone=919999999999&text=Hello%20RoyalClubMatka%20Support';
const WHATSAPP_WEB_URL =
  'https://wa.me/919999999999?text=Hello%20RoyalClubMatka%20Support';
const TELEGRAM_URL = 'https://t.me/RoyalClubMatka';

interface NavRoute {
  key: TabKey;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
}

const BOTTOM_ROUTES: NavRoute[] = [
  {
    key: 'history',
    title: 'History',
    focusedIcon: 'book-open-variant',
    unfocusedIcon: 'book-open-outline',
  },
  {
    key: 'allBids',
    title: 'All Bids',
    focusedIcon: 'history',
    unfocusedIcon: 'history',
  },
  {
    key: 'home',
    title: 'Home',
    focusedIcon: 'home',
    unfocusedIcon: 'home-outline',
  },
  {
    key: 'wallet',
    title: 'Wallet',
    focusedIcon: 'wallet',
    unfocusedIcon: 'wallet-outline',
  },
  {
    key: 'chat',
    title: 'WhatsApp',
    focusedIcon: 'whatsapp',
    unfocusedIcon: 'whatsapp',
  },
];

function AppShell(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [sidebarScreen, setSidebarScreen] = useState<SidebarScreenKey | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [walletSubView, setWalletSubView] = useState<WalletSubView>('menu');
  const [selectedChart, setSelectedChart] = useState<SelectedChart | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    name: 'Royal Club Member',
    phone: '9172264511',
    email: 'member@royalclubmatka.com',
  });
  const [balanceRupees, setBalanceRupees] = useState(1000);
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [transactions, setTransactions] =
    useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  const [selectedMarket, setSelectedMarket] = useState<MarketItem | null>(null);
  const [selectedGame, setSelectedGame] = useState<MarketGameOption | null>(
    null,
  );
  const [chartMarket, setChartMarket] = useState<MarketItem | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (logoutDialogOpen) {
          setLogoutDialogOpen(false);
          return true;
        }
        if (drawerOpen) {
          setDrawerOpen(false);
          return true;
        }
        if (chartMarket) {
          setChartMarket(null);
          return true;
        }
        if (sidebarScreen === 'gameChart' && selectedChart) {
          setSelectedChart(null);
          return true;
        }
        if (sidebarScreen) {
          setSidebarScreen(null);
          return true;
        }
        if (activeTab === 'wallet' && walletSubView !== 'menu') {
          setWalletSubView('menu');
          return true;
        }
        if (selectedGame) {
          setSelectedGame(null);
          return true;
        }
        if (selectedMarket) {
          setSelectedMarket(null);
          return true;
        }
        if (activeTab !== 'home') {
          setActiveTab('home');
          return true;
        }
        return false;
      },
    );

    return () => subscription.remove();
  }, [
    logoutDialogOpen,
    drawerOpen,
    chartMarket,
    selectedChart,
    sidebarScreen,
    walletSubView,
    selectedGame,
    selectedMarket,
    activeTab,
  ]);

  const tabIndex = useMemo(
    () => BOTTOM_ROUTES.findIndex(r => r.key === activeTab),
    [activeTab],
  );

  const currentTitle = useMemo(() => {
    if (sidebarScreen) {
      const titles: Record<SidebarScreenKey, string> = {
        profile: 'Profile',
        withdrawHistory: 'Withdraw History',
        notice: 'Notice',
        gameRates: 'Game Rate',
        withdrawRequest: 'Withdraw Fund',
        transaction: 'Transaction',
        gameTiming: 'Game Timing',
        gameChart: 'Game Chart',
        changePassword: 'Change Password',
      };
      return titles[sidebarScreen];
    }
    switch (activeTab) {
      case 'history':
        return 'Game Result';
      case 'allBids':
        return 'Bid History';
      case 'wallet':
        return 'Wallet';
      default:
        return '';
    }
  }, [activeTab, sidebarScreen]);

  const handleOpenWhatsApp = async (): Promise<void> => {
    try {
      await Linking.openURL(WHATSAPP_APP_URL);
    } catch {
      try {
        await Linking.openURL(WHATSAPP_WEB_URL);
      } catch {
        setSnackbarMessage('Unable to open WhatsApp on this device.');
      }
    }
  };

  const handleShareApp = async (): Promise<void> => {
    try {
      await Share.share({
        message:
          'Play Matka on RoyalClubMatka! Fast results, full rates & 24x7 support.',
      });
    } catch {
      setSnackbarMessage('Unable to open share sheet.');
    }
  };

  const handleJoinTelegram = async (): Promise<void> => {
    try {
      await Linking.openURL(TELEGRAM_URL);
    } catch {
      setSnackbarMessage('Unable to open Telegram right now.');
    }
  };

  const handleTabPress = (
    key: TabKey,
    preventDefault: () => void,
  ): void => {
    if (key === 'chat') {
      preventDefault();
      handleOpenWhatsApp();
      return;
    }
    setSelectedGame(null);
    setSelectedMarket(null);
    setSidebarScreen(null);
    if (key !== activeTab || sidebarScreen || selectedMarket) {
      setWalletSubView('menu');
    }
    setSelectedChart(null);
    setActiveTab(key);
  };

  const handlePlaceBets = (items: SubmittedBidItem[]): void => {
    if (!selectedMarket || items.length === 0) {
      return;
    }
    const totalStake = items.reduce((sum, item) => sum + item.stakeRupees, 0);
    const timeLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newBids: BidRecord[] = items.map((item, idx) => ({
      id: `bid-${Date.now()}-${idx}`,
      marketId: selectedMarket.id,
      marketName: selectedMarket.name,
      gameCode: item.gameCode,
      gameName: item.gameName,
      side: item.side,
      number: item.number,
      stakeRupees: item.stakeRupees,
      potentialWinRupees: item.potentialWinRupees,
      dateLabel: 'Today',
      timeLabel,
      status: 'Pending',
    }));

    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'bet',
      title: `${selectedMarket.name} (${items.length} bid${
        items.length > 1 ? 's' : ''
      })`,
      amountRupees: totalStake,
      beforeBalance: balanceRupees,
      afterBalance: balanceRupees - totalStake,
      status: 'Completed',
      timestamp: 'Just now',
    };

    setBalanceRupees(prev => prev - totalStake);
    setBids(prev => [...newBids, ...prev]);
    setTransactions(prev => [newTx, ...prev]);
    setSelectedGame(null);
    setSnackbarMessage(
      `${items.length} bid${items.length > 1 ? 's' : ''} placed (${formatRupees(
        totalStake,
      )})`,
    );
  };

  const handleAddFund = (amount: number): void => {
    setBalanceRupees(prev => prev + amount);
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: 'deposit',
        title: 'Wallet Deposit',
        amountRupees: amount,
        beforeBalance: balanceRupees,
        afterBalance: balanceRupees + amount,
        status: 'Completed',
        timestamp: 'Just now',
      },
      ...prev,
    ]);
    setSnackbarMessage(`Added ${formatRupees(amount)} to wallet.`);
  };

  const handleWithdrawFund = (amount: number): void => {
    setBalanceRupees(prev => prev - amount);
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: 'withdraw',
        title: 'Withdrawal Request',
        amountRupees: amount,
        beforeBalance: balanceRupees,
        afterBalance: balanceRupees - amount,
        status: 'Pending',
        timestamp: 'Just now',
      },
      ...prev,
    ]);
    setSnackbarMessage(`Withdrawal of ${formatRupees(amount)} requested.`);
  };

  const handleSaveBankDetails = (details: BankDetails): void => {
    setBankDetails(details);
    setSnackbarMessage('Bank & UPI details saved.');
  };

  const hasScreenHeader =
    (!sidebarScreen && Boolean(selectedMarket && selectedGame)) ||
    (sidebarScreen === 'gameChart' && selectedChart !== null) ||
    (!sidebarScreen && !selectedMarket && activeTab === 'wallet' &&
      walletSubView !== 'menu');

  const renderSidebarScreen = (): React.ReactNode => {
    switch (sidebarScreen) {
      case 'profile':
        return (
          <ProfileScreen
            profile={profile}
            onUpdateProfile={next => {
              setProfile(next);
              setSnackbarMessage('Profile updated successfully.');
            }}
          />
        );
      case 'withdrawHistory':
        return (
          <TransactionsListScreen
            mode="withdraw_only"
            transactions={transactions}
          />
        );
      case 'notice':
        return <NoticeScreen />;
      case 'gameRates':
        return <GameRatesScreen />;
      case 'withdrawRequest':
        return (
          <WithdrawFundScreen
            balanceRupees={balanceRupees}
            profile={profile}
            onSubmitWithdraw={amount => {
              handleWithdrawFund(amount);
              setSidebarScreen(null);
            }}
          />
        );
      case 'transaction':
        return (
          <TransactionsListScreen mode="all" transactions={transactions} />
        );
      case 'gameTiming':
        return <GameTimingScreen markets={INITIAL_MARKETS} />;
      case 'gameChart':
        return (
          <GameChartScreen
            markets={INITIAL_MARKETS}
            selectedChart={selectedChart}
            onSelectChart={setSelectedChart}
          />
        );
      case 'changePassword':
        return (
          <ChangePasswordScreen
            onSuccess={() => {
              setSidebarScreen(null);
              setSnackbarMessage('Password changed successfully.');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      {!hasScreenHeader && (
        <>
          <NoticeTicker />
          <TopAppBar
            title={currentTitle}
            isBrandHeader={
              !sidebarScreen && (activeTab === 'home' || Boolean(selectedMarket))
            }
            balanceRupees={balanceRupees}
            onMenuPress={() => setDrawerOpen(true)}
            onBackPress={
              sidebarScreen
                ? () => setSidebarScreen(null)
                : selectedMarket
                ? () => setSelectedMarket(null)
                : undefined
            }
            onWalletPress={() => {
              setSidebarScreen(null);
              setSelectedGame(null);
              setSelectedMarket(null);
              setWalletSubView('menu');
              setSelectedChart(null);
              setActiveTab('wallet');
            }}
          />
        </>
      )}

      <View style={styles.screenArea}>
        {sidebarScreen ? (
          renderSidebarScreen()
        ) : selectedMarket && selectedGame ? (
          <PlayGameScreen
            market={selectedMarket}
            game={selectedGame}
            balanceRupees={balanceRupees}
            onBack={() => setSelectedGame(null)}
            onPlaceBets={handlePlaceBets}
          />
        ) : selectedMarket ? (
          <MarketGamesScreen
            market={selectedMarket}
            onSelectGame={game => setSelectedGame(game)}
          />
        ) : activeTab === 'home' ? (
          <HomeScreen
            markets={INITIAL_MARKETS}
            onPlaceBet={market => setSelectedMarket(market)}
            onOpenChart={market => setChartMarket(market)}
            onOpenRates={() => setSidebarScreen('gameRates')}
          />
        ) : activeTab === 'history' ? (
          <GameResultScreen
            markets={INITIAL_MARKETS}
            onSelectMarket={market => setChartMarket(market)}
          />
        ) : activeTab === 'allBids' ? (
          <BidHistoryScreen bids={bids} />
        ) : (
          <WalletScreen
            balanceRupees={balanceRupees}
            transactions={transactions}
            bankDetails={bankDetails}
            subView={walletSubView}
            onSubViewChange={setWalletSubView}
            onAddFund={handleAddFund}
            onWithdrawFund={handleWithdrawFund}
            onSaveBankDetails={handleSaveBankDetails}
          />
        )}
      </View>

      {!sidebarScreen && !selectedGame && (
        <BottomNavigation.Bar
          navigationState={{ index: tabIndex, routes: BOTTOM_ROUTES }}
          onTabPress={({ route, preventDefault }) =>
            handleTabPress(route.key as TabKey, preventDefault)
          }
          renderIcon={({ route, focused, color }) => {
            const navRoute = route as NavRoute;
            const iconName = focused
              ? navRoute.focusedIcon
              : navRoute.unfocusedIcon;

            if (navRoute.key === 'home') {
              return (
                <Surface
                  style={[
                    styles.homeNavBadge,
                    focused
                      ? styles.homeNavBadgeActive
                      : styles.homeNavBadgeInactive,
                  ]}
                  elevation={3}>
                  <Icon
                    source={iconName}
                    size={22}
                    color={
                      focused
                        ? APP_COLORS.primaryBackground
                        : APP_COLORS.accent
                    }
                  />
                </Surface>
              );
            }

            return <Icon source={iconName} size={22} color={color} />;
          }}
          style={styles.bottomBar}
          activeColor={APP_COLORS.accent}
          inactiveColor={APP_COLORS.textSecondary}
          activeIndicatorStyle={styles.activeIndicator}
        />
      )}

      <AppDrawerModal
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        profile={profile}
        onOpenScreen={screen => {
          setSelectedGame(null);
          setSelectedMarket(null);
          setWalletSubView('menu');
          setSelectedChart(null);
          setSidebarScreen(screen);
        }}
        onShareApp={() => {
          handleShareApp();
        }}
        onJoinTelegram={() => {
          handleJoinTelegram();
        }}
        onLogoutPress={() => setLogoutDialogOpen(true)}
      />

      <MarketChartModal
        visible={Boolean(chartMarket)}
        market={chartMarket}
        onDismiss={() => setChartMarket(null)}
        onPlaceBet={market => {
          setSelectedGame(null);
          setSelectedMarket(market);
        }}
      />

      <Portal>
        <Dialog
          visible={logoutDialogOpen}
          onDismiss={() => setLogoutDialogOpen(false)}
          style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Logout</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogBody}>
              Are you sure you want to logout from RoyalClubMatka?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={APP_COLORS.textSecondary}
              onPress={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor={APP_COLORS.danger}
              textColor={APP_COLORS.textPrimary}
              onPress={() => {
                setLogoutDialogOpen(false);
                setSidebarScreen(null);
                setSelectedGame(null);
                setSelectedMarket(null);
                setActiveTab('home');
                setSnackbarMessage('Logged out successfully.');
              }}>
              Logout
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage(null)}
        duration={2500}
        style={styles.snackbar}>
        {snackbarMessage ?? ''}
      </Snackbar>
    </View>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={royalMatkaTheme}>
        <StatusBar barStyle="light-content" />
        <AppShell />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  screenArea: {
    flex: 1,
  },
  bottomBar: {
    backgroundColor: APP_COLORS.secondary,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  activeIndicator: {
    backgroundColor: APP_COLORS.accentMuted,
  },
  homeNavBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    borderWidth: 2,
  },
  homeNavBadgeActive: {
    backgroundColor: APP_COLORS.accent,
    borderColor: APP_COLORS.primaryBackground,
  },
  homeNavBadgeInactive: {
    backgroundColor: APP_COLORS.secondaryElevated,
    borderColor: APP_COLORS.accent,
  },
  dialog: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 16,
  },
  dialogTitle: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  dialogBody: {
    color: APP_COLORS.textSecondary,
  },
  snackbar: {
    backgroundColor: APP_COLORS.secondaryElevated,
  },
});

export default App;
