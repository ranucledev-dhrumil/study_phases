function TaskStatus({ task, changeStatus }) {
  function handleChange(event) {
    changeStatus(task._id, event.target.value);
  }

  return (
    <select
      value={task.status}
      onChange={handleChange}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    >
      <option value="todo">Todo</option>
      <option value="in-progress">In Progress</option>
      <option value="done">Done</option>
    </select>
  );
}

export default TaskStatus;