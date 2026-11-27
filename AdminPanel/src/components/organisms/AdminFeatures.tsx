import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  api,
  adminPermissions,
  rupees,
  type AdminPermission,
  type AdminSettings,
  type Banner,
  type MarketReport,
  type NotificationItem,
  type StaffMember,
  type Transaction,
  type UserReport,
  type Winner,
  type WithdrawalRequestItem,
} from "../../api";
import { AmPmTimeInput, Button, Input, Select, Textarea } from "../atoms";
import { Panel } from "../Panel";

interface ActionProps {
  onChanged: (message: string) => void;
  onError: (cause: unknown) => void;
}

export function ReportsView({ type, ...actions }: ActionProps & { type: "profit" | "winners" }) {
  const [date, setDate] = useState("");
  const [markets, setMarkets] = useState<MarketReport[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [marketId, setMarketId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = date ? `?date=${date}` : "";
    const load = async (): Promise<void> => {
      try {
        if (type === "profit") {
          const rows = await api<MarketReport[]>(`/admin/reports/markets${query}`);
          if (active) setMarkets(rows);
        } else {
          const rows = await api<Winner[]>(`/admin/reports/winners${query}`);
          if (active) setWinners(rows);
        }
      } catch (cause) {
        if (active) actions.onError(cause);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [type, date]);

  return (
    <Panel title={type === "profit" ? "Market profit report" : "Win history"}>
      <div className="toolbar">
        <Input label="Market date (today if blank)" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        {type === "profit" && (
          <Select label="Market" value={marketId} onChange={(event) => setMarketId(event.target.value)}>
            <option value="">All markets</option>
            {markets.map((market) => <option key={market.marketId} value={market.marketId}>{market.marketName}</option>)}
          </Select>
        )}
        {loading && <span>Loading…</span>}
      </div>
      <div className="tableWrap">
        {type === "profit" ? (
          <table>
            <thead><tr><th>Market</th><th>Total bids</th><th>Winnings</th><th>Profit</th><th>Winners</th></tr></thead>
            <tbody>{markets.filter((row) => !marketId || row.marketId === marketId).map((row) => (
              <tr key={row.marketId}>
                <td>{row.marketName}</td><td>{rupees(row.bidPaise)}</td><td>{rupees(row.winningPaise)}</td>
                <td className={row.profitPaise < 0 ? "negative" : "positive"}>{rupees(row.profitPaise)}</td><td>{row.winners}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <table>
            <thead><tr><th>Player</th><th>Market</th><th>Date</th><th>Winning</th></tr></thead>
            <tbody>{winners.map((row) => (
              <tr key={row._id}><td>{row.userName}<small className="cellMeta">{row.userPhone}</small></td><td>{row.marketName}</td><td>{row.date}</td><td>{rupees(row.winningPaise)}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {!loading && (type === "profit" ? markets.length === 0 : winners.length === 0) && <p>No records found.</p>}
    </Panel>
  );
}

export function TransactionsView({ type, onError }: ActionProps & { type: "all" | "deposit" | "withdrawal" }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const rows = await api<Transaction[]>(`/admin/transactions?type=${type}`);
        if (active) setTransactions(rows);
      } catch (cause) {
        if (active) onError(cause);
      }
    };
    void load();
    return () => { active = false; };
  }, [type, onError]);
  const todayTotal = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return transactions
      .filter((row) => new Date(row.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === today)
      .reduce((sum, row) => sum + Math.abs(row.amountPaise), 0);
  }, [transactions]);
  return (
    <Panel title={type === "deposit" ? "Deposit history" : type === "withdrawal" ? "Withdrawal history" : "Transaction history"}>
      <div className="summaryStrip"><span>Today's {type === "all" ? "volume" : "total"}</span><strong>{rupees(todayTotal)}</strong></div>
      <div className="tableWrap">
        <table>
          <thead><tr><th>Player</th><th>Type</th><th>Amount</th><th>Balance</th><th>Reference</th><th>Date</th></tr></thead>
          <tbody>{transactions.map((row) => (
            <tr key={row._id}><td>{row.userName}<small className="cellMeta">{row.phone ?? ""}</small></td><td><span className="badge">{row.category}</span></td><td className={row.amountPaise < 0 ? "negative" : "positive"}>{rupees(row.amountPaise)}</td><td>{rupees(row.balanceAfterPaise)}</td><td>{row.referenceId}</td><td>{new Date(row.createdAt).toLocaleString("en-IN")}</td></tr>
          ))}</tbody>
        </table>
      </div>
      {transactions.length === 0 && <p>No transactions found.</p>}
    </Panel>
  );
}

export function SettingsView({ onChanged, onError }: ActionProps) {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  useEffect(() => {
    let active = true;
    void api<AdminSettings>("/settings").then((rows) => {
      if (active) setSettings(rows);
    }).catch((cause: unknown) => active && onError(cause));
    return () => { active = false; };
  }, [onError]);
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!settings) return;
    try {
      await api("/admin/settings", { method: "PUT", body: JSON.stringify(settings) });
      onChanged("Application settings saved.");
    } catch (cause) {
      onError(cause);
    }
  };
  const setPaise = (field: "minDepositPaise" | "minWithdrawalPaise" | "maxWithdrawalPaise", value: string): void =>
    setSettings((current) => current ? { ...current, [field]: Math.round(Number(value) * 100) } : current);
  if (!settings) return <Panel title="General settings"><p>Loading…</p></Panel>;
  return (
    <Panel title="Funds, gifts, bonuses and referrals">
      <form className="formGrid" onSubmit={(event) => void submit(event)}>
        <Input label="Minimum deposit (₹)" type="number" min="1" value={settings.minDepositPaise / 100} onChange={(event) => setPaise("minDepositPaise", event.target.value)} />
        <Input label="Minimum withdrawal (₹)" type="number" min="1" value={settings.minWithdrawalPaise / 100} onChange={(event) => setPaise("minWithdrawalPaise", event.target.value)} />
        <Input label="Maximum withdrawal (₹)" type="number" min="1" value={settings.maxWithdrawalPaise / 100} onChange={(event) => setPaise("maxWithdrawalPaise", event.target.value)} />
        <AmPmTimeInput label="Withdrawal opens at" value={settings.withdrawalStart} onChange={(next) => setSettings({ ...settings, withdrawalStart: next })} />
        <AmPmTimeInput label="Withdrawal closes at" value={settings.withdrawalEnd} onChange={(next) => setSettings({ ...settings, withdrawalEnd: next })} />
        <Input label="First deposit bonus (%)" type="number" min="0" max="100" value={settings.firstDepositBonusPercent} onChange={(event) => setSettings({ ...settings, firstDepositBonusPercent: Number(event.target.value) })} />
        <Button type="submit" className="primary">Save settings</Button>
      </form>
    </Panel>
  );
}

export function BannersView({ onChanged, onError }: ActionProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageData, setImageData] = useState("");
  const load = async (): Promise<void> => {
    try {
      setBanners(await api<Banner[]>("/admin/banners"));
    } catch (cause) {
      onError(cause);
    }
  };
  useEffect(() => { void load(); }, []);
  const chooseImage = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_400_000) {
      onError(new Error("Banner image must be smaller than 1.4 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => onError(new Error("Unable to read the selected image."));
    reader.onload = () => typeof reader.result === "string" && setImageData(reader.result);
    reader.readAsDataURL(file);
  };
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      await api("/admin/banners", { method: "POST", body: JSON.stringify({ title, imageData, linkUrl, active: true, sortOrder: banners.length }) });
      setTitle(""); setLinkUrl(""); setImageData("");
      onChanged("Banner uploaded.");
      await load();
    } catch (cause) {
      onError(cause);
    }
  };
  const toggle = async (banner: Banner): Promise<void> => {
    try {
      await api(`/admin/banners/${banner._id}`, { method: "PATCH", body: JSON.stringify({ active: !banner.active }) });
      onChanged("Banner updated."); await load();
    } catch (cause) { onError(cause); }
  };
  const replace = (banner: Banner, event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_400_000) {
      onError(new Error("Banner image must be smaller than 1.4 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => onError(new Error("Unable to read the selected image."));
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      try {
        await api(`/admin/banners/${banner._id}`, {
          method: "PATCH",
          body: JSON.stringify({ imageData: reader.result }),
        });
        onChanged("Banner image replaced.");
        await load();
      } catch (cause) {
        onError(cause);
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <>
      <Panel title="Upload slider banner">
        <form className="formGrid" onSubmit={(event) => void submit(event)}>
          <Input label="Banner title" required value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input label="Link URL (optional)" type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} />
          <Input label="Image" type="file" accept="image/png,image/jpeg,image/webp" required onChange={chooseImage} />
          {imageData && <img className="bannerPreview" src={imageData} alt="Banner preview" />}
          <Button className="primary" type="submit" disabled={!imageData}>Upload banner</Button>
        </form>
      </Panel>
      <Panel title="Slider banners">
        <div className="bannerGrid">{banners.map((banner) => (
          <article className="bannerCard" key={banner._id}>
            <img src={banner.imageData} alt={banner.title} />
            <div><strong>{banner.title}</strong><span className={banner.active ? "badge" : "badge off"}>{banner.active ? "Live" : "Hidden"}</span></div>
            <label className="replaceUpload">Replace image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => replace(banner, event)} /></label>
            <Button onClick={() => void toggle(banner)}>{banner.active ? "Hide" : "Publish"}</Button>
          </article>
        ))}</div>
        {banners.length === 0 && <p>No banners uploaded.</p>}
      </Panel>
    </>
  );
}

export function NotificationsView({ onChanged, onError }: ActionProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [firebaseConfigured, setFirebaseConfigured] = useState<boolean | null>(null);

  const load = async (): Promise<void> => {
    try {
      const [notifItems, status] = await Promise.all([
        api<NotificationItem[]>("/admin/notifications"),
        api<{ firebaseConfigured: boolean }>("/admin/notifications/status").catch(() => ({ firebaseConfigured: false })),
      ]);
      setItems(notifItems);
      setFirebaseConfigured(status.firebaseConfigured);
    } catch (cause) { onError(cause); }
  };
  useEffect(() => { void load(); }, []);
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      const res = await api<{ firebaseLive?: boolean }>("/admin/notifications", {
        method: "POST",
        body: JSON.stringify({ title, description, topic: "all" }),
      });
      setTitle("");
      setDescription("");
      if (res?.firebaseLive) {
        onChanged("Push notification broadcasted to all subscribed users.");
      } else {
        onChanged("Notification saved to DB. (FCM in mock mode — see warning above).");
      }
      await load();
    } catch (cause) { onError(cause); }
  };
  return (
    <>
      <Panel title="Publish Push Notification">
        {firebaseConfigured === false && (
          <div style={{ padding: "12px 16px", marginBottom: 16, borderRadius: 8, background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e", fontSize: 13, lineHeight: 1.5 }}>
            <strong>⚠️ Firebase Service Account Not Configured:</strong>
            <div>Push notifications are currently in <strong>Mock Mode</strong>. The message will be recorded in the database and shown under Notice, but sending a real push notification to mobile devices requires adding <code>FIREBASE_SERVICE_ACCOUNT_KEY</code> to <code>Server/.env</code> and placing your real <code>google-services.json</code> in <code>Mobile/android/app/</code>.</div>
          </div>
        )}
        {firebaseConfigured === true && (
          <div style={{ padding: "8px 12px", marginBottom: 16, borderRadius: 6, background: "#dcfce7", border: "1px solid #22c55e", color: "#166534", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span>🟢</span>
            <strong>Firebase Cloud Messaging (FCM) is Connected & Live</strong>
          </div>
        )}
        <form className="notificationForm" onSubmit={(event) => void submit(event)}>
          <Input label="Title" required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} />
          <Textarea label="Description" required maxLength={2000} rows={6} placeholder="Write a clear message for app users…" value={description} onChange={(event) => setDescription(event.target.value)} />
          <div className="notificationFormFooter">
            <small>{description.length} / 2000 characters</small>
            <Button className="primary" type="submit">Send push notification</Button>
          </div>
        </form>
      </Panel>
      <Panel title="Notification history">
        <div className="notificationList">{items.map((item) => (
          <article key={item._id}>
            <div>
              <strong>{item.title}</strong>
              <small>
                {new Date(item.createdAt).toLocaleString("en-IN")}
              </small>
            </div>
            <p>{item.description}</p>
          </article>
        ))}</div>
      </Panel>
    </>
  );
}

export function StaffView({ onChanged, onError }: ActionProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<AdminPermission[]>(["results", "transactions"]);
  const load = async (): Promise<void> => {
    try { setStaff(await api<StaffMember[]>("/admin/staff")); } catch (cause) { onError(cause); }
  };
  useEffect(() => { void load(); }, []);
  const togglePermission = (permission: AdminPermission): void =>
    setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      await api("/admin/staff", { method: "POST", body: JSON.stringify({ name, email, password, permissions }) });
      setName(""); setEmail(""); setPassword(""); onChanged("Sub-admin created."); await load();
    } catch (cause) { onError(cause); }
  };
  const toggle = async (member: StaffMember): Promise<void> => {
    try {
      await api(`/admin/staff/${member._id}`, { method: "PATCH", body: JSON.stringify({ disabled: !member.disabled }) });
      onChanged("Staff access updated."); await load();
    } catch (cause) { onError(cause); }
  };
  return (
    <>
      <Panel title="Create sub-admin">
        <form className="formGrid" onSubmit={(event) => void submit(event)}>
          <Input label="Name" required value={name} onChange={(event) => setName(event.target.value)} />
          <Input label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Temporary password" type="password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} />
          <fieldset className="permissionGrid"><legend>Permissions</legend>{adminPermissions.map((permission) => (
            <label key={permission}><input type="checkbox" checked={permissions.includes(permission)} onChange={() => togglePermission(permission)} />{permission}</label>
          ))}</fieldset>
          <Button className="primary" type="submit" disabled={permissions.length === 0}>Create sub-admin</Button>
        </form>
      </Panel>
      <Panel title="Admin accounts">
        <div className="tableWrap"><table><thead><tr><th>Staff</th><th>Permissions</th><th>Status</th><th>Action</th></tr></thead><tbody>{staff.map((member) => (
          <tr key={member._id}><td>{member.name ?? "Primary admin"}<small className="cellMeta">{member.email}</small></td><td>{member.adminPermissions?.join(", ") ?? "Full access"}</td><td><span className={member.disabled ? "badge off" : "badge"}>{member.disabled ? "Disabled" : "Active"}</span></td><td><Button disabled={!member.adminPermissions} onClick={() => void toggle(member)}>{member.disabled ? "Enable" : "Disable"}</Button></td></tr>
        ))}</tbody></table></div>
      </Panel>
    </>
  );
}

export function PasswordView({
  onChanged,
  onError,
  onSignedOut,
}: ActionProps & { onSignedOut: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (newPassword !== confirm) { onError(new Error("New passwords do not match.")); return; }
    try {
      await api("/admin/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      onChanged("Password changed. Please sign in again.");
      onSignedOut();
    } catch (cause) { onError(cause); }
  };
  return (
    <Panel title="Change admin password">
      <form className="formGrid" onSubmit={(event) => void submit(event)}>
        <Input label="Current password" type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        <Input label="New password" type="password" minLength={12} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <Input label="Confirm new password" type="password" minLength={12} required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        <Button className="primary" type="submit">Change password</Button>
      </form>
    </Panel>
  );
}

export function UserReportDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [report, setReport] = useState<UserReport | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void api<UserReport>(`/admin/users/${userId}/report`).then(setReport).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load report."));
  }, [userId]);
  return (
    <div className="modalBackdrop" role="presentation" onClick={onClose}>
      <section className="modalCard" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modalHeader"><h2>User details</h2><Button onClick={onClose}>Close</Button></div>
        {error && <p className="message error">{error}</p>}
        {report ? <div className="detailGrid">
          <strong>{report.user.name ?? report.user.email}</strong><span>Phone: {report.user.phone ?? "—"}</span><span>Balance: {rupees(report.user.balancePaise)}</span>
          <span>Played today: {rupees(report.todayBidPaise)}</span><span>Total deposits: {rupees(report.depositsPaise)}</span><span>Total withdrawals: {rupees(report.withdrawalsPaise)}</span>
        </div> : !error && <p>Loading…</p>}
      </section>
    </div>
  );
}

