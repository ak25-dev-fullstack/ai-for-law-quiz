const variants = {
  default: "bg-slate-900 text-white hover:bg-slate-700",
  outline: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
};

const sizes = {
  default: "h-9 px-4 py-2 text-sm",
  lg: "h-11 px-6 text-base",
  sm: "h-7 px-3 text-xs",
};

export function Button({ className = "", variant = "default", size = "default", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${variants[variant] ?? variants.default} ${sizes[size] ?? sizes.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
