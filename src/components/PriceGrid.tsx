

export function PriceGrid({ prices }: { prices?: Record<string, number> }) {
  if (!prices || typeof prices !== 'object') return <div className="text-sm text-textSecondary">No prices configured yet.</div>;

  const PRICE_FIELDS: Array<{ key: string; label: string }> = [
    { key: 'hour', label: 'Hour' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  return (
    <div className="mt-2 text-sm">
      <div className="grid grid-cols-3 gap-2 text-xs text-textSecondary font-medium">
        {PRICE_FIELDS.map((f) => (
          <div key={f.key} className="text-center">
            {f.label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
        {PRICE_FIELDS.map((f) => {
          const v = prices[`rwf_${f.key}`];
          return (
            <div key={`rwf-${f.key}`} className="text-center text-primary">
              {typeof v === 'number' && Number.isFinite(v) && v > 0 ? `RWF ${v.toLocaleString()}` : '—'}
            </div>
          );
        })}
      </div>

      <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
        {PRICE_FIELDS.map((f) => {
          const v = prices[`usd_${f.key}`];
          return (
            <div key={`usd-${f.key}`} className="text-center text-primary">
              {typeof v === 'number' && Number.isFinite(v) && v > 0 ? `USD ${v.toLocaleString()}` : '—'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
