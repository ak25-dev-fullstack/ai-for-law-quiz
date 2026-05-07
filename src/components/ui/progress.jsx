export function Progress({ value = 0, className = "", ...props }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-zinc-800 ${className}`} {...props}>
      <div
        className="h-full bg-violet-500 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
