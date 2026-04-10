export function Progress({ value = 0, className = "", ...props }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-slate-100 ${className}`} {...props}>
      <div
        className="h-full bg-slate-900 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
