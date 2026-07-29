export default function TranscriptCard({
  transcript,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Transcript
        </h2>
      </div>

      <div
        className="
          max-h-80
          overflow-y-auto
          whitespace-pre-wrap
          pr-3
          text-sm
          leading-7
          text-slate-600
        "
      >
        {transcript ||
          "No transcript available."}
      </div>
    </div>
  );
}