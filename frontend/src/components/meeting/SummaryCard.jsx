export default function SummaryCard({
  summary,
  onRetry,
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">
        AI Summary
      </h2>

      <p className="leading-7 text-zinc-300">
        {summary || "No summary available."}
      </p>

      {summary?.includes("temporarily unavailable") && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Retry Analysis
        </button>
      )}
    </div>
  );
}