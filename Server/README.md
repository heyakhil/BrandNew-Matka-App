# Royal Club API

Requires Node 22+ and MySQL 8.0+ with InnoDB tables.

1. Create the database with `CREATE DATABASE royal_club_matka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` and grant the app user access to it.
2. Copy `.env.example` to `.env` and set the MySQL connection values, a long random `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
3. Run `npm install` and `npm run seed:admin`.
4. Run `npm run seed:markets` for the starter market schedule.
5. Run `npm run dev`.

Player sign-up and password reset use Renflair four-digit SMS OTPs. Add `RENFLAIR_API_KEY` to `Server/.env`; the key stays on the server. Each code expires after five minutes and allows five attempts. A verified password reset invalidates older app sessions.

Tables and indexes are created on the first connection. Use a separate MySQL database for integration tests and set `MYSQL_TEST_DATABASE` before `npm run test:integration`.

The API listens on port 4000 by default. The admin panel expects `ADMIN_ORIGIN=http://localhost:5173`. For Android USB testing, run `npm run android:local` from `Mobile`; it starts the API and Metro, forwards the ports, and installs the current debug build. Production mobile builds require an HTTPS `API_URL` in `Mobile/.env`.

Money is stored as integer paise. Each bet batch, wallet debit, result settlement, reversal, and refund runs in a MySQL transaction. Market results are derived from pannas through `packages/matka-rules`; admins never enter a jodi. A repeated declaration is a no-op; a correction requires a reversal first.

Pay0 deposits require `PAY0_USER_TOKEN`, `PAY0_SECRET`, and an HTTPS
`PUBLIC_API_URL` reachable by Pay0 (including the `/api` suffix). Keep both
Pay0 credentials only in `Server/.env`; never expose them to mobile builds. The
provider base URL defaults to `https://api.pay0.shop/apiv1`.

Configure the Pay0 webhook URL as
`PUBLIC_API_URL/payments/pay0/webhook` and allow its redirect endpoint at
`PUBLIC_API_URL/payments/pay0/redirect`. The webhook signature is verified as
HMAC-SHA256 of the order ID, then the payment is independently checked with
Pay0. The returned amount must match the original deposit before the wallet
and payment order are completed atomically. `MOBILE_DEEP_LINK_SCHEME` defaults
to `royalclubmatka`.

The admin API includes permission-scoped sub-admin accounts, application fund
and bonus settings, uploaded slider banners, notifications, player details,
market profit and winner reports, and deposit/withdrawal transaction history.
The database migrates these tables and the `users.admin_permissions` field on
startup. Existing admins without a permissions list retain full access.
