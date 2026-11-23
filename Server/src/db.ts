import mysql, {
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import type {
  BetRequest,
  PricedSlip,
  RateCard,
  StakeLimits,
} from "../../packages/matka-rules/src/index.ts";
import { ObjectId } from "./id.ts";
export { ObjectId } from "./id.ts";

export interface User {
  _id: ObjectId;
  email?: string;
  name?: string;
  phone?: string;
  dob?: string;
  referralCode?: string;
  referredBy?: ObjectId;
  passwordHash: string;
  passwordVersion?: number;
  role: "admin" | "player";
  disabled: boolean;
  balancePaise: number;
  createdAt: Date;
}

export interface Market {
  _id: ObjectId;
  slug: string;
  name: string;
  openTime: string;
  closeTime: string;
  timezone: string;
  cutoffMinutes: number;
  active: boolean;
  rateCard: RateCard;
  limits: StakeLimits;
}

export interface MarketDay {
  _id: ObjectId;
  marketId: ObjectId;
  date: string;
  openPanna?: string;
  closePanna?: string;
  cancelled: boolean;
  revision: number;
  openDeclaredAt?: Date;
  closeDeclaredAt?: Date;
  openRevision?: number;
  closeRevision?: number;
}

export interface StoredSlip extends PricedSlip {
  status: "pending" | "won" | "lost" | "refunded";
  winningPaise: number;
}

export interface Bet {
  _id: ObjectId;
  userId: ObjectId;
  marketId: ObjectId;
  date: string;
  request: BetRequest;
  slips: StoredSlip[];
  totalStakePaise: number;
  createdAt: Date;
}

export interface WalletEntry {
  _id: ObjectId;
  userId: ObjectId;
  amountPaise: number;
  balanceAfterPaise: number;
  kind: "bet" | "win" | "reversal" | "refund" | "adjustment";
  referenceId: string;
  createdAt: Date;
}

export interface BetBatch {
  _id: ObjectId;
  userId: ObjectId;
  requestId: string;
  signature: string;
  betIds: ObjectId[];
  createdAt: Date;
}

type Table =
  | "users"
  | "markets"
  | "market_days"
  | "bets"
  | "wallet_entries"
  | "bet_batches";
type JsonField = "rateCard" | "limits" | "request" | "slips" | "betIds";
type SqlValue = string | number | boolean | Date | null;
const jsonFields = new Set<string>([
  "rateCard",
  "limits",
  "request",
  "slips",
  "betIds",
] satisfies JsonField[]);
const idFields = new Set(["_id", "userId", "marketId", "referredBy"]);
const dateFields = new Set(["createdAt", "openDeclaredAt", "closeDeclaredAt"]);
const booleanFields = new Set(["disabled", "active", "cancelled"]);
const columns: Record<Table, readonly string[]> = {
  users: [
    "_id",
    "email",
    "name",
    "phone",
    "dob",
    "referralCode",
    "referredBy",
    "passwordHash",
    "passwordVersion",
    "role",
    "disabled",
    "balancePaise",
    "createdAt",
  ],
  markets: [
    "_id",
    "slug",
    "name",
    "openTime",
    "closeTime",
    "timezone",
    "cutoffMinutes",
    "active",
    "rateCard",
    "limits",
  ],
  market_days: [
    "_id",
    "marketId",
    "date",
    "openPanna",
    "closePanna",
    "cancelled",
    "revision",
    "openDeclaredAt",
    "closeDeclaredAt",
    "openRevision",
    "closeRevision",
  ],
  bets: [
    "_id",
    "userId",
    "marketId",
    "date",
    "request",
    "slips",
    "totalStakePaise",
    "createdAt",
  ],
  wallet_entries: [
    "_id",
    "userId",
    "amountPaise",
    "balanceAfterPaise",
    "kind",
    "referenceId",
    "createdAt",
  ],
  bet_batches: [
    "_id",
    "userId",
    "requestId",
    "signature",
    "betIds",
    "createdAt",
  ],
};
const column = (field: string): string =>
  field === "_id"
    ? "id"
    : field.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
const quoted = (field: string): string => `\`${column(field)}\``;

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE ?? "royal_club_matka",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z",
  supportBigNumbers: true,
  bigNumberStrings: false,
  decimalNumbers: true,
});
export const sqlPool = pool;

export interface ClientSession {
  connection: PoolConnection;
  withTransaction<T>(work: () => Promise<T>): Promise<T>;
}

