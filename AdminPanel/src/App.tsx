import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  api,
  type Dashboard,
  type Market,
  type ResultDay,
  type User,
} from "./api";
import { Button, Input, Select } from "./components/atoms";
import { Panel } from "./components/Panel";

type Tab = "dashboard" | "users" | "declare" | "history" | "markets";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "User Management" },
  { id: "declare", label: "Result Declare" },
  { id: "history", label: "Result History" },
  { id: "markets", label: "Markets" },
];

function todayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (name: string): string =>
    parts.find((part) => part.type === name)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function App() {
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<ResultDay[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const load = useCallback(async (): Promise<void> => {
    try {
      const session = await api<{ email: string }>("/admin/session");
      setEmail(session.email);
      const [marketRows, userRows, resultRows, stats] = await Promise.all([
        api<Market[]>("/admin/markets"),
        api<User[]>(`/admin/users?page=${userPage}`),
        api<ResultDay[]>(`/admin/results/history?page=${historyPage}`),
        api<Dashboard>("/admin/dashboard"),
      ]);
      setMarkets(marketRows);
      setUsers(userRows);
      setHistory(resultRows);
      setDashboard(stats);
      setError("");
    } catch (cause) {
      if (
        cause instanceof Error &&
        cause.message === "Authentication required."
      )
        setEmail(null);
      else if (
        cause instanceof Error &&
        cause.message === "Invalid or expired session."
      )
        setEmail(null);
      else
        setError(
          cause instanceof Error ? cause.message : "Unable to load data."
        );
    }
  }, [userPage, historyPage]);

  useEffect(() => {
    void load();
  }, [load, refresh]);

  const changed = (message: string): void => {
    setNotice(message);
    setError("");
    setRefresh((value) => value + 1);
  };
  const failed = (cause: unknown): void => {
    setError(cause instanceof Error ? cause.message : "Request failed.");
    setNotice("");
  };

  async function logout(): Promise<void> {
    try {
      await api<void>("/admin/logout", { method: "POST" });
      setEmail(null);
    } catch (cause) {
      failed(cause);
    }
  }

  if (email === null)
    return (
      <Login
        onSuccess={(address) => {
          setEmail(address);
          setRefresh((value) => value + 1);
        }}
      />
    );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandIcon">R</span>
          <div>
            <strong>Royal Club</strong>
            <small>Admin Panel</small>
          </div>
        </div>
        <nav>
          {tabs.map((item) => (
            <Button
              key={item.id}
              className={tab === item.id ? "nav active" : "nav"}
              onClick={() => {
                setTab(item.id);
                setError("");
                setNotice("");
              }}
            >
              {item.label}
            </Button>
          ))}
        </nav>
        <div className="account">
          <small>{email}</small>
          <Button onClick={() => void logout()}>Sign out</Button>
        </div>
      </aside>
      <main className="main">
        <header>
          <div>
            <small>ROYAL CLUB CONTROL</small>
            <h1>{tabs.find((item) => item.id === tab)?.label}</h1>
          </div>
          <span className="live">● Live</span>
        </header>
        {error && (
          <p className="message error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="message success" role="status">
            {notice}
          </p>
        )}
        {tab === "dashboard" && <DashboardView data={dashboard} />}
        {tab === "users" && (
          <UsersView
            users={users}
            page={userPage}
            onPage={setUserPage}
            onChanged={changed}
            onError={failed}
          />
        )}
        {tab === "declare" && (
          <DeclareView markets={markets} onChanged={changed} onError={failed} />
        )}
        {tab === "history" && (
          <HistoryView
            days={history}
            markets={markets}
            page={historyPage}
            onPage={setHistoryPage}
            onChanged={changed}
            onError={failed}
          />
        )}
        {tab === "markets" && (
          <MarketsView markets={markets} onChanged={changed} onError={failed} />
        )}
      </main>
    </div>
  );
}

