import "./App.css";
import useTasks from "./hooks/useTasks";
import TaskList from "./components/TaskList.jsx";
import TaskForm from "./components/TaskForm.jsx";
import Loading from "./components/Loading.jsx";
import ErrorMessage from "./components/ErrorMessage.jsx";

function App() {
  const {
    tasks,
    loading,
    error,
    addTask,
    changeStatus,
    removeTask,
  } = useTasks();

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
          Task Tracker
        </h1>

        <TaskForm addTask={addTask} />

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : (
          <TaskList
            tasks={tasks}
            changeStatus={changeStatus}
            removeTask={removeTask}
          />
        )}
      </div>
    </main>
  );
}

export default App;