export const client = {
  async withSession<T>(
    work: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const connection = await pool.getConnection();
    const session: ClientSession = {
      connection,
      async withTransaction<R>(transaction: () => Promise<R>): Promise<R> {
        await connection.query(
          "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
        );
        await connection.beginTransaction();
        try {
          const result = await transaction();
          await connection.commit();
          return result;
        } catch (error) {
          await connection.rollback();
          throw error;
        }
      },
    };
    try {
      return await work(session);
    } finally {
      connection.release();
    }
  },
  async close(): Promise<void> {
    await pool.end();
  },
};

interface Options {
  session?: ClientSession;
  projection?: Record<string, number>;
  upsert?: boolean;
  returnDocument?: "after" | "before";
  lock?: boolean;
}
type Filter = Record<string, unknown>;
type Update = Partial<
  Record<"$set" | "$inc" | "$unset" | "$setOnInsert", Record<string, unknown>>
>;

function encode(field: string, value: unknown): SqlValue {
  if (value === undefined || value === null) return null;
  if (value instanceof ObjectId) return value.toHexString();
  if (jsonFields.has(field)) return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    value instanceof Date
  )
    return value;
  throw new Error(`Unsupported value for ${field}.`);
}

function decode<T>(table: Table, row: RowDataPacket): T {
  const result: Record<string, unknown> = {};
  for (const field of columns[table]) {
    const value: unknown = row[column(field)];
    if (value === null || value === undefined) continue;
    if (idFields.has(field)) result[field] = new ObjectId(String(value));
    else if (field === "betIds")
      result[field] = (
        typeof value === "string"
          ? (JSON.parse(value) as string[])
          : (value as string[])
      ).map((id) => new ObjectId(id));
    else if (jsonFields.has(field))
      result[field] =
        typeof value === "string" ? (JSON.parse(value) as unknown) : value;
    else if (booleanFields.has(field)) result[field] = Boolean(value);
    else if (dateFields.has(field))
      result[field] = value instanceof Date ? value : new Date(String(value));
    else result[field] = value;
  }
  return result as T;
}

function where(filter: Filter = {}): { sql: string; values: SqlValue[] } {
  const parts: string[] = [];
  const values: SqlValue[] = [];
  for (const [field, expected] of Object.entries(filter)) {
    if (field === "$or") {
      const branches = (expected as Filter[]).map(where);
      parts.push(`(${branches.map((branch) => branch.sql).join(" OR ")})`);
      branches.forEach((branch) => values.push(...branch.values));
      continue;
    }
    if (!/^[a-zA-Z_]+$/.test(field)) throw new Error("Invalid query field.");
    if (
      expected &&
      typeof expected === "object" &&
      !(expected instanceof ObjectId) &&
      !(expected instanceof Date) &&
      !Array.isArray(expected)
    ) {
      for (const [operator, operand] of Object.entries(expected)) {
        if (operator === "$exists") {
          parts.push(`${quoted(field)} IS ${operand ? "NOT " : ""}NULL`);
          continue;
        }
        if (operator === "$in") {
          const items = operand as unknown[];
          parts.push(
            items.length
              ? `${quoted(field)} IN (${items.map(() => "?").join(",")})`
              : "FALSE"
          );
          values.push(...items.map((item) => encode(field, item)));
          continue;
        }
        if (operator !== "$lt") throw new Error("Unsupported query operator.");
        parts.push(`${quoted(field)} < ?`);
        values.push(encode(field, operand));
      }
    } else {
      parts.push(
        expected === null ? `${quoted(field)} IS NULL` : `${quoted(field)} = ?`
      );
      if (expected !== null) values.push(encode(field, expected));
    }
  }
  return { sql: parts.length ? parts.join(" AND ") : "TRUE", values };
}

function project<T>(item: T, projection?: Record<string, number>): T {
  if (!projection) return item;
  const copy = { ...item };
  for (const [field, include] of Object.entries(projection))
    if (!include) delete (copy as Record<string, unknown>)[field];
  return copy;
}

class Query<T> {
  private order = "";
  private count?: number;
  private offset = 0;
  constructor(
    private table: Table,
    private filter: Filter,
    private options: Options
  ) {}
  sort(fields: Record<string, number>): this {
    this.order = Object.entries(fields)
      .map(
        ([field, direction]) =>
          `${quoted(field)} ${direction < 0 ? "DESC" : "ASC"}`
      )
      .join(", ");
    return this;
  }
  limit(count: number): this {
    this.count = count;
    return this;
  }
  skip(count: number): this {
    this.offset = count;
    return this;
  }
  async toArray(): Promise<T[]> {
    const clause = where(this.filter);
    const order = this.order ? ` ORDER BY ${this.order}` : "";
    const paging =
      this.count === undefined && this.offset === 0
        ? ""
        : ` LIMIT ${this.count ?? 18446744073709551615} OFFSET ${this.offset}`;
    const executor = this.options.session?.connection ?? pool;
    const locking =
      this.options.session && this.options.lock ? " FOR UPDATE" : "";
    const [rows] = await executor.execute<RowDataPacket[]>(
      `SELECT * FROM \`${this.table}\` WHERE ${clause.sql}${order}${paging}${locking}`,
      clause.values
    );
    return rows.map((row) =>
      project(decode<T>(this.table, row), this.options.projection)
    );
  }
}

