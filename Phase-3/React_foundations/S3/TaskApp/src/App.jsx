import "./App.css";
import { useState } from "react";

function App() {
  return (
    <>
      <TaskApp />
    </>
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
    <div>
      <h1>Task Manager</h1>

      <TaskForm onAddTask={onAddTask} />
      <p>
        {completedCount} of {tasks.length} tasks completed
      </p>
      <div>
        <button onClick={() => setFilter("all")} disabled={filter === "all"}>
          All
        </button>
        <button
          onClick={() => setFilter("active")}
          disabled={filter === "active"}
        >
          Active
        </button>
        <button onClick={() => setFilter("done")} disabled={filter === "done"}>
          Done
        </button>
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
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
        ></input>
        <button type="submit">Add Task</button>
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
    <li>
      <span
        onClick={() => onToggle(task.id)}
        style={{
          textDecoration: task.done ? "line-through" : "none",
          cursor: "pointer",
        }}
      >
        {task.title}
      </span>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </li>
  );
}

export default App;
