type Status =
  | "compliant"
  | "non_compliant"
  | "pending"
  | "Never submitted"
  | "Overdue"
  | "Late"
  | "On track"
  | string;

const STYLE_MAP: Record<string, string> = {
  compliant:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "On track":
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  non_compliant: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Never submitted":
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Late: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

export function StatusBadge({ status }: { status: Status }) {
  const style = STYLE_MAP[status] ?? "bg-gray-100 text-gray-700";
  return <span className={`badge ${style}`}>{status.replace("_", " ")}</span>;
}
