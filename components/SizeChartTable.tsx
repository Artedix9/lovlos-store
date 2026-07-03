import type { SizeChart } from "@/lib/sizeGuide";

/** Presentational size table — server-safe, shared by the PDP modal and /size-guide. */
export default function SizeChartTable({ chart }: { chart: SizeChart }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <caption className="sr-only">{chart.label} size chart, measurements in centimetres</caption>
        <thead>
          <tr className="border-b border-primary">
            <th scope="col" className="py-3 pr-4 text-[10px] font-bold tracking-ultra uppercase text-primary">
              Size
            </th>
            {chart.columns.map((col) => (
              <th key={col} scope="col" className="py-3 pr-4 text-[10px] font-bold tracking-ultra uppercase text-primary whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-mercury">
          {chart.rows.map((row) => (
            <tr key={row.size}>
              <th scope="row" className="py-3 pr-4 text-xs font-bold tracking-widest uppercase text-primary">
                {row.size}
              </th>
              {row.values.map((v, i) => (
                <td key={i} className="py-3 pr-4 text-sm text-mine tracking-wide whitespace-nowrap">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
