# Royal Club API

Requires Node 22+ and MySQL 8.0+ with InnoDB tables.

1. Create the database with `CREATE DATABASE royal_club_matka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` and grant the app user access to it.
2. Copy `.env.example` to `.env` and set the MySQL connection values, a long random `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
3. Run `npm install` and `npm run seed:admin`.
4. Run `npm run seed:markets` for the starter market schedule.
5. Run `npm run dev`.

Player sign-up and password reset use Renflair four-digit SMS OTPs. Add `RENFLAIR_API_KEY` to `Server/.env`; the key stays on the server. Each code expires after five minutes and allows five attempts. A verified password reset invalidates older app sessions.

Tables and indexes are created on the first connection. Use a separate MySQL database for integration tests and set `MYSQL_TEST_DATABASE` before `npm run test:integration`.

The API listens on port 4000 by default. The admin panel expects `ADMIN_ORIGIN=http://localhost:5173`. For Android USB testing, run `npm run android:local` from `Mobile`; it starts the API and Metro, forwards the ports, and installs the current debug build. Production builds need an HTTPS API address in `Mobile/src/services/api.ts`.

Money is stored as integer paise. Each bet batch, wallet debit, result settlement, reversal, and refund runs in a MySQL transaction. Market results are derived from pannas through `packages/matka-rules`; admins never enter a jodi. A repeated declaration is a no-op; a correction requires a reversal first.

No payment gateway is configured. Wallet credits currently require an admin adjustment with a payment reference. Mobile deposit and withdrawal buttons direct players to support until a payment flow is implemented.