class SqlCollection<T extends { _id: ObjectId }> {
  constructor(private table: Table) {}
  find(filter: Filter = {}, options: Options = {}): Query<T> {
    return new Query<T>(this.table, filter, options);
  }
  async findOne(filter: Filter, options: Options = {}): Promise<T | null> {
    return (await this.find(filter, options).limit(1).toArray())[0] ?? null;
  }
  async insertOne(item: T, options: Options = {}): Promise<void> {
    const fields = columns[this.table].filter(
      (field) => (item as Record<string, unknown>)[field] !== undefined
    );
    const values = fields.map((field) =>
      encode(field, (item as Record<string, unknown>)[field])
    );
    const executor = options.session?.connection ?? pool;
    await executor.execute(
      `INSERT INTO \`${this.table}\` (${fields
        .map(quoted)
        .join(",")}) VALUES (${fields.map(() => "?").join(",")})`,
      values
    );
  }
  async insertMany(items: T[], options: Options = {}): Promise<void> {
    for (const item of items) await this.insertOne(item, options);
  }
  async updateOne(
    filter: Filter,
    update: Update,
    options: Options = {}
  ): Promise<{ modifiedCount: number }> {
    const clause = where(filter);
    const existing = options.upsert
      ? await this.findOne(filter, options)
      : null;
    const changes = { ...update.$set };
    for (const [field, value] of Object.entries(update.$inc ?? {}))
      changes[field] = { increment: value };
    for (const field of Object.keys(update.$unset ?? {})) changes[field] = null;
    const assignments = Object.entries(changes).map(([field, value]) =>
      value && typeof value === "object" && "increment" in value
        ? `${quoted(field)} = COALESCE(${quoted(field)}, 0) + ?`
        : `${quoted(field)} = ?`
    );
    const values = Object.entries(changes).map(([field, value]) =>
      value && typeof value === "object" && "increment" in value
        ? Number(value.increment)
        : encode(field, value)
    );
    const executor = options.session?.connection ?? pool;
    const [result] = assignments.length
      ? await executor.execute<ResultSetHeader>(
          `UPDATE \`${this.table}\` SET ${assignments.join(", ")} WHERE ${
            clause.sql
          } LIMIT 1`,
          [...values, ...clause.values]
        )
      : [{ affectedRows: 0 } as ResultSetHeader];
    if (result.affectedRows || !options.upsert || existing)
      return { modifiedCount: result.affectedRows };
    const base: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(filter))
      if (
        !field.startsWith("$") &&
        (!value || typeof value !== "object" || value instanceof ObjectId)
      )
        base[field] = value;
    Object.assign(base, update.$setOnInsert, update.$set);
    for (const [field, amount] of Object.entries(update.$inc ?? {}))
      base[field] = Number(base[field] ?? 0) + Number(amount);
    await this.insertOne(base as T, options);
    return { modifiedCount: 1 };
  }
  async findOneAndUpdate(
    filter: Filter,
    update: Update,
    options: Options = {}
  ): Promise<T | null> {
    const before = await this.findOne(filter, {
      ...options,
      lock: Boolean(options.session),
    });
    if (!before && !options.upsert) return null;
    await this.updateOne(filter, update, options);
    if (options.returnDocument === "before") return before;
    const id = before?._id ?? update.$setOnInsert?._id;
    return id
      ? this.findOne({ _id: id }, options)
      : this.findOne(filter, options);
  }
  async countDocuments(filter: Filter = {}): Promise<number> {
    const clause = where(filter);
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM \`${this.table}\` WHERE ${clause.sql}`,
      clause.values
    );
    return Number(rows[0]?.total ?? 0);
  }
}

export function collections() {
  return {
    users: new SqlCollection<User>("users"),
    markets: new SqlCollection<Market>("markets"),
    days: new SqlCollection<MarketDay>("market_days"),
    bets: new SqlCollection<Bet>("bets"),
    entries: new SqlCollection<WalletEntry>("wallet_entries"),
    batches: new SqlCollection<BetBatch>("bet_batches"),
  };
}

