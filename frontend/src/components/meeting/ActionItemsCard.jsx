export default function ActionItemsCard({ items = [] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">
        Action Items
      </h2>

      <ul className="space-y-3 list-disc list-inside text-zinc-300">
        {items.length ? (
          items.map((item, index) => (
            <li key={index}>{item}</li>
          ))
        ) : (
          <li>No action items.</li>
        )}
      </ul>
    </div>
  );
}