function Login({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await api<{ email: string }>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onSuccess(session.email);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="loginPage">
      <form className="loginCard" onSubmit={(event) => void submit(event)}>
        <div className="brand loginBrand">
          <span className="brandIcon">R</span>
          <div>
            <strong>Royal Club</strong>
            <small>Admin Panel</small>
          </div>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to manage markets and results.</p>
        {error && (
          <p className="message error" role="alert">
            {error}
          </p>
        )}
        <Input
          label="Email address"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" className="primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

function DashboardView({ data }: { data: Dashboard | null }) {
  return (
    <div className="stats">
      {(
        [
          ["Players", data?.users],
          ["Markets", data?.markets],
          ["Bets", data?.bets],
          ["Result days", data?.results],
        ] as const
      ).map(([label, value]) => (
        <Panel key={label} title={label}>
          <strong className="statValue">{value ?? "—"}</strong>
        </Panel>
      ))}
    </div>
  );
}

function UsersView({
  users,
  page,
  onPage,
  onChanged,
  onError,
}: {
  users: User[];
  page: number;
  onPage: (page: number) => void;
  onChanged: (message: string) => void;
  onError: (cause: unknown) => void;
}) {
  async function toggle(user: User): Promise<void> {
    try {
      await api(`/admin/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: !user.disabled }),
      });
      onChanged("User updated.");
    } catch (cause) {
      onError(cause);
    }
  }
  async function adjust(user: User): Promise<void> {
    const amount = window.prompt(
      "Adjustment in rupees. Use a negative number to debit."
    );
    if (amount === null) return;
    const rupees = Number(amount);
    if (!Number.isSafeInteger(rupees) || rupees === 0) {
      onError(new Error("Enter a nonzero whole rupee amount."));
      return;
    }
    const referenceId = window.prompt(
      "Enter the payment or adjustment reference."
    );
    if (!referenceId) return;
    try {
      await api(`/admin/users/${user._id}/wallet`, {
        method: "POST",
        body: JSON.stringify({ amountPaise: rupees * 100, referenceId }),
      });
      onChanged("Wallet adjusted and recorded.");
    } catch (cause) {
      onError(cause);
    }
  }
  return (
    <Panel title="Players">
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  {user.name ? (
                    <strong>
                      {user.name}
                      <br />
                    </strong>
                  ) : null}
                  {user.email ?? "—"}
                </td>
                <td>{user.phone ?? "—"}{user.dob ? <small> DOB: {user.dob}</small> : null}</td>
                <td>₹{(user.balancePaise / 100).toFixed(2)}</td>
                <td>{new Date(user.createdAt).toLocaleDateString("en-IN")}</td>
                <td>
                  <span className={user.disabled ? "badge off" : "badge"}>
                    {user.disabled ? "Disabled" : "Active"}
                  </span>
                </td>
                <td className="actions">
                  <Button onClick={() => void toggle(user)}>
                    {user.disabled ? "Enable" : "Disable"}
                  </Button>
                  <Button onClick={() => void adjust(user)}>
                    Adjust wallet
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p>No players on this page.</p>}
      <Pager page={page} hasNext={users.length === 25} onPage={onPage} />
    </Panel>
  );
}

function DeclareView({
  markets,
  onChanged,
  onError,
}: {
  markets: Market[];
  onChanged: (message: string) => void;
  onError: (cause: unknown) => void;
}) {
  const [marketId, setMarketId] = useState("");
  const [date, setDate] = useState(todayInIndia());
  const [side, setSide] = useState<"open" | "close">("open");
  const [panna, setPanna] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const selected = marketId || markets[0]?._id;
    if (!selected) {
      onError(new Error("Create a market first."));
      return;
    }
    if (!/^\d{3}$/.test(panna)) {
      onError(new Error("Enter exactly three digits."));
      return;
    }
    try {
      const result = await api<{ line: string; noop: boolean }>(
        "/admin/results/declare",
        {
          method: "POST",
          body: JSON.stringify({ marketId: selected, date, side, panna }),
        }
      );
      onChanged(
        result.noop
          ? `Already declared: ${result.line}`
          : `Declared ${result.line}.`
      );
      setPanna("");
    } catch (cause) {
      onError(cause);
    }
  }
  return (
    <Panel title="Declare panna">
      <p>
        The jodi is calculated from the open and close pannas. Digits are stored
        in canonical order.
      </p>
      <form className="formGrid" onSubmit={(event) => void submit(event)}>
        <Select
          label="Market"
          value={marketId || markets[0]?._id || ""}
          onChange={(event) => setMarketId(event.target.value)}
        >
          {markets.map((market) => (
            <option key={market._id} value={market._id}>
              {market.name}
            </option>
          ))}
        </Select>
        <Input
          label="Market date"
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <Select
          label="Draw"
          value={side}
          onChange={(event) => setSide(event.target.value as "open" | "close")}
        >
          <option value="open">Open</option>
          <option value="close">Close</option>
        </Select>
        <Input
          label="Panna"
          inputMode="numeric"
          pattern="[0-9]{3}"
          maxLength={3}
          required
          value={panna}
          onChange={(event) => setPanna(event.target.value.replace(/\D/g, ""))}
        />
        <Button type="submit" className="primary">
          Declare result
        </Button>
      </form>
    </Panel>
  );
}

function HistoryView({
  days,
  markets,
  page,
  onPage,
  onChanged,
  onError,
}: {
  days: ResultDay[];
  markets: Market[];
  page: number;
  onPage: (page: number) => void;
  onChanged: (message: string) => void;
  onError: (cause: unknown) => void;
}) {
  async function reverse(
    day: ResultDay,
    side: "open" | "close"
  ): Promise<void> {
    if (
      !window.confirm(
        `Reverse the ${side} result for ${day.date}? Credited winnings will be debited.`
      )
    )
      return;
    try {
      await api("/admin/results/reverse", {
        method: "POST",
        body: JSON.stringify({ marketId: day.marketId, date: day.date, side }),
      });
      onChanged("Result reversed.");
    } catch (cause) {
      onError(cause);
    }
  }
  async function cancel(day: ResultDay): Promise<void> {
    if (!window.confirm(`Cancel ${day.date}? Pending slips will be refunded.`))
      return;
    try {
      await api("/admin/results/cancel", {
        method: "POST",
        body: JSON.stringify({ marketId: day.marketId, date: day.date }),
      });
      onChanged("Market day cancelled.");
    } catch (cause) {
      onError(cause);
    }
  }
  return (
    <Panel title="Recent results">
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Market</th>
              <th>Result line</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day._id}>
                <td>{day.date}</td>
                <td>
                  {markets.find((market) => market._id === day.marketId)
                    ?.name ?? day.marketId}
                </td>
                <td className="resultLine">{day.line}</td>
                <td>
                  {day.cancelled
                    ? "Cancelled"
                    : day.line === "—"
                    ? "Pending"
                    : "Declared"}
                </td>
                <td className="actions">
                  <Button
                    disabled={day.cancelled || day.line === "—"}
                    onClick={() =>
                      void reverse(day, day.line.length > 5 ? "close" : "open")
                    }
                  >
                    Reverse latest
                  </Button>
                  <Button
                    disabled={day.cancelled}
                    onClick={() => void cancel(day)}
                  >
                    Cancel
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {days.length === 0 && <p>No results on this page.</p>}
      <Pager page={page} hasNext={days.length === 25} onPage={onPage} />
    </Panel>
  );
}

function Pager({
  page,
  hasNext,
  onPage,
}: {
  page: number;
  hasNext: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <div className="pager">
      <Button disabled={page === 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span>Page {page}</span>
      <Button disabled={!hasNext} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  );
}

function MarketsView({
  markets,
  onChanged,
  onError,
}: {
  markets: Market[];
  onChanged: (message: string) => void;
  onError: (cause: unknown) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("12:00");
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await api("/admin/markets", {
        method: "POST",
        body: JSON.stringify({ name, slug, openTime, closeTime }),
      });
      setName("");
      setSlug("");
      onChanged("Market created.");
    } catch (cause) {
      onError(cause);
    }
  }
  async function toggle(market: Market): Promise<void> {
    try {
      await api(`/admin/markets/${market._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !market.active }),
      });
      onChanged("Market updated.");
    } catch (cause) {
      onError(cause);
    }
  }
  return (
    <>
      <Panel title="Add market">
        <form className="formGrid" onSubmit={(event) => void submit(event)}>
          <Input
            label="Market name"
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSlug(
                event.target.value
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-")
              );
            }}
          />
          <Input
            label="Slug"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
          <Input
            label="Open time"
            type="time"
            required
            value={openTime}
            onChange={(event) => setOpenTime(event.target.value)}
          />
          <Input
            label="Close time"
            type="time"
            required
            value={closeTime}
            onChange={(event) => setCloseTime(event.target.value)}
          />
          <Button type="submit" className="primary">
            Create market
          </Button>
        </form>
      </Panel>
      <RateEditor markets={markets} onChanged={onChanged} onError={onError} />
      <Panel title="Configured markets">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Market</th>
                <th>Open</th>
                <th>Close</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market) => (
                <tr key={market._id}>
                  <td>{market.name}</td>
                  <td>{market.openTime}</td>
                  <td>{market.closeTime}</td>
                  <td>{market.active ? "On" : "Off"}</td>
                  <td>
                    <Button onClick={() => void toggle(market)}>
                      {market.active ? "Turn off" : "Turn on"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

const rateKeys = [
  "single",
  "jodi",
  "sp",
  "dp",
  "tp",
  "halfSangam",
  "fullSangam",
] as const;
type RateKey = (typeof rateKeys)[number];

function RateEditor({
  markets,
  onChanged,
  onError,
}: {
  markets: Market[];
  onChanged: (message: string) => void;
  onError: (cause: unknown) => void;
}) {
  const [marketId, setMarketId] = useState("");
  const [rates, setRates] = useState<Record<RateKey, string>>({
    single: "",
    jodi: "",
    sp: "",
    dp: "",
    tp: "",
    halfSangam: "",
    fullSangam: "",
  });
  const [minStake, setMinStake] = useState("10");
  const [maxStake, setMaxStake] = useState("10000");
  const market = markets.find((item) => item._id === marketId) ?? markets[0];
  useEffect(() => {
    if (!market) return;
    setRates(
      Object.fromEntries(
        rateKeys.map((key) => [
          key,
          String(
            market.rateCard[key].numerator / market.rateCard[key].denominator
          ),
        ])
      ) as Record<RateKey, string>
    );
    setMinStake(String(market.limits.minPaise / 100));
    setMaxStake(String(market.limits.maxPaise / 100));
  }, [market]);
  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!market) return;
    try {
      const card = Object.fromEntries(
        rateKeys.map((key) => {
          const text = rates[key];
          if (!/^\d+(\.\d{1,2})?$/.test(text) || Number(text) <= 0)
            throw new Error(`Invalid ${key} rate.`);
          const numerator = Math.round(Number(text) * 100);
          return [key, { numerator, denominator: 100 }];
        })
      );
      const minPaise = Number(minStake) * 100;
      const maxPaise = Number(maxStake) * 100;
      if (
        !Number.isSafeInteger(minPaise) ||
        !Number.isSafeInteger(maxPaise) ||
        minPaise <= 0 ||
        minPaise > maxPaise
      )
        throw new Error("Invalid stake limits.");
      await api(`/admin/markets/${market._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          rateCard: card,
          limits: { minPaise, maxPaise },
        }),
      });
      onChanged(
        "Market rates and limits saved. Existing bets retain their locked rates."
      );
    } catch (cause) {
      onError(cause);
    }
  }
  if (!market) return null;
  return (
    <Panel title="Rates and limits">
      <form className="formGrid" onSubmit={(event) => void save(event)}>
        <Select
          label="Market"
          value={market._id}
          onChange={(event) => setMarketId(event.target.value)}
        >
          {markets.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </Select>
        <span />
        {rateKeys.map((key) => (
          <Input
            key={key}
            label={`${key} multiplier`}
            type="number"
            min="0.01"
            step="0.01"
            required
            value={rates[key]}
            onChange={(event) =>
              setRates((current) => ({ ...current, [key]: event.target.value }))
            }
          />
        ))}
        <Input
          label="Minimum stake (₹)"
          type="number"
          min="1"
          step="1"
          required
          value={minStake}
          onChange={(event) => setMinStake(event.target.value)}
        />
        <Input
          label="Maximum stake (₹)"
          type="number"
          min="1"
          step="1"
          required
          value={maxStake}
          onChange={(event) => setMaxStake(event.target.value)}
        />
        <Button type="submit" className="primary">
          Save rates
        </Button>
      </form>
    </Panel>
  );
}
