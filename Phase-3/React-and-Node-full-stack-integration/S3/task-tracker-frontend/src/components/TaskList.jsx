import TaskItem from "./TaskItem.jsx";

function TaskList({ tasks, changeStatus, removeTask }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-md">
        <p className="text-gray-500">No tasks yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task._id}
          task={task}
          changeStatus={changeStatus}
          removeTask={removeTask}
        />
      ))}
    </div>
  );
}

export default TaskList;