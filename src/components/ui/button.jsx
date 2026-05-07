const variants = {
  default: "bg-violet-600 text-white hover:bg-violet-500 border border-transparent",
  outline: "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:border-zinc-600",
  ghost:   "bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent",
};

const sizes = {
  default: "h-9 px-4 text-sm",
  lg:      "h-11 px-5 text-sm font-medium",
  sm:      "h-8 px-3 text-xs",
};

export function Button({ className = "", variant = "default", size = "default", children, ...props }) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${variants[variant] ?? variants.default} ${sizes[size] ?? sizes.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
