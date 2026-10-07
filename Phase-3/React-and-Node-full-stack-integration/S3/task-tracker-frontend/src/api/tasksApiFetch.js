const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function getTasks() {
    try {
        const resp = await fetch(BASE_URL);
        if (!resp.ok) {
            throw new Error(`Failed to fetch tasks: ${resp.status}`);
        }
        const data = await resp.json();

        return data;
    }
    catch (err) {
        console.error("Error fetching tasks:", err);
        throw err;
    }
}

async function createTask(taskData) {
    try {
        const resp = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData),
        });
        if (!resp.ok) {
            throw new Error(`Failed to create task: ${resp.status}`);
        }
        const data = await resp.json();

        return data;
    }
    catch (err) {
        console.error("Error creating task:", err);
        throw err;
    }
}

async function updateTaskStatus(taskId, status) {
    try {
        const resp = await fetch(`${BASE_URL}/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status }),
        });
        if (!resp.ok) {
            throw new Error(`Failed to update task status: ${resp.status}`);
        }
        const data = await resp.json();
        return data;
    }
    catch (err) {
        console.error("Error updating task status:", err);
        throw err;
    }
}

async function deleteTask(taskId) {
    try {
        const resp = await fetch(`${BASE_URL}/${taskId}`, { method: 'DELETE' });
        if (!resp.ok) {
            throw new Error(`Failed to delete task: ${resp.status}`);
        }
        return true
    }
    catch (err) {
        console.error("Error deleting task:", err); 
        throw err;
    }
}

export { getTasks, createTask, updateTaskStatus, deleteTask }