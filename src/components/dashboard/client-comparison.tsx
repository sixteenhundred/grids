"use client";

import { Icon } from "./icons";
import { COMPARISON } from "@/lib/client-plans";

/** Clean Free / Agency / Enterprise comparison. Horizontally scrollable on
 *  mobile with a sticky feature column. */
export function ClientComparison() {
  const cols: { key: "free" | "agency" | "enterprise"; label: string; accent: string }[] = [
    { key: "free", label: "Free", accent: "text-white/70" },
    { key: "agency", label: "Agency", accent: "text-escrow-green" },
    { key: "enterprise", label: "Enterprise", accent: "text-aerial-cyan" },
  ];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] p-1.5 backdrop-blur-sm">
      <div className="overflow-x-auto rounded-[calc(2rem-0.375rem)]">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="sticky left-0 z-10 bg-[#0a0f15] px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.14em] text-white/45">
                Feature
              </th>
              {cols.map((c) => (
                <th key={c.key} className={`px-4 py-4 text-center text-sm font-semibold ${c.accent}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr
                key={row.label}
                className={`border-b border-white/6 ${i % 2 === 1 ? "bg-white/[0.015]" : ""}`}
              >
                <th
                  scope="row"
                  className={`sticky left-0 z-10 px-5 py-3 text-left text-sm font-normal text-white/75 ${i % 2 === 1 ? "bg-[#0b1016]" : "bg-[#0a0f15]"}`}
                >
                  {row.label}
                </th>
                {cols.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-center">
                    {row[c.key] ? (
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] ${c.accent}`}>
                        <Icon name="check" size={14} />
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
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
