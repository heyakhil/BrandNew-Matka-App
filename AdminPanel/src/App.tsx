import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  api,
  rupees,
  type AdminPermission,
  type Dashboard,
  type Market,
  type ResultDay,
  type User,
} from "./api";
import { Button, Input, Select } from "./components/atoms";
import { Panel } from "./components/Panel";
import {
  BannersView,
  NotificationsView,
  PasswordView,
  ReportsView,
  SettingsView,
  StaffView,
  TransactionsView,
  UserReportDialog,
} from "./components/organisms/AdminFeatures";

type Tab =
  | "dashboard"
  | "users"
  | "declare"
  | "history"
  | "markets"
  | "marketProfit"
  | "winners"
  | "transactions"
  | "deposits"
  | "withdrawals"
  | "banners"
  | "notifications"
  | "settings"
  | "staff"
  | "password";
type NavItem = { id: Tab; label: string; permission?: AdminPermission };
type NavGroup = { label: string; items: NavItem[] };
const navGroups: NavGroup[] = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard" }] },
  {
    label: "Users & Markets",
    items: [
      { id: "users", label: "User Management", permission: "users" },
      { id: "markets", label: "Markets & Charts", permission: "markets" },
    ],
  },
  {
    label: "Results",
    items: [
      { id: "declare", label: "Manual Result Entry", permission: "results" },
      { id: "history", label: "Result History", permission: "results" },
      { id: "winners", label: "Win History", permission: "reports" },
      { id: "marketProfit", label: "Market-wise Reports", permission: "reports" },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "transactions", label: "Transactions", permission: "transactions" },
      { id: "deposits", label: "Deposit History", permission: "transactions" },
      { id: "withdrawals", label: "Withdrawal History", permission: "transactions" },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "banners", label: "Sliders & Banners", permission: "content" },
      { id: "notifications", label: "Notifications", permission: "content" },
    ],
  },
  {
    label: "Administration",
    items: [
      { id: "settings", label: "App, Bonus & Referral", permission: "settings" },
      { id: "staff", label: "Sub-admin Access", permission: "staff" },
      { id: "password", label: "Change Password" },
    ],
  },
];
const pageTitle = (tab: Tab): string =>
  navGroups.flatMap((group) => group.items).find((item) => item.id === tab)?.label ??
  "Dashboard";
const validTabs = new Set<Tab>(
  navGroups.flatMap((group) => group.items.map((item) => item.id))
);

