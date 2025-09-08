import express, { Request, Response, NextFunction } from "express";
import path from "node:path";
import cors from "cors";
import webPush, { PushSubscription } from "web-push";
import { Queue, Worker, JobsOptions, QueueEvents, Job } from "bullmq";
import crypto from "node:crypto";
import { warn } from "node:console";

// Env
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const REDIS_URL = process.env.REDIS_URL || "";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const API_KEY = process.env.SCHEDULE_API_KEY || "";
const STATIC_DIR = path.resolve(process.cwd(), "dist");

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn("VAPID keys not set; push scheduling will be disabled.");
}

webPush.setVapidDetails(
  "mailto:push@chexmix.local",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

const app = express();
app.use(express.json());
app.use(cors());

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!API_KEY) return next();
  const key = req.header("x-api-key");
  if (key && key === API_KEY) return next();
  return res.status(401).json({ error: "unauthorized" });
}

// Simple queue for scheduled pushes
const hasRedis = !!REDIS_URL;
const queueName = "chexmix-push";
const connection = hasRedis
  ? { connection: { url: REDIS_URL } }
  : (undefined as any);
const pushQueue = hasRedis ? new Queue(queueName, connection) : null;
const queueEvents = hasRedis ? new QueueEvents(queueName, connection) : null;

if (hasRedis) {
  // Start a worker in-process
  new Worker(
    queueName,
    async (job: Job) => {
      const { subscription, payload } = job.data as {
        subscription: PushSubscription;
        payload: { title: string; body?: string };
      };
      try {
        await webPush.sendNotification(subscription, JSON.stringify(payload), {
          TTL: 180,
        });
      } catch (err: any) {
        // 410 Gone: subscription expired
        if (err?.statusCode === 410) {
          console.warn(
            "Subscription expired (410), endpoint:",
            subscription.endpoint,
          );
        } else {
          console.error(
            "Push send error:",
            err?.statusCode || err?.message || err,
          );
        }
      }
    },
    connection,
  );
  queueEvents?.on("failed", ({ jobId, failedReason }) => {
    console.error("Job failed", jobId, failedReason);
  });
}

function endpointJobId(endpoint: string) {
  return crypto.createHash("sha1").update(endpoint).digest("hex");
}

// API routes
app.get("/api/vapidPublicKey", (_req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post("/api/subscribe", requireAuth, (_req: Request, res: Response) => {
  // No server-side storage required for this flow; endpoint used for job id.
  res.json({ ok: true });
});

app.post(
  "/api/scheduleNext",
  requireAuth,
  async (req: Request, res: Response) => {
    if (!hasRedis || !pushQueue || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(503).json({ error: "push scheduling unavailable" });
    }
    const { subscription, atMs, title, body } = req.body as {
      subscription: PushSubscription;
      atMs: number;
      title: string;
      body?: string;
    };
    if (!subscription || !subscription.endpoint || !Number.isFinite(atMs)) {
      return res.status(400).json({ error: "invalid payload" });
    }
    const id = endpointJobId(subscription.endpoint);
    const delay = Math.max(0, Math.round(atMs - Date.now()));
    const opts: JobsOptions = {
      delay,
      removeOnComplete: true,
      removeOnFail: true,
      jobId: id,
    }; // replace existing
    await pushQueue.add(
      "push",
      { subscription, payload: { title, body } },
      opts,
    );
    res.json({ ok: true, scheduledInMs: delay, jobId: id });
  },
);

app.post("/api/cancel", requireAuth, async (req: Request, res: Response) => {
  if (!hasRedis || !pushQueue) return res.json({ ok: true });
  const { subscription } = req.body as { subscription: PushSubscription };
  if (!subscription || !subscription.endpoint) return res.json({ ok: true });
  const id = endpointJobId(subscription.endpoint);
  try {
    await pushQueue.remove(id);
  } catch {}
  res.json({ ok: true, jobId: id });
});

// Static files (frontend)
app.use(
  express.static(STATIC_DIR, { index: false, maxAge: "1y", immutable: true }),
);
// SPA fallback except for /api
app.get("*", (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on :${PORT}`);
});
