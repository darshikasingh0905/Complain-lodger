// Small display-formatting helpers shared across pages.

/** "123456789012" -> "XXXX XXXX 9012" */
export const maskAadhaar = (num = "") =>
  num && num.length >= 4 ? `XXXX XXXX ${num.slice(-4)}` : num || "";

/** "9876543210" -> "******3210" */
export const redactMobile = (num = "") =>
  num ? `******${num.slice(-4)}` : "";

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "—";
