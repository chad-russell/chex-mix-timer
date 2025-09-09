import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useDisplayMode from "../hooks/useDisplayMode";
import {
  ensurePushSubscription,
  getSavedSubscription,
  isPushCapable,
  scheduleNext,
  cancelScheduled,
  unsubscribePush,
} from "../lib/push";

export default function Settings() {
  const { isStandalone, isIOS } = useDisplayMode();
  const [permission, setPermission] = useState<NotificationPermission>(
    ("Notification" in window
      ? Notification.permission
      : "default") as NotificationPermission,
  );
  const [status, setStatus] = useState<string>("");
  const [sub, setSub] = useState(() => getSavedSubscription());

  useEffect(() => {
    setPermission(
      ("Notification" in window
        ? Notification.permission
        : "default") as NotificationPermission,
    );
  }, []);

  // Auto-ensure subscription if already granted
  useEffect(() => {
    if (permission === "granted") {
      ensurePushSubscription().catch(() => {});
    }
  }, [permission]);

  const canPush = isPushCapable();

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") {
      await ensurePushSubscription();
      setSub(getSavedSubscription());
      setStatus("Notifications enabled and subscription saved.");
    }
  }

  async function testPush() {
    if (!canPush) {
      console.log(
        "Push not supported in this browser/origin. Use a supported browser and ensure HTTPS.",
      );
      setStatus(
        "Push not supported in this browser/origin. Use a supported browser and ensure HTTPS.",
      );
      return;
    }
    const s = await ensurePushSubscription();
    if (!s) {
      console.log("Subscription unavailable. Enable notifications first.");
      setStatus("Subscription unavailable. Enable notifications first.");
      return;
    }
    setSub(s);
    const at = Date.now() + 5000;
    console.log(`Scheduling push for Date: ${at}`);
    await scheduleNext(at, "Chex Mix: Test", "This is a test push.");
    setStatus("Scheduled test push in ~5s.");
  }

  async function cancelPush() {
    await cancelScheduled();
    setStatus("Cancelled any scheduled push.");
  }

  async function unsubscribeNotifications() {
    await unsubscribePush();
    setSub(getSavedSubscription());
    setStatus("Unsubscribed from push notifications.");
  }

  return (
    <div className="section-card bg-white border-2 border-green-500 rounded-3xl shadow-xl p-6 md:p-10 w-full max-w-xl">
      <motion.h2 className="text-3xl font-bold text-green-800 mb-4">
        Settings
      </motion.h2>

      <div className="space-y-3 text-sm">
<div className="p-3 rounded-xl border bg-green-50 border-green-200 text-black">
<div>
<span className="font-semibold">PWA installed:</span>{" "}
{isStandalone ? "Yes" : "No"}
</div>
<div>
<span className="font-semibold">Device:</span>{" "}
{isIOS ? "iOS" : "Other"}
</div>
<div>
<span className="font-semibold">Push capable:</span>{" "}
{canPush ? "Yes" : "No"}
</div>
<div>
<span className="font-semibold">Notification permission:</span>{" "}
{permission}
</div>
<div>
<span className="font-semibold">App Version:</span>{" "}
{__APP_VERSION__}
</div>
<div className="truncate">
<span className="font-semibold">Subscribed endpoint:</span>{" "}
{sub?.endpoint ? new URL(sub.endpoint).host + " …" : "None"}
</div>
</div>

        {!isStandalone && isIOS && (
          <div className="p-3 bg-yellow-50 border-2 border-yellow-500 rounded-xl text-yellow-800">
            On iPhone, install this app to Home Screen (Share → Add to Home
            Screen) to enable push notifications.
          </div>
        )}

        {permission !== "granted" && (
          <button
            className="btn btn-outline border-2 border-yellow-500 hover:bg-yellow-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 text-yellow-700 w-full"
            onClick={enableNotifications}
          >
            Enable Notifications
          </button>
        )}

        {permission === "granted" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                className="btn btn-primary bg-green-500 border-2 border-green-600 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold w-full"
                onClick={testPush}
              >
                Send Test Push
              </button>
              <button
                className="btn btn-secondary btn-outline border-2 border-green-500 hover:bg-green-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-green-700 w-full"
                onClick={cancelPush}
              >
                Cancel Scheduled
              </button>
            </div>
            {sub && (
              <button
                className="btn btn-secondary btn-outline border-2 border-red-500 hover:bg-red-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-red-700 w-full mt-3"
                onClick={unsubscribeNotifications}
              >
                Unsubscribe from Push Notifications
              </button>
            )}
          </>
        )}

        <button
  className="btn btn-secondary btn-outline border-2 border-red-500 hover:bg-red-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-red-700 w-full mt-3"
  onClick={() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    try {
      navigator.vibrate?.(50);
    } catch {
      // ignore
    }
    // Reload to ensure all state resets to defaults
    window.location.reload();
  }}
>
  Clear Local Storage
</button>
{status && (
          <div className="p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
