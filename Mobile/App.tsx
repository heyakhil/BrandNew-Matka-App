import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Linking,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Dialog, PaperProvider, Portal, Text } from 'react-native-paper';
import FlashMessage from 'react-native-flash-message';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { HomeHeader } from './src/components/molecules/HomeHeader';
import { ScreenHeader } from './src/components/molecules/ScreenHeader';
import { AppDrawerModal } from './src/components/organisms/AppDrawerModal';
import { BottomTabBar } from './src/components/organisms/BottomTabBar';
import { MarketChartModal } from './src/components/organisms/MarketChartModal';
import {
  TELEGRAM_URL,
  WHATSAPP_APP_URL,
  WHATSAPP_WEB_URL,
} from './src/constants/support';
import { INITIAL_MARKETS, INITIAL_TRANSACTIONS } from './src/data/mockData';
import { BidHistoryScreen } from './src/screens/BidHistoryScreen';
import { FundsScreen } from './src/screens/FundsScreen';
import { GameRatesScreen } from './src/screens/GameRatesScreen';
import { GameResultScreen } from './src/screens/GameResultScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MarketGamesScreen } from './src/screens/MarketGamesScreen';
import { MyBidsScreen } from './src/screens/MyBidsScreen';
import { PassbookScreen } from './src/screens/PassbookScreen';
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
import { APP_COLORS, royalMatkaTheme } from './src/theme/paperTheme';
import type {
  BankDetails,
  BidRecord,
  FundsSubView,
  MarketGameOption,
  MarketItem,
  MyBidsSubView,
  SidebarScreenKey,
  TabKey,
  UserProfile,
  WalletTransaction,
} from './src/types/matka';
import { formatRupees } from './src/utils/matkaHelpers';
import { loadAccount, saveProfile, submitBets } from './src/services/api';
import { changePassword } from './src/services/api';
import { toBetRequest } from './src/services/bets';
import { LoginScreen } from './src/screens/LoginScreen';
import { notifyError, notifySuccess, notifyWarning } from './src/services/flashMessage';

const SIDEBAR_TITLES: Record<SidebarScreenKey, string> = {
  profile: 'Profile',
  notice: 'Notice',
  gameRates: 'Game Rate',
  gameTiming: 'Game Timing',
  gameChart: 'Game Chart',
  changePassword: 'Change Password',
};

const BIDS_TITLES: Record<MyBidsSubView, string> = {
  menu: 'My Bids',
  bidHistory: 'Bid History',
  gameResults: 'Bid Result History',
};

const FUNDS_TITLES: Record<FundsSubView, string> = {
  menu: 'Funds',
  addFund: 'Add Fund',
  withdraw: 'Withdraw Fund',
  bank: 'Add Bank Details',
  upi: 'Add UPI Details',
  depositHistory: 'Fund Deposit History',
  withdrawHistory: 'Fund Withdraw History',
};

interface MobileSession { token: string }

