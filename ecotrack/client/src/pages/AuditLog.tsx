import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../api/audit";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATE: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AuditLog() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", page],
    queryFn: () => getAuditLogs(page, 50),
  });

  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Audit Log
      </h1>
      <p className="text-sm text-gray-500">
        Full trail of all data changes in the system.
      </p>

      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                <tr>
                  {[
                    "Timestamp",
                    "User",
                    "Action",
                    "Table",
                    "Record ID",
                    "Details",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data?.data.map((log) => (
                  <tr
                    key={log.log_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {log.user_name ?? `#${log.user_id}`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          ACTION_COLORS[log.action] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {log.table_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      #{log.record_id}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages} — {data?.total.toLocaleString()} total
              records
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
