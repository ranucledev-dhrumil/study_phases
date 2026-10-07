import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function getTasks() {
    try {
        const resp = await axios.get(BASE_URL);
        const data = resp.data;

        return data;
    }
    catch (err) {
        console.error("Error fetching tasks:", err);
        throw err;
    }
}

async function createTask(taskData) {
    try {
        const resp = await axios.post(BASE_URL, taskData);
        
        const data =  resp.data;

        return data;
    }
    catch (err) {
        console.error("Error creating task:", err);
        throw err;
    }
}

async function updateTaskStatus(taskId, status) {
    try {
        const resp = await axios.put(`${BASE_URL}/${taskId}`, { status: status });

        const data =  resp.data;
        return data;
    }
    catch (err) {
        console.error("Error updating task status:", err);
        throw err;
    }
}

async function deleteTask(taskId) {
    try {
        const resp = await axios.delete(`${BASE_URL}/${taskId}`);
        
        return resp
    }
    catch (err) {
        console.error("Error deleting task:", err); 
        throw err;
    }
}

export { getTasks, createTask, updateTaskStatus, deleteTask }