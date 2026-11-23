export interface Market {
  _id: string;
  slug: string;
  name: string;
  openTime: string;
  closeTime: string;
  active: boolean;
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
      const body: { error?: string } = await response.json();
      throw new Error(body.error ?? `Request failed (${response.status})`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    throw error;
  }
}
