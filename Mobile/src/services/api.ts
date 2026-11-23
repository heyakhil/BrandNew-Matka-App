import type { BetRequest, Slip } from '../../../packages/matka-rules/src/index';
import { MARKET_GAME_OPTIONS } from '../data/mockData';
import type {
  BidRecord,
  GameTypeId,
  MarketItem,
  UserProfile,
  WalletTransaction,
} from '../types/matka';

const API_URL = 'http://localhost:4000/api';

interface Session {
  token: string;
  user: { name: string; phone: string; balancePaise: number };
}

interface PlayerRegistration {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dob: string;
}
interface MarketResponse {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  openBidLastTime: string;
  closeBidLastTime: string;
  line: string;
  phase: 'preOpen' | 'afterOpenCutoff' | 'closed' | 'cancelled';
  recentChart: Array<{ date: string; result: string }>;
  rateCard: NonNullable<MarketItem['rateCard']>;
  limits: NonNullable<MarketItem['limits']>;
}
interface BetResponse {
  _id: string;
  marketId: string;
  date: string;
  request: BetRequest;
  createdAt: string;
  slips: Array<{
    slip: Slip;
    status: 'pending' | 'won' | 'lost' | 'refunded';
    stakePaise: number;
    winningPaise: number;
    lockedRate: { numerator: number; denominator: number };
  }>;
}
interface EntryResponse {
  _id: string;
  amountPaise: number;
  balanceAfterPaise: number;
  kind: 'bet' | 'win' | 'reversal' | 'refund' | 'adjustment';
  createdAt: string;
}

const requestError = (error: unknown): Error => {
  if (error instanceof TypeError && /network request failed|failed to fetch/i.test(error.message))
    return new Error('Cannot reach the Royal Club server. Check your connection and try again.');
  return error instanceof Error ? error : new Error('Request failed. Please try again.');
};

async function request<T>(
  path: string,
  token?: string,
  body?: object,
  method = 'POST',
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: body ? method : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return undefined as T;
    const data: T | { error: string } = await response.json();
    if (!response.ok)
      throw new Error(
        'error' in (data as object)
          ? (data as { error: string }).error
          : 'Request failed.',
      );
    return data as T;
  } catch (error) {
    throw requestError(error);
  }
}

export const loginPlayer = (phone: string, password: string): Promise<Session> =>
  request<Session>('/auth/login', undefined, { phone, password });

export const startPlayerRegistration = (
  details: PlayerRegistration,
): Promise<{ challengeId: string }> =>
  request<{ challengeId: string }>('/auth/register/start', undefined, details);

export const verifyPlayerRegistration = (
  challengeId: string,
  otp: string,
): Promise<Session> =>
  request<Session>('/auth/register/verify', undefined, { challengeId, otp });

export const startPlayerPasswordReset = (
  phone: string,
): Promise<{ challengeId: string }> =>
  request<{ challengeId: string }>('/auth/password-reset/start', undefined, { phone });

export const verifyPlayerPasswordReset = (
  challengeId: string,
  otp: string,
): Promise<{ resetToken: string }> =>
  request<{ resetToken: string }>('/auth/password-reset/verify', undefined, { challengeId, otp });

export const resetPlayerPassword = (
  challengeId: string,
  resetToken: string,
  password: string,
  confirmPassword: string,
): Promise<void> =>
  request<void>('/auth/password-reset/finish', undefined, {
    challengeId, resetToken, password, confirmPassword,
  });

const codeByGame: Record<BetRequest['game'], GameTypeId> = {
  single: 'SD',
  singleBulk: 'SDB',
  jodi: 'JD',
  jodiBulk: 'JDB',
  sp: 'SP',
  spBulk: 'SPB',
  dp: 'DP',
  dpBulk: 'DPB',
  tp: 'TP',
  tpBulk: 'TP',
  spMotor: 'SPM',
  dpMotor: 'DPM',
  sdDpTp: 'SDT',
  redJodi: 'RB',
  jodiFamily: 'GJ',
  pannaFamily: 'CP',
  cyclePatti: 'TDP',
  halfSangam: 'HS',
  fullSangam: 'FS',
};

function slipNumber(slip: Slip): string {
  switch (slip.type) {
    case 'single':
      return String(slip.ank);
    case 'jodi':
      return slip.jodi;
    case 'panna':
      return slip.panna;
    case 'halfSangam':
      return `${slip.panna}-${slip.ank}`;
    case 'fullSangam':
      return `${slip.openPanna}-${slip.closePanna}`;
  }
}

