export default function TaskAssignmentsCard({
  tasks = [],
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-slate-900">
        Task Assignments
      </h2>

      {tasks.length ? (
        <div className="divide-y divide-slate-100">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-6"
            >
              <div className="sm:w-40 sm:shrink-0">
                <span className="text-sm font-medium text-slate-900">
                  {task.person ||
                    task.assignee ||
                    "Unassigned"}
                </span>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                {task.task}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No task assignments.
        </p>
      )}
    </div>
  );
}