function tabFromLocation(): Tab {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const value = raw === "notification" ? "notifications" : raw;
  return validTabs.has(value as Tab) ? (value as Tab) : "dashboard";
}

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
  const [tab, setTab] = useState<Tab>(tabFromLocation);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<ResultDay[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const session = await api<{
        email: string;
        permissions: AdminPermission[];
      }>("/admin/session");
      setEmail(session.email);
      setPermissions(session.permissions);
      const [marketRows, userRows, resultRows, stats] = await Promise.all([
        session.permissions.includes("markets") ||
        session.permissions.includes("results")
          ? api<Market[]>("/admin/markets")
          : Promise.resolve([]),
        session.permissions.includes("users")
          ? api<User[]>(`/admin/users?page=${userPage}`)
          : Promise.resolve([]),
        session.permissions.includes("results")
          ? api<ResultDay[]>(`/admin/results/history?page=${historyPage}`)
          : Promise.resolve([]),
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

  useEffect(() => {
    const onHashChange = (): void => {
      setTab(tabFromLocation());
      setError("");
      setNotice("");
    };
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) window.history.replaceState(null, "", "#/dashboard");
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menuOpen", mobileMenuOpen);
    return () => document.body.classList.remove("menuOpen");
  }, [mobileMenuOpen]);

  const changed = useCallback((message: string): void => {
    setNotice(message);
    setError("");
    setRefresh((value) => value + 1);
  }, []);
  const failed = useCallback((cause: unknown): void => {
    setError(cause instanceof Error ? cause.message : "Request failed.");
    setNotice("");
  }, []);

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
      <button
        type="button"
        className={mobileMenuOpen ? "sidebarBackdrop visible" : "sidebarBackdrop"}
        aria-label="Close navigation"
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside className={mobileMenuOpen ? "sidebar mobileOpen" : "sidebar"}>
        <div className="brand">
          <img className="brandIcon" src="/royal-club-logo.png" alt="Royal Club" />
          <div>
            <strong>Royal Club</strong>
            <small>Admin Panel</small>
          </div>
          <Button
            className="closeSidebar"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          >
            ×
          </Button>
        </div>
        <nav>
          {navGroups.map((group) => {
            const items = group.items.filter(
              (item) => !item.permission || permissions.includes(item.permission)
            );
            if (items.length === 0) return null;
            return (
              <section className="navGroup" key={group.label}>
                <div className="navGroupToggle">
                  <span>{group.label}</span>
                </div>
                {items.map((item) => (
                  <a
                    key={item.id}
                    className={tab === item.id ? "nav active" : "nav"}
                    href={`#/${item.id}`}
                    onClick={() => {
                      setTab(item.id);
                      setError("");
                      setNotice("");
                      setMobileMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </section>
            );
          })}
        </nav>
        <div className="account">
          <small>{email}</small>
          <Button onClick={() => void logout()}>Sign out</Button>
        </div>
      </aside>
      <main className="main">
        <header>
          <Button
            className="mobileMenuButton"
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </Button>
          <div>
            <small>ROYAL CLUB CONTROL</small>
            <h1>{pageTitle(tab)}</h1>
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
            onDetails={setDetailUserId}
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
        {(tab === "marketProfit" || tab === "winners") && (
          <ReportsView
            type={tab === "marketProfit" ? "profit" : "winners"}
            onChanged={changed}
            onError={failed}
          />
        )}
        {(tab === "transactions" || tab === "deposits" || tab === "withdrawals") && (
          <TransactionsView
            type={tab === "deposits" ? "deposit" : tab === "withdrawals" ? "withdrawal" : "all"}
            onChanged={changed}
            onError={failed}
          />
        )}
        {tab === "banners" && <BannersView onChanged={changed} onError={failed} />}
        {tab === "notifications" && <NotificationsView onChanged={changed} onError={failed} />}
        {tab === "settings" && <SettingsView onChanged={changed} onError={failed} />}
        {tab === "staff" && <StaffView onChanged={changed} onError={failed} />}
        {tab === "password" && (
          <PasswordView
            onChanged={changed}
            onError={failed}
            onSignedOut={() => setEmail(null)}
          />
        )}
        {detailUserId && (
          <UserReportDialog userId={detailUserId} onClose={() => setDetailUserId(null)} />
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
          <img className="brandIcon" src="/royal-club-logo.png" alt="Royal Club" />
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
          ["Players", data ? data.users.toLocaleString("en-IN") : undefined],
          ["Markets", data ? data.markets.toLocaleString("en-IN") : undefined],
          ["Today's bids", data ? rupees(data.todayBidPaise) : undefined],
          ["Today's deposits", data ? rupees(data.todayDepositPaise) : undefined],
          ["Today's withdrawals", data ? rupees(data.todayWithdrawalPaise) : undefined],
          ["User wallet balance", data ? rupees(data.walletBalancePaise) : undefined],
          ["Total bets", data ? data.bets.toLocaleString("en-IN") : undefined],
          ["Result days", data ? data.results.toLocaleString("en-IN") : undefined],
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
  onDetails,
}: {
  users: User[];
  page: number;
  onPage: (page: number) => void;
  onChanged: (message: string) => void;
  onError: (cause: unknown) => void;
  onDetails: (userId: string) => void;
}) {
  const [walletAction, setWalletAction] = useState<{
    user: User;
    mode: "add" | "deduct";
  } | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReference, setWalletReference] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);

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

  function openWalletModal(user: User, mode: "add" | "deduct"): void {
    setWalletAction({ user, mode });
    setWalletAmount("");
    setWalletReference("");
  }

  async function submitWalletChange(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!walletAction) return;
    const rupeesAmount = Number(walletAmount);
    if (!Number.isSafeInteger(rupeesAmount) || rupeesAmount <= 0) {
      onError(new Error("Enter a positive whole rupee amount."));
      return;
    }
    const referenceId = walletReference.trim();
    if (!referenceId) {
      onError(new Error("Enter a payment or adjustment reference."));
      return;
    }
    const signedPaise =
      walletAction.mode === "add" ? rupeesAmount * 100 : -rupeesAmount * 100;
    setWalletSaving(true);
    try {
      await api(`/admin/users/${walletAction.user._id}/wallet`, {
        method: "POST",
        body: JSON.stringify({ amountPaise: signedPaise, referenceId }),
      });
      const verb = walletAction.mode === "add" ? "added to" : "deducted from";
      setWalletAction(null);
      onChanged(`₹${rupeesAmount} ${verb} wallet and recorded.`);
    } catch (cause) {
      onError(cause);
    } finally {
      setWalletSaving(false);
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
                  <Button onClick={() => onDetails(user._id)}>View details</Button>
                  <Button onClick={() => void toggle(user)}>
                    {user.disabled ? "Enable" : "Disable"}
                  </Button>
                  <Button onClick={() => openWalletModal(user, "add")}>
                    Add money
                  </Button>
                  <Button onClick={() => openWalletModal(user, "deduct")}>
                    Deduct money
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p>No players on this page.</p>}
      <Pager page={page} hasNext={users.length === 25} onPage={onPage} />
      {walletAction && (
        <div
          className="modalBackdrop"
          role="presentation"
          onClick={() => setWalletAction(null)}
        >
          <section
            className="modalCard"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modalHeader">
              <h2>
                {walletAction.mode === "add"
                  ? "Add money to wallet"
                  : "Deduct money from wallet"}
              </h2>
              <Button onClick={() => setWalletAction(null)}>Close</Button>
            </div>
            <p>
              <strong>
                {walletAction.user.name ?? walletAction.user.email ?? "Player"}
              </strong>{" "}
              ({walletAction.user.phone ?? "—"}) • Current balance:{" "}
              {rupees(walletAction.user.balancePaise)}
            </p>
            <form className="stack" onSubmit={(event) => void submitWalletChange(event)}>
              <Select
                label="Action"
                value={walletAction.mode}
                onChange={(event) =>
                  setWalletAction({
                    ...walletAction,
                    mode: event.target.value as "add" | "deduct",
                  })
                }
              >
                <option value="add">Add Money (+)</option>
                <option value="deduct">Deduct Money (-)</option>
              </Select>
              <Input
                label="Amount (₹)"
                type="number"
                min={1}
                step={1}
                value={walletAmount}
                onChange={(event) => setWalletAmount(event.target.value)}
                placeholder="Enter whole rupee amount"
                required
              />
              <Input
                label="Reference / Reason"
                value={walletReference}
                onChange={(event) => setWalletReference(event.target.value)}
                placeholder="e.g. Manual deposit / Correction"
                required
              />
              <div className="actions">
                <Button type="submit" disabled={walletSaving}>
                  {walletSaving
                    ? "Saving..."
                    : walletAction.mode === "add"
                    ? "Add Money"
                    : "Deduct Money"}
                </Button>
                <Button onClick={() => setWalletAction(null)} disabled={walletSaving}>
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
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
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const editSectionRef = useRef<HTMLDivElement | null>(null);
  const editMarket = (selected: Market): void => {
    setEditingMarket(selected);
    window.requestAnimationFrame(() => {
      editSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await api("/admin/markets", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          openTime,
          closeTime,
        }),
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
  async function updateMarket(
    marketId: string,
    changes: Pick<Market, "name" | "slug" | "openTime" | "closeTime">
  ): Promise<void> {
    try {
      await api(`/admin/markets/${marketId}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setEditingMarket(null);
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
      {editingMarket && (
        <div ref={editSectionRef} className="editSection">
          <MarketEditor
            market={editingMarket}
            onCancel={() => setEditingMarket(null)}
            onSave={updateMarket}
          />
        </div>
      )}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market) => (
                <MarketRow
                  key={market._id}
                  market={market}
                  onToggle={toggle}
                  onEdit={editMarket}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function MarketRow({
  market,
  onToggle,
  onEdit,
}: {
  market: Market;
  onToggle: (market: Market) => void;
  onEdit: (market: Market) => void;
}) {
  return (
    <tr>
      <td>{market.name}</td>
      <td>{market.openTime}</td>
      <td>{market.closeTime}</td>
      <td>{market.active ? "On" : "Off"}</td>
      <td className="actions">
        <Button onClick={() => onEdit(market)}>Edit</Button>
        <Button onClick={() => void onToggle(market)}>
          {market.active ? "Turn off" : "Turn on"}
        </Button>
      </td>
    </tr>
  );
}

function MarketEditor({
  market,
  onCancel,
  onSave,
}: {
  market: Market;
  onCancel: () => void;
  onSave: (
    marketId: string,
    changes: Pick<Market, "name" | "slug" | "openTime" | "closeTime">
  ) => Promise<void>;
}) {
  const [name, setName] = useState(market.name);
  const [slug, setSlug] = useState(market.slug);
  const [openTime, setOpenTime] = useState(market.openTime);
  const [closeTime, setCloseTime] = useState(market.closeTime);
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(market._id, { name, slug, openTime, closeTime });
    } finally {
      setSaving(false);
    }
  };
  return (
    <Panel title={`Edit ${market.name}`}>
      <form className="formGrid" onSubmit={(event) => void submit(event)}>
        <Input label="Market name" required value={name} onChange={(event) => setName(event.target.value)} />
        <Input label="Slug" required value={slug} onChange={(event) => setSlug(event.target.value)} />
        <Input label="Open time" type="time" required value={openTime} onChange={(event) => setOpenTime(event.target.value)} />
        <Input label="Close time" type="time" required value={closeTime} onChange={(event) => setCloseTime(event.target.value)} />
        <div className="actions">
          <Button type="submit" className="primary" disabled={saving}>{saving ? "Saving…" : "Save market"}</Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Panel>
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
