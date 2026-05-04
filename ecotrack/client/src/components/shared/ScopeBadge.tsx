interface Props {
  scope: 1 | 2 | 3;
}

const SCOPE_STYLES: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  2: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  3: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function ScopeBadge({ scope }: Props) {
  return <span className={`badge ${SCOPE_STYLES[scope]}`}>Scope {scope}</span>;
}
