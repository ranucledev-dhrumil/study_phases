import TaskStatus from "./TaskStatus.jsx";

function TaskItem({ task, changeStatus, removeTask }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-md transition hover:shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {task.title}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-600">
              Priority:{" "}
              <span className="font-medium capitalize">
                {task.priority}
              </span>
            </span>

            <span className="text-gray-600">
              Status:{" "}
              <span className="font-medium capitalize">
                {task.status}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TaskStatus
            task={task}
            changeStatus={changeStatus}
          />

          <button
            type="button"
            onClick={() => removeTask(task._id)}
            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskItem;