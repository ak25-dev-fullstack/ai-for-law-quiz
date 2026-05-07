export function Card({ className = "", children, ...props }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`flex flex-col gap-1 px-5 pt-5 pb-4 sm:px-6 sm:pt-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <h3 className={`text-base font-semibold text-zinc-100 sm:text-lg ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...props }) {
  return (
    <p className={`text-sm text-zinc-500 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`px-5 pb-5 sm:px-6 sm:pb-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
