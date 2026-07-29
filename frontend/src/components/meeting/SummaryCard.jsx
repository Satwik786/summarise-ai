export default function SummaryCard({
  summary,
  onRetry,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          AI Summary
        </h2>
      </div>

      <p className="max-w-5xl text-sm leading-7 text-slate-600">
        {summary || "No summary available."}
      </p>

      {summary?.includes("temporarily unavailable") && (
        <button
          onClick={onRetry}
          className="
            mt-5
            rounded-lg
            border
            border-indigo-200
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-indigo-600
            transition
            hover:border-indigo-300
            hover:bg-indigo-50
            focus:outline-none
            focus:ring-2
            focus:ring-indigo-100
          "
        >
          Retry Analysis
        </button>
      )}
    </div>
  );
}