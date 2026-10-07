// Part 2:

// function renderTasks() {
//     const taskList = document.querySelector("#taskList");
//     taskList.textContent = "";

//     tasks.forEach((task) => {
//         const li = document.createElement("li")
//         const delBtn = document.createElement("button")

//         delBtn.textContent = "Delete";
//         delBtn.classList.add("delete-btn");
//         li.textContent = task.text
//         li.append(delBtn)
//         delBtn.addEventListener("click", () => {
//             event.stopPropagation();
//             deleteTask(task.id)
//             renderTasks();
//         })

//         li.addEventListener("click", () => {
//             toggleTask(task.id)
//             renderTasks();
//         })

//         if (task.completed === true) {
//             li.classList.add("done")
//         }

//         taskList.append(li)
//     })
// }

// Part: 3
// document.querySelector("#filterButtons").addEventListener("click", (event) => {
//     // event.target is whichever button was clicked
//     // event.target.dataset.filter gives you "all" / "active" / "completed"

//     if (event.target.dataset.filter == "active") {
//         tasks.forEach((task) => {
//             if (task.completed === false) {
//                 const li = document.createElement("li");
//                 const delBtn = document.createElement("button");

//                 delBtn.textContent = "Delete";
//                 delBtn.classList.add("delete-btn");
//                 li.textContent = task.text;
//                 li.append(delBtn);

//                 // give the <li> a way to know which task it belongs to
//                 li.dataset.id = task.id;

//                 taskList.append(li);
//                 // no listeners attached here at all anymore}
//             }
//         });
//     }


//     if (event.target.dataset.filter == "completed") {
//         tasks.forEach((task) => {
//             if (task.completed === true) {
//                 const li = document.createElement("li");
//                 const delBtn = document.createElement("button");

//                 delBtn.textContent = "Delete";
//                 delBtn.classList.add("delete-btn");
//                 li.textContent = task.text;
//                 li.append(delBtn);

//                 // give the <li> a way to know which task it belongs to
//                 li.dataset.id = task.id;

//                 taskList.append(li);
//                 // no listeners attached here at all anymore}
//             }
//         });
//     }


//     if (event.target.dataset.filter == "all") {
//         renderTasks()
//     }

//     if (!event.target.dataset.filter) return;
// });
