const variants = {
  default: "bg-slate-900 text-white border-transparent",
  outline: "border border-slate-200 bg-transparent text-slate-700",
  secondary: "bg-slate-100 text-slate-700 border-transparent",
};

export function Badge({ className = "", variant = "default", children, ...props }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium border transition-colors ${variants[variant] ?? variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
