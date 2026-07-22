export default function TranscriptCard({ transcript }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">
        Transcript
      </h2>

      <div className="max-h-80 overflow-y-auto text-zinc-300 leading-7 whitespace-pre-wrap">
        {transcript || "No transcript available."}
      </div>
    </div>
  );
}