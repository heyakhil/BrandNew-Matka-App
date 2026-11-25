import fs from "node:fs";
import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import {
  getMessaging,
  type Messaging,
  type SendResponse,
} from "firebase-admin/messaging";
import { ObjectId, type collections } from "./db.ts";

let firebaseApp: App | null = null;
let messagingService: Messaging | null = null;

function initFirebase(): void {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0 && existingApps[0]) {
      firebaseApp = existingApps[0];
      messagingService = getMessaging(firebaseApp);
      return;
    }

    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountRaw) {
      let credentials: ServiceAccount;
      if (serviceAccountRaw.trim().startsWith("{")) {
        credentials = JSON.parse(serviceAccountRaw) as ServiceAccount;
      } else if (fs.existsSync(serviceAccountRaw.trim())) {
        const fileContent = fs.readFileSync(serviceAccountRaw.trim(), "utf-8");
        credentials = JSON.parse(fileContent) as ServiceAccount;
      } else {
        console.warn("[Firebase] FIREBASE_SERVICE_ACCOUNT_KEY file not found, running in mock mode.");
        return;
      }

      firebaseApp = initializeApp({
        credential: cert(credentials),
      });
      messagingService = getMessaging(firebaseApp);
      console.log("[Firebase] Admin SDK initialized with service account.");
      return;
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      firebaseApp = initializeApp({
        credential: applicationDefault(),
      });
      messagingService = getMessaging(firebaseApp);
      console.log("[Firebase] Admin SDK initialized with applicationDefault.");
      return;
    }

    console.info("[Firebase] No credentials configured. Running in fallback mock mode for push notifications.");
  } catch (error: unknown) {
    console.error("[Firebase] Initialization error:", error);
  }
}

initFirebase();

export function isFirebaseConfigured(): boolean {
  return messagingService !== null;
}

export async function sendTopicPushNotification(
  topic: string,
  title: string,
  body: string,
  dataPayload?: Record<string, string>
): Promise<boolean> {
  try {
    const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]/g, "_");
    if (!messagingService) {
      console.warn(
        `[FCM Mock Mode] Notification saved to DB, but real FCM push to topic '${sanitizedTopic}' was skipped because FIREBASE_SERVICE_ACCOUNT_KEY is missing in Server/.env.`
      );
      return true;
    }

    const response = await messagingService.send({
      topic: sanitizedTopic,
      notification: {
        title,
        body,
      },
      data: dataPayload ?? {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "royal_club_alerts",
        },
      },
    });

    console.log(`[FCM Topic ${sanitizedTopic}] Sent: ${response}`);
    return true;
  } catch (error: unknown) {
    console.error(`[FCM Topic ${topic}] Failed to send:`, error);
    return false;
  }
}

export async function sendUserPushNotification(
  data: ReturnType<typeof collections>,
  userId: ObjectId,
  title: string,
  body: string,
  dataPayload?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> {
  try {
    const tokenRecords = await data.fcmTokens.find({ userId }).toArray();
    if (tokenRecords.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const tokens = tokenRecords.map((record) => record.token);

    if (!messagingService) {
      console.log(`[FCM Mock User: ${userId.toString()}] (${tokens.length} devices) Title: "${title}" | Body: "${body}" | Data:`, dataPayload ?? {});
      return { successCount: tokens.length, failureCount: 0 };
    }

    const response = await messagingService.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: dataPayload ?? {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "royal_club_alerts",
        },
      },
    });

    const deadTokens: string[] = [];
    response.responses.forEach((res: SendResponse, index: number) => {
      if (!res.success && res.error) {
        const code = res.error.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          const deadToken = tokens[index];
          if (deadToken) deadTokens.push(deadToken);
        }
      }
    });

    if (deadTokens.length > 0) {
      for (const token of deadTokens) {
        await data.fcmTokens.deleteMany({ token });
      }
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error: unknown) {
    console.error(`[FCM User ${userId.toString()}] Send error:`, error);
    return { successCount: 0, failureCount: 0 };
  }
}

export async function registerFcmToken(
  data: ReturnType<typeof collections>,
  userId: ObjectId,
  token: string,
  platform: "android" | "ios" = "android"
): Promise<void> {
  try {
    const existing = await data.fcmTokens.findOne({ token });
    if (existing) {
      await data.fcmTokens.updateOne(
        { _id: existing._id },
        {
          $set: {
            userId,
            platform,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      await data.fcmTokens.insertOne({
        _id: new ObjectId(),
        userId,
        token,
        platform,
        updatedAt: new Date(),
      });
    }

    if (messagingService) {
      await messagingService.subscribeToTopic([token], "all").catch((err: unknown) => {
        console.warn("[FCM] Failed to subscribe token to 'all' topic:", err);
      });
      await messagingService.subscribeToTopic([token], "results").catch((err: unknown) => {
        console.warn("[FCM] Failed to subscribe token to 'results' topic:", err);
      });
    }
  } catch (error: unknown) {
    console.error("[FCM] Register token error:", error);
    throw error;
  }
}

export async function removeFcmToken(
  data: ReturnType<typeof collections>,
  token: string
): Promise<void> {
  try {
    await data.fcmTokens.deleteMany({ token });
    if (messagingService) {
      await messagingService.unsubscribeFromTopic([token], "all").catch(() => {});
      await messagingService.unsubscribeFromTopic([token], "results").catch(() => {});
    }
  } catch (error: unknown) {
    console.error("[FCM] Remove token error:", error);
  }
}
