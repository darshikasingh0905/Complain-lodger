import React from "react";
import { WifiOff } from "lucide-react";
import { useComplaints } from "../../context/ComplaintContext";

/**
 * Slim banner shown when the FastAPI backend is unreachable and the app is
 * running on the localStorage simulation instead.
 */
export function OfflineBanner() {
  const { apiOnline } = useComplaints();
  if (apiOnline !== false) return null;

  return (
    <div className="bg-status-warning-bg border-b border-status-warning-border text-status-warning-text text-xs font-medium px-4 py-2 flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      Backend offline — running in local demo mode. Start the API
      (<code className="font-mono">uvicorn app.main:app --reload</code>) for full functionality.
    </div>
  );
}

export default OfflineBanner;
