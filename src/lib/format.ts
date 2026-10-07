/** Display helpers. Amounts are shown with the currency code here: clear for staff, no symbol guessing. */

export const formatAmount = (amount: number | undefined, code: string) =>
  amount === undefined ? "—" : `${code} ${new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US").format(amount)}`;

export const formatDate = (value: string | Date | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const formatDateTime = (value: string | Date | null | undefined) =>
  value
    ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** "IN_PROGRESS" -> "In progress". */
export const humanize = (value: string) =>
  (value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ")).replace(/\bpdf\b/gi, "PDF");

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
