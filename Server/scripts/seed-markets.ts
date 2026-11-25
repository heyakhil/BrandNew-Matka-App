import "dotenv/config";
import { ObjectId } from "../src/db.ts";
import {
  DEFAULT_RATE_CARD,
  DEFAULT_STAKE_LIMITS,
} from "../../packages/matka-rules/src/index.ts";
import { client, connectDatabase } from "../src/db.ts";

const markets = [
  ["test-bazar-open", "TEST BAZAR (OPEN)", "23:45", "23:55"],
  ["test-bazar-night", "TEST BAZAR NIGHT", "23:50", "23:59"],
  ["anmol-morning", "ANMOL MORNING", "10:20", "12:00"],
  ["sita-morning", "SITA MORNING", "10:30", "12:15"],
  ["sridevi", "SRIDEVI", "11:35", "12:35"],
  ["time-bazar", "TIME BAZAR", "13:00", "14:00"],
  ["milan-day", "MILAN DAY", "15:00", "17:00"],
  ["kalyan", "KALYAN", "16:15", "18:15"],
  ["supreme-night", "SUPREME NIGHT", "20:45", "22:45"],
  ["main-bazar", "MAIN BAZAR", "21:40", "00:05"],
] as const;

async function main(): Promise<void> {
  try {
    const data = await connectDatabase();
    for (const [slug, name, openTime, closeTime] of markets) {
      await data.markets.updateOne(
        { slug },
        {
          $setOnInsert: {
            _id: new ObjectId(),
            slug,
            name,
            openTime,
            closeTime,
            timezone: "Asia/Kolkata",
            cutoffMinutes: 10,
            active: true,
            rateCard: DEFAULT_RATE_CARD,
            limits: DEFAULT_STAKE_LIMITS,
          },
        },
        { upsert: true }
      );
    }
    console.log(`${markets.length} markets ready.`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

await main();
