import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      <div className="relative card w-full max-w-md animate-pop">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-status-warning-bg flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-status-warning-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">{title}</h3>
            <p className="text-sm text-muted mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
