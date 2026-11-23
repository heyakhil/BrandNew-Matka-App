import "dotenv/config";
import { ObjectId } from "../src/db.ts";
import { hashPassword } from "../src/auth.ts";
import { client, connectDatabase } from "../src/db.ts";

async function main(): Promise<void> {
  try {
    const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 12)
      throw new Error(
        "Set ADMIN_EMAIL and a password of at least 12 characters."
      );
    const data = await connectDatabase();
    const passwordHash = await hashPassword(password);
    await data.users.updateOne(
      { email },
      {
        $set: { passwordHash, role: "admin", disabled: false },
        $inc: { passwordVersion: 1 },
        $setOnInsert: {
          _id: new ObjectId(),
          email,
          balancePaise: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log(`Admin ready: ${email}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

await main();
