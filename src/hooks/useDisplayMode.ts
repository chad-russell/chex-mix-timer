import { useEffect, useState } from "react";

function getStandalone(): boolean {
  // iOS Safari
  const iosStandalone = (window.navigator as any).standalone === true;
  // Standard display-mode media query
  const mq = window.matchMedia?.("(display-mode: standalone)");
  return iosStandalone || mq?.matches === true;
}

function getIsIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export default function useDisplayMode() {
  const [isStandalone, setIsStandalone] = useState<boolean>(getStandalone());
  const isIOS = getIsIOS();

  useEffect(() => {
    const handler = () => setIsStandalone(getStandalone());
    const mq = window.matchMedia?.("(display-mode: standalone)");
    mq?.addEventListener?.("change", handler);
    return () => mq?.removeEventListener?.("change", handler);
  }, []);

  return { isStandalone, isIOS } as const;
}
