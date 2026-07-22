export default function DiscussionCard({ points = [] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">
        Discussion Points
      </h2>

      <ul className="space-y-3 list-disc list-inside text-zinc-300">
        {points.length ? (
          points.map((point, index) => (
            <li key={index}>{point}</li>
          ))
        ) : (
          <li>No discussion points.</li>
        )}
      </ul>
    </div>
  );
}