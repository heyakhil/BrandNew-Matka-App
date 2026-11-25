export type TabKey = 'history' | 'allBids' | 'home' | 'wallet' | 'chat';

export type SidebarScreenKey =
  | 'profile'
  | 'notice'
  | 'gameRates'
  | 'gameTiming'
  | 'gameChart'
  | 'changePassword';

export type MyBidsSubView = 'menu' | 'bidHistory' | 'gameResults';

export type FundsSubView =
  | 'menu'
  | 'addFund'
  | 'withdraw'
  | 'bank'
  | 'upi'
  | 'depositHistory'
  | 'withdrawHistory';

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
}

export type MarketCategory = 'main' | 'jackpot';

export type MarketStatus = 'open_running' | 'close_running' | 'closed';

export type SessionSide = 'open' | 'close';

export type GameTypeId =
  | 'SD'
  | 'SDB'
  | 'JD'
  | 'JDB'
  | 'SP'
  | 'SPB'
  | 'DP'
  | 'DPB'
  | 'SPM'
  | 'DPM'
  | 'GJ'
  | 'SDT'
  | 'OE'
  | 'RB'
  | 'DBJ'
  | 'CP'
  | 'PG'
  | 'TDP'
  | 'TP'
  | 'HS'
  | 'FS';

export interface MarketGameOption {
  id: GameTypeId;
  title: string;
  icon: string;
  color: string;
  openOnly: boolean;
  rateKey: 'SD' | 'JD' | 'RB' | 'SP' | 'DP' | 'TP' | 'HS' | 'FS';
  requiresSide: boolean;
}

export interface MarketItem {
  id: string;
  name: string;
  resultLine: string;
  openTime: string;
  closeTime: string;
  openBidLastTime?: string;
  closeBidLastTime?: string;
  status: MarketStatus;
  category: MarketCategory;
  jodiChartUrl?: string;
  pannaChartUrl?: string;
  rateCard?: Record<'single' | 'jodi' | 'sp' | 'dp' | 'tp' | 'halfSangam' | 'fullSangam', { numerator: number; denominator: number }>;
  limits?: { minPaise: number; maxPaise: number };
  recentChart: Array<{
    date: string;
    result: string;
  }>;
}

export interface GameRateItem {
  id: 'SD' | 'JD' | 'RB' | 'SP' | 'DP' | 'TP' | 'HS' | 'FS';
  code: 'SD' | 'JD' | 'RB' | 'SP' | 'DP' | 'TP' | 'HS' | 'FS';
  name: string;
  badgeColor: string;
  rateMultiplier: number;
  displayRatePer10: string;
  requiresSide: boolean;
  description: string;
}

export interface BidRecord {
  id: string;
  marketId: string;
  marketName: string;
  gameCode: GameTypeId;
  gameName: string;
  side: SessionSide | 'full';
  number: string;
  stakeRupees: number;
  potentialWinRupees: number;
  dateLabel: string;
  timeLabel: string;
  status: 'Pending' | 'Won' | 'Lost' | 'Refunded';
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win';
  title: string;
  amountRupees: number;
  beforeBalance?: number;
  afterBalance?: number;
  status: 'Completed' | 'Pending';
  timestamp: string;
}

export interface BankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
}