export function AppShell({ session = null, onLogout, onTokenChange }: { session?: MobileSession | null; onLogout?: () => void; onTokenChange?: (token: string) => void }): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const live = session !== null;

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [sidebarScreen, setSidebarScreen] = useState<SidebarScreenKey | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [fundsSubView, setFundsSubView] = useState<FundsSubView>('menu');
  const [bidsSubView, setBidsSubView] = useState<MyBidsSubView>('menu');
  const [selectedChart, setSelectedChart] = useState<SelectedChart | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    name: 'Royal Club Member',
    phone: '',
    email: '',
  });
  const [balanceRupees, setBalanceRupees] = useState(live ? 0 : 1000);
  const [referralCode, setReferralCode] = useState('');
  const [markets, setMarkets] = useState<MarketItem[]>(live ? [] : INITIAL_MARKETS);
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [transactions, setTransactions] =
    useState<WalletTransaction[]>(live ? [] : INITIAL_TRANSACTIONS);
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

  const refreshAccount = useCallback(async (): Promise<void> => {
    if (!session) return;
    try {
      const account = await loadAccount(session.token);
      setMarkets(account.markets);
      setBids(account.bids);
      setTransactions(account.transactions);
      setBalanceRupees(account.balanceRupees);
      setReferralCode(account.referralCode);
      setProfile(account.profile);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Unable to refresh account.');
    }
  }, [session]);

  useEffect(() => { void refreshAccount(); }, [refreshAccount]);

  const handleBack = useCallback((): boolean => {
    if (logoutDialogOpen) {
      setLogoutDialogOpen(false);
    } else if (drawerOpen) {
      setDrawerOpen(false);
    } else if (chartMarket) {
      setChartMarket(null);
    } else if (sidebarScreen === 'gameChart' && selectedChart) {
      setSelectedChart(null);
    } else if (sidebarScreen) {
      setSidebarScreen(null);
    } else if (activeTab === 'wallet' && fundsSubView !== 'menu') {
      setFundsSubView('menu');
    } else if (activeTab === 'allBids' && bidsSubView !== 'menu') {
      setBidsSubView('menu');
    } else if (selectedGame) {
      setSelectedGame(null);
    } else if (selectedMarket) {
      setSelectedMarket(null);
    } else if (activeTab !== 'home') {
      setActiveTab('home');
    } else {
      return false;
    }
    return true;
  }, [
    logoutDialogOpen,
    drawerOpen,
    chartMarket,
    selectedChart,
    sidebarScreen,
    fundsSubView,
    bidsSubView,
    selectedGame,
    selectedMarket,
    activeTab,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBack,
    );
    return () => subscription.remove();
  }, [handleBack]);

  const currentTitle = useMemo(() => {
    if (sidebarScreen) {
      return SIDEBAR_TITLES[sidebarScreen];
    }
    if (selectedMarket) {
      return selectedMarket.name;
    }
    if (activeTab === 'allBids') {
      return BIDS_TITLES[bidsSubView];
    }
    if (activeTab === 'wallet') {
      return FUNDS_TITLES[fundsSubView];
    }
    return 'Passbook';
  }, [activeTab, bidsSubView, fundsSubView, selectedMarket, sidebarScreen]);

  const resetNavigation = (): void => {
    setSidebarScreen(null);
    setSelectedGame(null);
    setSelectedMarket(null);
    setSelectedChart(null);
    setFundsSubView('menu');
    setBidsSubView('menu');
  };

  const openFunds = (view: FundsSubView): void => {
    resetNavigation();
    setFundsSubView(view);
    setActiveTab('wallet');
  };

  const openUrl = async (url: string, fallbackUrl: string | null, errorMessage: string): Promise<void> => {
    try {
      await Linking.openURL(url);
    } catch {
      try {
        if (!fallbackUrl) {
          throw new Error('No fallback URL');
        }
        await Linking.openURL(fallbackUrl);
      } catch {
        notifyError(errorMessage);
      }
    }
  };

  const handleOpenWhatsApp = (): Promise<void> =>
    openUrl(
      WHATSAPP_APP_URL,
      WHATSAPP_WEB_URL,
      'Unable to open WhatsApp on this device.',
    );

  const handleJoinTelegram = (): Promise<void> =>
    openUrl(TELEGRAM_URL, null, 'Unable to open Telegram right now.');

  const handleShareApp = async (): Promise<void> => {
    try {
      await Share.share({
        message: referralCode
          ? `Join me on Royal Club Matka. Use my invite code: ${referralCode}`
          : 'Join me on Royal Club Matka.',
      });
    } catch {
      notifyError('Unable to open share sheet.');
    }
  };

  const handleTabPress = (key: TabKey): void => {
    if (key === 'chat') {
      handleOpenWhatsApp();
      return;
    }
    setSelectedGame(null);
    setSelectedMarket(null);
    setSelectedChart(null);
    if (key !== activeTab || sidebarScreen || selectedMarket) {
      setFundsSubView('menu');
      setBidsSubView('menu');
    }
    setSidebarScreen(null);
    setActiveTab(key);
  };

  const handlePlaceBets = async (items: SubmittedBidItem[], requestId: string): Promise<void> => {
    if (!selectedMarket || items.length === 0) {
      return;
    }
    if (session) {
      try {
        const requests = items.map(toBetRequest);
        await submitBets(session.token, selectedMarket.id, requests, requestId);
        await refreshAccount();
        setSelectedGame(null);
        notifySuccess(`${items.length} bid${items.length === 1 ? '' : 's'} placed.`);
      } catch (error) {
        notifyError(error instanceof Error ? error.message : 'Unable to place bets.');
      }
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
    notifySuccess(
      `${items.length} bid${items.length > 1 ? 's' : ''} placed (${formatRupees(
        totalStake,
      )})`,
    );
  };

  const handleAddFund = (amount: number): void => {
    if (live) { notifyWarning('Contact support to add funds.'); return; }
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
    notifySuccess(`Added ${formatRupees(amount)} to wallet.`);
  };

  const handleWithdrawFund = (amount: number): void => {
    if (live) { notifyWarning('Contact support for withdrawals.'); return; }
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
    notifySuccess(`Withdrawal of ${formatRupees(amount)} requested.`);
  };

  const handleSaveBankDetails = (details: BankDetails): void => {
    setBankDetails(details);
    notifySuccess('Payment details saved.');
  };

  const hasOwnHeader =
    (!sidebarScreen && Boolean(selectedMarket && selectedGame)) ||
    (sidebarScreen === 'gameChart' && selectedChart !== null);
  const isHome = !sidebarScreen && !selectedMarket && activeTab === 'home';

  const renderSidebarScreen = (): React.ReactNode => {
    switch (sidebarScreen) {
      case 'profile':
        return (
          <ProfileScreen
            profile={profile}
            emailReadOnly={live}
            onUpdateProfile={async next => {
              try {
                setProfile(session ? await saveProfile(session.token, next) : next);
                notifySuccess('Profile updated successfully.');
              } catch (error) { throw error; }
            }}
          />
        );
      case 'notice':
        return <NoticeScreen />;
      case 'gameRates':
        return <GameRatesScreen />;
      case 'gameTiming':
        return <GameTimingScreen markets={markets} />;
      case 'gameChart':
        return (
          <GameChartScreen
            markets={markets}
            selectedChart={selectedChart}
            onSelectChart={setSelectedChart}
          />
        );
      case 'changePassword':
        return (
          <ChangePasswordScreen
            onSubmit={session ? async (current, next) => {
              try { onTokenChange?.(await changePassword(session.token, current, next)); }
              catch (error) { throw error; }
            } : undefined}
            onSuccess={() => {
              setSidebarScreen(null);
              notifySuccess('Password changed successfully.');
            }}
          />
        );
      default:
        return null;
    }
  };

  const renderBidsScreen = (): React.ReactNode => {
    switch (bidsSubView) {
      case 'bidHistory':
        return <BidHistoryScreen bids={bids} />;
      case 'gameResults':
        return (
          <GameResultScreen
            markets={markets}
            onSelectMarket={market => setChartMarket(market)}
          />
        );
      default:
        return (
          <MyBidsScreen
            onSelect={setBidsSubView}
            onUnavailable={title => notifyWarning(`${title} is coming soon.`)}
          />
        );
    }
  };

  const renderScreen = (): React.ReactNode => {
    if (sidebarScreen) {
      return renderSidebarScreen();
    }
    if (selectedMarket && selectedGame) {
      return (
        <PlayGameScreen
          market={selectedMarket}
          game={selectedGame}
          balanceRupees={balanceRupees}
          onBack={() => setSelectedGame(null)}
          onPlaceBets={handlePlaceBets}
        />
      );
    }
    if (selectedMarket) {
      return (
        <MarketGamesScreen
          market={selectedMarket}
          onSelectGame={game => setSelectedGame(game)}
        />
      );
    }
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            markets={markets}
            onPlaceBet={market => setSelectedMarket(market)}
            onOpenChart={market => setChartMarket(market)}
            onOpenRates={() => setSidebarScreen('gameRates')}
            onAddFunds={() => live ? void handleOpenWhatsApp() : openFunds('addFund')}
            onWithdraw={() => live ? void handleOpenWhatsApp() : openFunds('withdraw')}
            onInvite={() => {
              handleShareApp();
            }}
            onWhatsAppPress={() => {
              handleOpenWhatsApp();
            }}
            onTelegramPress={() => {
              handleJoinTelegram();
            }}
          />
        );
      case 'history':
        return <PassbookScreen transactions={transactions} />;
      case 'allBids':
        return renderBidsScreen();
      default:
        return (
          <FundsScreen
            profile={profile}
            balanceRupees={balanceRupees}
            transactions={transactions}
            bankDetails={bankDetails}
            subView={fundsSubView}
            onSubViewChange={setFundsSubView}
            onAddFund={handleAddFund}
            onWithdrawFund={handleWithdrawFund}
            onSaveBankDetails={handleSaveBankDetails}
            onSupportPress={() => {
              handleOpenWhatsApp();
            }}
            live={live}
          />
        );
    }
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      {!hasOwnHeader &&
        (isHome ? (
          <HomeHeader
            balanceRupees={balanceRupees}
            onMenuPress={() => setDrawerOpen(true)}
            onWalletPress={() => openFunds('menu')}
            onRefreshPress={() => { void refreshAccount(); }}
          />
        ) : (
          <ScreenHeader
            title={currentTitle}
            balanceRupees={balanceRupees}
            onBackPress={() => {
              handleBack();
            }}
            onWalletPress={() => openFunds('menu')}
          />
        ))}

      <View style={styles.screenArea}>{renderScreen()}</View>

      {!sidebarScreen && !selectedGame && (
        <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
      )}

      <AppDrawerModal
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        profile={profile}
        onOpenScreen={screen => {
          resetNavigation();
          setSidebarScreen(screen);
        }}
        onTabPress={handleTabPress}
        onShareApp={() => {
          handleShareApp();
        }}
        onLogoutPress={() => setLogoutDialogOpen(true)}
      />

      <MarketChartModal
        visible={Boolean(chartMarket)}
        market={chartMarket}
        onDismiss={() => setChartMarket(null)}
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
              textColor={APP_COLORS.white}
              onPress={() => {
                setLogoutDialogOpen(false);
                resetNavigation();
                setActiveTab('home');
                onLogout?.();
                notifySuccess('Logged out successfully.');
              }}>
              Logout
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

    </View>
  );
}

function App({ demo = false }: { demo?: boolean }): React.JSX.Element {
  const [session, setSession] = useState<MobileSession | null>(null);
  return (
    <SafeAreaProvider>
      <PaperProvider theme={royalMatkaTheme}>
        <StatusBar barStyle="dark-content" />
        {session || demo ? (
          <AppShell session={session} onLogout={() => setSession(null)} onTokenChange={token => setSession(previous => previous ? { ...previous, token } : null)} />
        ) : (
          <LoginScreen onAuthenticated={token => setSession({ token })} />
        )}
        <FlashMessage position="top" />
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
});

export default App;
