console.log("script loaded");
//Part-1:
// Array to hold task objects. Each task should have: id, text, completed (boolean).
let tasks = [];
// Example task shape: { id: 1, text: 'Sample task', completed: false }
let currentFilter = "all";   // declare this once, outside any function, near your other top-level variables
document.querySelector('[data-filter="all"]').classList.add("active-filter");
const saved = localStorage.getItem("tasks");
if (saved) {
    tasks = JSON.parse(saved);
    renderTasks()
}

let theme = localStorage.getItem("theme");
const themeToggleBtn = document.querySelector("#themeToggleBtn")
if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark")
    themeToggleBtn.textContent = "Light Mode"
} else {
    document.documentElement.removeAttribute("data-theme")
    themeToggleBtn.text = "Dark Mode"
}

function addTask(text) {
    const task = {
        id: Date.now(),
        text: text,
        completed: false
    }
    tasks.push(task)
}

function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
}

function showDeleteModal(id) {
    const overlay = document.createElement("div");
    overlay.classList.add("modal-overlay");

    const box = document.createElement("div");
    box.classList.add("modal-box");

    const message = document.createElement("p");
    const task = tasks.find(t => t.id === id);
    message.textContent = `Delete "${task.text}"?`;

    const actions = document.createElement("div");
    actions.classList.add("modal-actions");

    const cancelBtn = document.createElement("button");
    cancelBtn.classList.add("modal-cancel");
    cancelBtn.textContent = "Cancel";

    const confirmBtn = document.createElement("button");
    confirmBtn.classList.add("modal-confirm");
    confirmBtn.textContent = "Delete";

    actions.append(confirmBtn)
    actions.append(cancelBtn)

    box.append(message)
    box.append(actions)

    overlay.append(box)

    document.body.append(overlay)
    cancelBtn.focus();

    cancelBtn.addEventListener("click", () => {
        overlay.remove()
    })

    confirmBtn.addEventListener("click", () => {
        deleteTask(id)
        renderTasks()
        overlay.remove()
    })

    overlay.addEventListener("keydown", (event) => {
        console.log("key pressed:", event.key);
        if (event.key === "Escape") {
            overlay.remove()
        }
    });
}

function toggleTask(id) {
    tasks.forEach((task) => {
        if (task.id === id) {
            task.completed = !task.completed;
        }
    })
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    const li = document.querySelector(`li[data-id="${id}"]`);

    li.textContent = ""

    const input = document.createElement("input");
    input.type = "text";
    // TODO 2: set input.value to the task's current text
    input.value = task.text

    li.append(input);
    // TODO 3: focus the input so the user can start typing immediately
    input.focus()

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            input.blur();   // triggers the blur listener below, which does the actual save
        }
    });

    input.addEventListener("blur", () => {
        let val = input.value.trim();
        if (val.length > 0) {
            task.text = val;
        }
        renderTasks();
    });
}


document.querySelector("#taskList").addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
        const li = event.target.closest("li")
        const id = Number(li.dataset.id)
        showDeleteModal(id)
        return
    }

    if (event.target.classList.contains("tick-btn")) {
        const li = event.target.closest("li")
        const id = Number(li.dataset.id)
        toggleTask(id)

        renderTasks()
        return
    }

    if (event.target.classList.contains("edit-btn")) {
        const li = event.target.closest("li")
        const id = Number(li.dataset.id)
        editTask(id)
        return
    }
})



function renderTasks() {

    const taskList = document.querySelector("#taskList");
    const taskCount = document.querySelector("#taskCount")
    let count = tasks.filter(task => !task.completed).length;
    localStorage.setItem("tasks", JSON.stringify(tasks));   // turns the array into a JSON string


    taskList.textContent = "";
    taskCount.textContent = `${count} tasks left`
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.documentElement.style.setProperty('--progress', `${percent}%`);

    let visibleTasks;
    if (currentFilter === "active") {
        visibleTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === "completed") {
        visibleTasks = tasks.filter(task => task.completed);
    } else {
        visibleTasks = tasks; // "all"
    }

    visibleTasks.forEach((task) => {
        const li = document.createElement("li");
        li.dataset.id = task.id;

        const span = document.createElement("span");
        span.classList.add("task-text");
        span.textContent = task.text;

        const actions = document.createElement("div");
        actions.classList.add("task-actions");

        const tickBtn = document.createElement("button");
        tickBtn.classList.add("tick-btn");
        tickBtn.textContent = task.completed ? "Undo" : "Done";

        const editBtn = document.createElement("button");
        editBtn.classList.add("edit-btn");
        editBtn.textContent = "Edit";

        const delBtn = document.createElement("button");
        delBtn.classList.add("delete-btn");
        delBtn.textContent = "Delete";

        actions.append(tickBtn, editBtn, delBtn);
        li.append(span, actions);

        if (task.completed) li.classList.add("done");

        taskList.append(li);
    });
}


const submitBtn = document.querySelector("#taskForm")
submitBtn.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#taskInput")
    const taskError = document.querySelector("#taskError")
    let inputValue = input.value;

    if (inputValue.trim().length === 0) {
        taskError.textContent = "Enter Something"
        return
    }

    addTask(inputValue);
    renderTasks()
    input.value = "";
    taskError.textContent = ""
})



document.querySelector("#filterButtons").addEventListener("click", (event) => {
    if (!event.target.dataset.filter) return;
    currentFilter = event.target.dataset.filter;

    document.querySelectorAll("#filterButtons button").forEach(btn => {
        btn.classList.remove("active-filter");
    });
    event.target.classList.add("active-filter");

    renderTasks();
});


const deleteCompleted = document.querySelector("#deleteCompleted")
deleteCompleted.addEventListener("click", () => {
    tasks.forEach((task) => {
        if (task.completed === true) {
            deleteTask(task.id)
        }
    })
    renderTasks()
})


themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");

    if (current === "dark") {
        document.documentElement.removeAttribute("data-theme")
        themeToggleBtn.textContent = "Dark Mode"
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.setAttribute("data-theme", "dark")
        themeToggleBtn.text = "Light Mode"
        localStorage.setItem("theme", "dark");
    }
})