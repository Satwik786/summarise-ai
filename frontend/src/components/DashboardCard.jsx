export default function DashboardCard({
  title,
  children,
  className = "",
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        border-slate-200/80
        bg-white/90
        p-6
        shadow-sm
        backdrop-blur-[2px]
        ${className}
      `}
    >
      <h2 className="mb-5 text-lg font-semibold text-slate-900">
        {title}
      </h2>

      {children}
    </div>
  );
}