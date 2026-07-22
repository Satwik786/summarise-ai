export default function DashboardCard({
  title,
  children,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-6 ${className}`}
    >
      <h2 className="mb-5 text-lg font-semibold text-white">
        {title}
      </h2>

      {children}
    </div>
  );
}