const schema = [
  `CREATE TABLE IF NOT EXISTS users (id CHAR(24) PRIMARY KEY, email VARCHAR(255) UNIQUE, name VARCHAR(80), phone VARCHAR(10) UNIQUE, dob CHAR(10), referral_code VARCHAR(16) UNIQUE, referred_by CHAR(24), password_hash VARCHAR(255) NOT NULL, password_version INT NOT NULL DEFAULT 0, role ENUM('admin','player') NOT NULL, disabled BOOLEAN NOT NULL DEFAULT FALSE, balance_paise BIGINT NOT NULL DEFAULT 0, created_at DATETIME(3) NOT NULL, INDEX idx_users_role_created (role, created_at), FOREIGN KEY (referred_by) REFERENCES users(id)) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS markets (id CHAR(24) PRIMARY KEY, slug VARCHAR(100) NOT NULL UNIQUE, name VARCHAR(120) NOT NULL, open_time CHAR(5) NOT NULL, close_time CHAR(5) NOT NULL, timezone VARCHAR(64) NOT NULL, cutoff_minutes INT NOT NULL, active BOOLEAN NOT NULL, rate_card JSON NOT NULL, limits JSON NOT NULL, INDEX idx_markets_active_time (active, open_time)) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS market_days (id CHAR(24) PRIMARY KEY, market_id CHAR(24) NOT NULL, date CHAR(10) NOT NULL, open_panna CHAR(3), close_panna CHAR(3), cancelled BOOLEAN NOT NULL DEFAULT FALSE, revision INT NOT NULL DEFAULT 0, open_declared_at DATETIME(3), close_declared_at DATETIME(3), open_revision INT, close_revision INT, UNIQUE KEY uq_market_day (market_id, date), FOREIGN KEY (market_id) REFERENCES markets(id)) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS bets (id CHAR(24) PRIMARY KEY, user_id CHAR(24) NOT NULL, market_id CHAR(24) NOT NULL, date CHAR(10) NOT NULL, request JSON NOT NULL, slips JSON NOT NULL, total_stake_paise BIGINT NOT NULL, created_at DATETIME(3) NOT NULL, INDEX idx_bets_market_day (market_id, date, created_at), INDEX idx_bets_user_created (user_id, created_at), FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (market_id) REFERENCES markets(id)) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS wallet_entries (id CHAR(24) PRIMARY KEY, user_id CHAR(24) NOT NULL, amount_paise BIGINT NOT NULL, balance_after_paise BIGINT NOT NULL, kind VARCHAR(20) NOT NULL, reference_id VARCHAR(128) NOT NULL, created_at DATETIME(3) NOT NULL, UNIQUE KEY uq_wallet_reference (kind, reference_id, user_id), INDEX idx_wallet_user_created (user_id, created_at), FOREIGN KEY (user_id) REFERENCES users(id)) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS bet_batches (id CHAR(24) PRIMARY KEY, user_id CHAR(24) NOT NULL, request_id VARCHAR(128) NOT NULL, signature TEXT NOT NULL, bet_ids JSON NOT NULL, created_at DATETIME(3) NOT NULL, UNIQUE KEY uq_batch_request (user_id, request_id), FOREIGN KEY (user_id) REFERENCES users(id)) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS registration_challenges (id CHAR(24) PRIMARY KEY, phone VARCHAR(10) NOT NULL UNIQUE, name VARCHAR(80) NOT NULL, dob CHAR(10) NOT NULL, password_hash VARCHAR(255) NOT NULL, code_hash CHAR(64) NOT NULL, expires_at DATETIME(3) NOT NULL, last_sent_at DATETIME(3) NOT NULL, attempts TINYINT UNSIGNED NOT NULL DEFAULT 0, INDEX idx_registration_expiry (expires_at)) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS password_reset_challenges (id CHAR(24) PRIMARY KEY, user_id CHAR(24) NOT NULL UNIQUE, code_hash CHAR(64), token_hash CHAR(64), expires_at DATETIME(3) NOT NULL, last_sent_at DATETIME(3) NOT NULL, attempts TINYINT UNSIGNED NOT NULL DEFAULT 0, INDEX idx_reset_expiry (expires_at), FOREIGN KEY (user_id) REFERENCES users(id)) ENGINE=InnoDB`,
];

export async function connectDatabase(): Promise<
  ReturnType<typeof collections>
> {
  try {
    for (const statement of schema) await pool.query(statement);
    const [dobColumn] = await pool.execute<RowDataPacket[]>(
      "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'dob' LIMIT 1"
    );
    if (dobColumn.length === 0)
      await pool.query("ALTER TABLE users ADD COLUMN dob CHAR(10)");
    return collections();
  } catch (error) {
    await pool.end();
    throw error;
  }
}
