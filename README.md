# Royal Club Matka

- `packages/matka-rules`: shared, exact result and payout rules.
- `Server`: authenticated MySQL API. See [Server/README.md](Server/README.md) for setup. Wallet and settlement operations use InnoDB transactions.
- `AdminPanel`: React admin at `http://localhost:5173` after `npm install && npm run dev`. Sign in with the account created by `npm run seed:admin` in `Server`.
- `Mobile`: React Native player app. Install dependencies and run `npm run android` or `npm run ios`. For Android debug builds, forward the API with `adb reverse tcp:4000 tcp:4000`.

Run `npm test` in `packages/matka-rules`, `npm run test:integration` in `Server` with `MYSQL_TEST_DATABASE` set to a dedicated test database, and `npm run build` in `AdminPanel` to verify the game logic, transactional settlement, and admin build.

No payment processor is configured. Player wallet credits are entered in AdminPanel with a payment reference; the mobile funds actions direct players to support.

The AdminPanel groups dashboard, user and market management, results, reports,
finance, content, and administration into submenus. It also manages app fund
limits and bonuses, slider uploads, notifications, detailed transaction
history, and permission-scoped sub-admin accounts.
