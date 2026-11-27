export interface Market {
  _id: string;
  slug: string;
  name: string;
  openTime: string;
  closeTime: string;
  active: boolean;
  jodiChartUrl?: string;
  pannaChartUrl?: string;
  rateCard: Record<
    "single" | "jodi" | "sp" | "dp" | "tp" | "halfSangam" | "fullSangam",
    { numerator: number; denominator: number }
  >;
  limits: { minPaise: number; maxPaise: number };
}

export interface User {
  _id: string;
  email?: string;
  name?: string;
  phone?: string;
  dob?: string;
  disabled: boolean;
  balancePaise: number;
  createdAt: string;
}

export interface ResultDay {
  _id: string;
  marketId: string;
  date: string;
  line: string;
  cancelled: boolean;
}

export interface Dashboard {
  users: number;
  markets: number;
  bets: number;
  results: number;
  todayBidPaise: number;
  todayDepositPaise: number;
  todayWithdrawalPaise: number;
  walletBalancePaise: number;
}

export const adminPermissions = [
  "users",
  "markets",
  "results",
  "transactions",
  "reports",
  "settings",
  "content",
  "staff",
] as const;
export type AdminPermission = (typeof adminPermissions)[number];

export interface AdminSettings {
  _id: string;
  minDepositPaise: number;
  minWithdrawalPaise: number;
  maxWithdrawalPaise: number;
  withdrawalStart: string;
  withdrawalEnd: string;
  firstDepositBonusPercent: number;
  referralBonusPaise: number;
}

export interface Banner {
  _id: string;
  title: string;
  imageData: string;
  linkUrl?: string;
  active: boolean;
  sortOrder: number;
}

export interface NotificationItem {
  _id: string;
  title: string;
  description: string;
  topic?: string;
  active: boolean;
  createdAt: string;
}

export interface MarketReport {
  marketId: string;
  marketName: string;
  bidPaise: number;
  winningPaise: number;
  profitPaise: number;
  winners: number;
}

export interface Winner {
  _id: string;
  userName: string;
  userPhone: string;
  marketName: string;
  date: string;
  winningPaise: number;
}

export interface Transaction {
  _id: string;
  userName: string;
  phone?: string;
  amountPaise: number;
  balanceAfterPaise: number;
  kind: string;
  referenceId: string;
  createdAt: string;
  category: "deposit" | "withdrawal" | "credit" | "bet";
}

export interface WithdrawalPaymentDetails {
  accountHolder?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

export interface WithdrawalRequestItem {
  _id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  userBalancePaise: number;
  amountPaise: number;
  method: "bank" | "upi";
  paymentDetails: WithdrawalPaymentDetails;
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface UserReport {
  user: User;
  todayBidPaise: number;
  depositsPaise: number;
  withdrawalsPaise: number;
}

export interface StaffMember {
  _id: string;
  email?: string;
  name?: string;
  adminPermissions?: AdminPermission[] | null;
  disabled: boolean;
  createdAt: string;
}

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    if (!response.ok) {
      const body: { error?: string } = await response.json().catch(() => ({}));
      throw new Error(body.error ?? `Request failed (${response.status})`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    throw error;
  }
}

export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function timeMinutes(time24: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time24.trim());
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatTime12h(time24: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time24.trim());
  if (!match) return time24;
  const hours24 = Number(match[1]);
  const minutes = match[2];
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, "0")}:${minutes} ${period}`;
}
