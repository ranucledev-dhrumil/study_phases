import "./App.css";
import { useState } from "react";
import clsx from "clsx";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <TaskApp />
    </div>
  );
}

function TaskApp() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Learn React", done: false },
    { id: 2, title: "Build TaskApp", done: false },
    { id: 3, title: "Practice useState", done: false },
  ]);

  const [filter, setFilter] = useState("all"); // "all" | "active" | "done"

  const onAddTask = (task) => {
    setTasks((currentTasks) => [...currentTasks, task]);
  };

  const onToggle = (id) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  };

  const onDelete = (id) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
  };

  const completedCount = tasks.filter((task) => task.done).length;

  // derived list — computed fresh every render, never stored in state
  const visibleTasks = tasks.filter((task) => {
    if (filter === "active") return !task.done;
    if (filter === "done") return task.done;
    return true; // "all"
  });

  return (
    <div className="w-full max-w-md md:max-w-lg mx-auto rounded-xl bg-white p-6 shadow-lg">
      <h1 className=" mb-6 text-2xl font-bold text-gray-900">Task Manager</h1>

      <TaskForm onAddTask={onAddTask} />
      <p className="my-4 text-sm text-gray-600">
        {completedCount} of {tasks.length} tasks completed
      </p>
      <div className="flex justify-between items-center rounded-md">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All
        </FilterButton>
        <FilterButton
          active={filter === "active"}
          onClick={() => setFilter("active")}
        >
          Active
        </FilterButton>
        <FilterButton
          active={filter === "done"}
          onClick={() => setFilter("done")}
        >
          Done
        </FilterButton>
      </div>
      <TaskList tasks={visibleTasks} onToggle={onToggle} onDelete={onDelete} />
    </div>
  );
}

function TaskForm({ onAddTask }) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const task = { id: Date.now(), title: title.trim(), done: false };
    onAddTask(task);
    setTitle("");
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          className="rounded-md border border-grey px-3 py-2 focus:border-blue-500 flex-1  outline-none"
        ></input>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Add Task
        </button>
      </form>
    </>
  );
}

function TaskList({ tasks, onToggle, onDelete }) {
  return (
    <ul>
      {tasks.map((taskItem) => (
        <TaskItem
          key={taskItem.id}
          task={taskItem}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li className="flex justify-between items-center rounded-md bg-gray-50 p-3">
      <span
        onClick={() => onToggle(task.id)}
        // style={{
        //   textDecoration: task.done ? "line-through" : "none",
        //   cursor: "pointer",
        // }}
        className={clsx(
          "p-2 rounded flex justify-between items-center hover:bg-gray-50",
          task.done && "bg-green-100 text-gray-400 line-through",
        )}
      >
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="p-2 bg-red-500 rounded-md hover:bg-red-600"
      >
        Delete
      </button>
    </li>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={active}
      className={clsx(
        "px-4 py-2 rounded-md",
        active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700",
      )}
    >
      {children}
    </button>
  );
}
export default App;
