export default function TaskAssignmentsCard({ tasks = [] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">
        Task Assignments
      </h2>

      <div className="space-y-3">
        {tasks.length ? (
          tasks.map((task, index) => (
            <div
              key={index}
              className="rounded-lg bg-zinc-800 p-3"
            >
              <div className="font-medium">
                {task.person || task.assignee || "Unassigned"}
              </div>

              <div className="text-sm text-zinc-400">
                {task.task}
              </div>
            </div>
          ))
        ) : (
          <p className="text-zinc-300">
            No task assignments.
          </p>
        )}
      </div>
    </div>
  );
}