export function WithdrawalRequestsView({ onChanged, onError }: ActionProps) {
  const [requests, setRequests] = useState<WithdrawalRequestItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    try {
      setRequests(await api<WithdrawalRequestItem[]>("/admin/withdrawals"));
    } catch (cause) {
      onError(cause);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAction = async (
    item: WithdrawalRequestItem,
    action: "accept" | "reject"
  ): Promise<void> => {
    const promptLabel =
      action === "accept"
        ? `Approve withdrawal of ${rupees(item.amountPaise)} for ${item.userName}? This will deduct the amount from their wallet.`
        : `Reject withdrawal of ${rupees(item.amountPaise)} for ${item.userName}?`;
    if (!window.confirm(promptLabel)) return;
    const note =
      action === "reject"
        ? window.prompt("Optional rejection reason (shown in notification):", "") ?? ""
        : "";
    setBusyId(item._id);
    try {
      await api(`/admin/withdrawals/${item._id}/${action}`, {
        method: "POST",
        body: JSON.stringify(note.trim() ? { note: note.trim() } : {}),
      });
      onChanged(
        action === "accept"
          ? `Withdrawal of ${rupees(item.amountPaise)} approved and debited.`
          : `Withdrawal of ${rupees(item.amountPaise)} rejected.`
      );
      await load();
    } catch (cause) {
      onError(cause);
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = useMemo(
    () => requests.filter((row) => row.status === "pending").length,
    [requests]
  );

  return (
    <Panel title="Withdrawal requests">
      <div className="summaryStrip">
        <span>Pending requests</span>
        <strong>{pendingCount}</strong>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Account Holder</th>
              <th>Bank / IFSC</th>
              <th>Account No. / UPI ID</th>
              <th>Status</th>
              <th>Requested At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((row) => (
              <tr key={row._id}>
                <td>
                  <strong>{row.userName}</strong>
                  <small className="cellMeta">
                    {row.userPhone || row.userEmail || "—"} • Bal: {rupees(row.userBalancePaise)}
                  </small>
                </td>
                <td className="negative">{rupees(row.amountPaise)}</td>
                <td>
                  <span className="badge">{row.method.toUpperCase()}</span>
                </td>
                <td>{row.method === "bank" ? row.paymentDetails.accountHolder || "—" : "—"}</td>
                <td>
                  {row.method === "bank" ? (
                    <>
                      {row.paymentDetails.bankName || "Bank"}
                      <small className="cellMeta">
                        IFSC: {row.paymentDetails.ifscCode || "—"}
                      </small>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {row.method === "bank"
                    ? row.paymentDetails.accountNumber || "—"
                    : row.paymentDetails.upiId || "—"}
                </td>
                <td>
                  <span
                    className={
                      row.status === "pending"
                        ? "badge pending"
                        : row.status === "rejected"
                        ? "badge off"
                        : "badge"
                    }
                  >
                    {row.status}
                  </span>
                  {row.adminNote ? (
                    <small className="cellMeta">{row.adminNote}</small>
                  ) : null}
                </td>
                <td>{new Date(row.createdAt).toLocaleString("en-IN")}</td>
                <td className="actions">
                  {row.status === "pending" ? (
                    <>
                      <Button
                        className="btnAccept"
                        disabled={busyId === row._id}
                        onClick={() => void handleAction(row, "accept")}
                      >
                        Accept
                      </Button>
                      <Button
                        className="btnReject"
                        disabled={busyId === row._id}
                        onClick={() => void handleAction(row, "reject")}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <small className="cellMeta">
                      {row.reviewedAt
                        ? new Date(row.reviewedAt).toLocaleString("en-IN")
                        : "Processed"}
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {requests.length === 0 && <p>No withdrawal requests found.</p>}
    </Panel>
  );
}
