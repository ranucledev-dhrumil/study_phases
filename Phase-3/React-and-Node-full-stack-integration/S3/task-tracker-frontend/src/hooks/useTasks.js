import { useEffect, useState } from "react"
import { getTasks, createTask, updateTaskStatus, deleteTask } from '../api/tasksApiFetch'

function useTasks() {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError("")
            try {
                const fetchedTasks = await getTasks();
                setTasks(fetchedTasks)
            }
            catch (err) { setError(err) }

            finally { setLoading(false) }
        }

        fetchData();
    }, [])

    const addTask = async (taskData) => {
        setError("")
        setLoading(true)
        try {
            const newTask = await createTask(taskData);
            setTasks((prev) => [...prev, newTask])
        }
        catch (err) { setError(err) }
        finally { setLoading(false) }
    }

    const changeStatus = async (taskId, status) => {
        setError("")
        setLoading(true)
        try {
            const updatedTask = await updateTaskStatus(taskId, status);
            setTasks((prev) =>
                prev.map(t => t._id === updatedTask._id ? updatedTask : t)
            )
        }
        catch (err) { setError(err) }
        finally { setLoading(false) }
    }

    const removeTask = async (taskId) => {
        setError("")
        setLoading(true)
        try {
            await deleteTask(taskId);
            setTasks((prev) => prev.filter(t => t._id !== taskId))
        }
        catch (err) { setError(err) }
        finally { setLoading(false) }
    }

    return { tasks, loading, error, addTask, changeStatus, removeTask }
}

export default useTasks;