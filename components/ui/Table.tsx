"use client";

import Link from "next/link";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({ columns, data, emptyMessage = "No data available" }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200/60">
        <p className="text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-zinc-50/60 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 text-sm text-zinc-700 ${col.className || ""}`}
                  >
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
