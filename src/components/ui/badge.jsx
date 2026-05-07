const variants = {
  default:   "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  outline:   "border border-zinc-700 bg-transparent text-zinc-400",
  secondary: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

export function Badge({ className = "", variant = "default", children, ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant] ?? variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
