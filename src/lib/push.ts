export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

const API_BASE = '/api';

export function isPushCapable() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function getPublicKey(): Promise<Uint8Array | null> {
  try {
    const res = await fetch(`${API_BASE}/vapidPublicKey`);
    const { publicKey } = await res.json();
    if (!publicKey) return null;
    return urlBase64ToUint8Array(publicKey);
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function ensurePushSubscription(): Promise<PushSubscriptionJSON | null> {
  if (!isPushCapable() || Notification.permission !== 'granted') return null;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const appServerKey = await getPublicKey();
    if (!appServerKey) return null;
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey });
  }
  const json = sub.toJSON() as any;
  const parsed: PushSubscriptionJSON | null =
    json && typeof json.endpoint === 'string' && json.keys && typeof json.keys.p256dh === 'string' && typeof json.keys.auth === 'string'
      ? { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }
      : null;
  if (!parsed) return null;
  try {
    await fetch(`${API_BASE}/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: parsed }) });
  } catch {}
  try {
    localStorage.setItem('push_subscription', JSON.stringify(parsed));
  } catch {}
  return parsed;
}

export function getSavedSubscription(): PushSubscriptionJSON | null {
  try {
    const raw = localStorage.getItem('push_subscription');
    if (!raw) return null;
    const json = JSON.parse(raw);
    if (json && typeof json.endpoint === 'string' && json.keys && typeof json.keys.p256dh === 'string' && typeof json.keys.auth === 'string') {
      return json as PushSubscriptionJSON;
    }
    return null;
  } catch {
    return null;
  }
}

export async function scheduleNext(atMs: number, title: string, body?: string) {
  const sub = getSavedSubscription();
  if (!sub) return;
  try {
    await fetch(`${API_BASE}/scheduleNext`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub, atMs, title, body })
    });
  } catch {}
}

export async function cancelScheduled() {
  const sub = getSavedSubscription();
  if (!sub) return;
  try {
    await fetch(`${API_BASE}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub })
    });
  } catch {}
}

export async function unsubscribePush(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const current = await reg.pushManager.getSubscription();
    if (current) {
      await current.unsubscribe();
    }
  } catch {}
  try { localStorage.removeItem('push_subscription'); } catch {}
  await cancelScheduled();
  return true;
}
