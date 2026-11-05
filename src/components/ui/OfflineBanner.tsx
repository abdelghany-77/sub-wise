import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-400/20 bg-[#1a1710]/95 px-4 py-2 text-xs text-amber-200 shadow-xl shadow-black/30 backdrop-blur-md"
    >
      <CloudOff size={14} aria-hidden="true" />
      <span>Offline mode — changes are saved on this device</span>
    </div>
  );
}
