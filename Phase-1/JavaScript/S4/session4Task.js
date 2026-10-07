const changeTitleBtn = document.querySelector("#changeBtn")
const title = document.querySelector("#title")

changeTitleBtn.addEventListener("click", () => {
    title.textContent = "Title Changed"
})

const toggleBtn = document.querySelector("#toggleBtn")
toggleBtn.addEventListener("click", () => {
    title.classList.toggle("highlight")
})

const list = document.querySelectorAll("#list li")
list.forEach(el => {
    console.log(el.textContent)
    el.addEventListener("click", () => {
        el.classList.toggle("highlight")
    })
})


const listul = document.querySelector("#list")
const addItem = document.querySelector("#addItemBtn")
let count = 3;
addItem.addEventListener("click", () => {
    const listItem = document.createElement("li");
    listItem.textContent = `Item ${++count}`
    listItem.addEventListener("click", () => {
        listItem.classList.toggle("highlight")
    })
    listul.append(listItem)
})

{   
    // Better Version:
    // const list_ul = document.querySelector("#list")
    // list_ul.addEventListener("click", (event) => {
    //   if (event.target.tagName === "LI") {
    //     event.target.classList.toggle("highlight");
    //   }
    // });
    // const listul = document.querySelector("#list")
    // const addItem = document.querySelector("#addItemBtn")
    // let count = 3;
    // addItem.addEventListener("click", () => {
    //     const listItem = document.createElement("li");
    //     listItem.textContent = `Item ${++count}`
    //     listul.append(listItem)
    // })
}

document.addEventListener("click", (event) => {
    console.log(event.target.tagName)
})