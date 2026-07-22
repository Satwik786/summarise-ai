export default function Navbar({ status }) {
  const statusColor = {
    Ready: "bg-blue-500",
    Recording: "bg-green-500",
    Processing: "bg-yellow-500",
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            SummaRise
          </h1>

          <p className="text-sm text-zinc-400">
            Transform conversations into actionable insights
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${statusColor[status]}`}
          ></span>

          <span className="text-sm text-zinc-300">
            {status}
          </span>
        </div>
      </div>
    </header>
  );
}