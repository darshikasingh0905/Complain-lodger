import React, { useState, useRef, useEffect } from "react";
import {
  X,
  ImagePlus,
  ScanSearch,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  ArrowLeftRight,
} from "lucide-react";

/**
 * Closed-loop resolution modal (USP).
 *
 * Marking a complaint "Resolved" requires an AFTER photo of the fix. The
 * vision AI compares it with the citizen's BEFORE evidence:
 *  - FIXED / UNCERTAIN → the ticket moves to Resolved.
 *  - NOT_FIXED → the close-out is BLOCKED; the admin sees the AI's reason
 *    and can only proceed with an explicit override.
 */

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ResolveProofModal({ open, complaint, onResolve, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null); // updated complaint after verification
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // Reset whenever the modal opens for a (new) complaint
  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(null);
      setResult(null);
      setError("");
      setVerifying(false);
    }
  }, [open, complaint?.id]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  if (!open || !complaint) return null;

  const pickFile = (f) => {
    if (!f || !ACCEPTED.includes(f.type)) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  };

  const run = async (force = false) => {
    if (!file) {
      setError("A photo of the completed fix is required to resolve this complaint.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const updated = await onResolve(complaint.id, file, force);
      setResult(updated);
      // Fully resolved → close shortly so the admin sees the verdict flash
      if (updated.status === "Resolved") {
        setTimeout(onClose, 1600);
      }
    } catch (err) {
      setError(err.message || "Fix verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // STRICT policy: only a positive FIXED verdict resolves. NOT_FIXED and
  // UNCERTAIN (irrelevant/unreadable photo, or vision AI offline) both block.
  const blocked = result && result.status !== "Resolved";
  const resolved = result && result.status === "Resolved";
  const beforeUrl = complaint.imagePreview || complaint.imageFullUrl;

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0f172a]/60" onClick={verifying ? undefined : onClose} />

      <div className="relative bg-surface border border-border rounded-card shadow-lift w-full max-w-lg max-h-[90vh] overflow-y-auto animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <div>
            <h3 className="font-bold text-text flex items-center gap-2">
              <ScanSearch className="w-4 h-4 text-primary" />
              Resolve with Photo Proof
            </h3>
            <p className="text-xs text-muted mt-0.5">
              #{complaint.id} — AI verifies the fix before the ticket can close.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={verifying}
            aria-label="Close"
            className="p-1.5 rounded-md text-muted hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Before / After strip */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="label !mb-1.5">Before (citizen evidence)</p>
              {beforeUrl ? (
                <img
                  src={beforeUrl}
                  alt="Before"
                  className="w-full h-36 object-cover rounded-lg border border-border bg-surfaceSoft"
                />
              ) : (
                <div className="w-full h-36 rounded-lg border border-dashed border-border bg-surfaceSoft flex items-center justify-center text-[11px] text-muted text-center px-3">
                  No before photo (safety reports don't require one)
                </div>
              )}
            </div>
            <div>
              <p className="label !mb-1.5">After (fix photo) *</p>
              {preview ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-36 rounded-lg border border-primary/40 overflow-hidden"
                  title="Click to change the photo"
                >
                  <img src={preview} alt="After" className="w-full h-full object-cover" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-36 rounded-lg border-2 border-dashed border-border bg-surfaceSoft
                    hover:border-primary/50 hover:bg-primary-light/40 transition-all
                    flex flex-col items-center justify-center gap-1.5 text-muted"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[11px] font-semibold">Upload fix photo</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="alert-info !text-xs items-center">
            <ArrowLeftRight className="w-4 h-4 shrink-0" />
            <span>
              The vision AI compares both photos. The ticket resolves <strong>only</strong> if
              the AI positively verifies the fix — unrelated or unclear photos are rejected.
              The AI is the citizen's advocate.
            </span>
          </div>

          {error && (
            <div className="alert-error !text-xs items-center">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verdict result */}
          {result && (
            <div
              className={`rounded-card border p-4 space-y-2 ${
                resolved
                  ? "bg-status-success-bg border-status-success-border"
                  : blocked
                    ? "bg-status-error-bg border-status-error-border"
                    : "bg-status-warning-bg border-status-warning-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold flex items-center gap-1.5 text-text">
                  {resolved ? (
                    <CheckCircle2 className="w-4 h-4 text-status-success-accent" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-status-error-accent" />
                  )}
                  AI Fix Verification
                </span>
                <span
                  className={
                    result.fix_verdict === "FIXED"
                      ? "badge-success"
                      : result.fix_verdict === "NOT_FIXED"
                        ? "badge-error"
                        : "badge-warning"
                  }
                >
                  {result.fix_verdict || "UNCERTAIN"}
                  {result.fix_confidence != null &&
                    ` · ${Math.round(result.fix_confidence * 100)}%`}
                </span>
              </div>
              {result.fix_reason && (
                <p className="text-xs text-muted leading-relaxed">{result.fix_reason}</p>
              )}
              {resolved && (
                <p className="text-xs font-semibold text-status-success-text">
                  Ticket marked Resolved — the citizen has been notified to confirm.
                </p>
              )}
              {blocked && (
                <p className="text-xs font-semibold text-status-error-text">
                  {result.fix_verdict === "NOT_FIXED"
                    ? "Close-out blocked — the AI says the issue still looks unresolved. Fix it and retry, or override below if you're certain the AI is wrong."
                    : "Close-out blocked — the photo doesn't verifiably show this issue fixed (irrelevant/unclear photo, or vision AI offline). Upload a clear photo of the actual fix, or override below."}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {!blocked ? (
              <button
                onClick={() => run(false)}
                disabled={verifying || !file || resolved}
                className="btn-primary flex-1 !py-3"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying with AI…
                  </>
                ) : (
                  <>
                    <ScanSearch className="w-4 h-4" />
                    Verify Fix &amp; Resolve
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => run(true)}
                disabled={verifying}
                className="btn-danger flex-1 !py-3 !border-status-error-border"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                Override &amp; Resolve Anyway
              </button>
            )}
            <button
              onClick={onClose}
              disabled={verifying}
              className="btn-secondary flex-1 !py-3"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