export async function loadAccount(
  token: string,
): Promise<{
  markets: MarketItem[];
  bids: BidRecord[];
  transactions: WalletTransaction[];
  balanceRupees: number;
  profile: UserProfile;
  referralCode: string;
}> {
  try {
    const [marketRows, betRows, entries, user] = await Promise.all([
      request<MarketResponse[]>('/markets'),
      request<BetResponse[]>('/me/bets', token),
      request<EntryResponse[]>('/me/passbook', token),
      request<{
        email: string;
        name: string;
        phone: string;
        referralCode: string;
        balancePaise: number;
      }>('/me', token),
    ]);
    const markets: MarketItem[] = marketRows.map(market => ({
      id: market.id,
      name: market.name,
      resultLine: market.line,
      openTime: market.openTime,
      closeTime: market.closeTime,
      openBidLastTime: market.openBidLastTime,
      closeBidLastTime: market.closeBidLastTime,
      status:
        market.phase === 'preOpen'
          ? 'open_running'
          : market.phase === 'afterOpenCutoff'
          ? 'close_running'
          : 'closed',
      category: 'main',
      recentChart: market.recentChart,
      rateCard: market.rateCard,
      limits: market.limits,
    }));
    const nameById = new Map(markets.map(market => [market.id, market.name]));
    const bids: BidRecord[] = betRows.flatMap(bet =>
      bet.slips.map((priced, index) => ({
        id: `${bet._id}-${index}`,
        marketId: bet.marketId,
        marketName: nameById.get(bet.marketId) ?? 'Market',
        gameCode: codeByGame[bet.request.game],
        gameName:
          MARKET_GAME_OPTIONS.find(
            game => game.id === codeByGame[bet.request.game],
          )?.title ?? bet.request.game,
        side: 'side' in priced.slip ? priced.slip.side : 'full',
        number: slipNumber(priced.slip),
        stakeRupees: priced.stakePaise / 100,
        potentialWinRupees:
          priced.winningPaise > 0
            ? priced.winningPaise / 100
            : (priced.stakePaise * priced.lockedRate.numerator) /
              priced.lockedRate.denominator /
              100,
        dateLabel: bet.date,
        timeLabel: new Date(bet.createdAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status:
          priced.status === 'won'
            ? 'Won'
            : priced.status === 'lost'
            ? 'Lost'
            : priced.status === 'refunded'
            ? 'Refunded'
            : 'Pending',
      })),
    );
    const transactions: WalletTransaction[] = entries.map(entry => ({
      id: entry._id,
      type:
        entry.kind === 'bet'
          ? 'bet'
          : entry.kind === 'win' || entry.kind === 'refund'
          ? 'win'
          : entry.amountPaise < 0
          ? 'withdraw'
          : 'deposit',
      title: entry.kind,
      amountRupees: Math.abs(entry.amountPaise) / 100,
      beforeBalance: (entry.balanceAfterPaise - entry.amountPaise) / 100,
      afterBalance: entry.balanceAfterPaise / 100,
      status: 'Completed',
      timestamp: new Date(entry.createdAt).toLocaleString('en-IN'),
    }));
    return {
      markets,
      bids,
      transactions,
      balanceRupees: user.balancePaise / 100,
      referralCode: user.referralCode,
      profile: {
        email: user.email ?? '',
        name: user.name || 'Royal Club Member',
        phone: user.phone,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function saveProfile(
  token: string,
  profile: UserProfile,
): Promise<UserProfile> {
  try {
    return await request<UserProfile>(
      '/me',
      token,
      { name: profile.name, phone: profile.phone },
      'PATCH',
    );
  } catch (error) {
    throw error;
  }
}

export async function submitBets(
  token: string,
  marketId: string,
  requests: BetRequest[],
  requestId: string,
): Promise<void> {
  try {
    await request<BetResponse[]>('/bets/batch', token, {
      marketId,
      requests,
      requestId,
    });
  } catch (error) {
    throw error;
  }
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/me/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
      const body: { error?: string } = await response.json();
      throw new Error(body.error ?? 'Unable to change password.');
    }
    const body: { token: string } = await response.json();
    return body.token;
  } catch (error) {
    throw requestError(error);
  }
}
