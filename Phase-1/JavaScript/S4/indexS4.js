const id = document.querySelector("#my-id")
id.textContent = "my-id id"

// const class1 = document.querySelector(".my-class")
// class1.style.backgroundColor = "black"
// class1.style.color = "white"


// const classall = document.querySelectorAll(".my-class")
// classall.forEach(el => {
//     el.style.backgroundColor = "black"
//     el.style.color = "white"
// })

// const cardp = document.querySelector(".card p");
// cardp.style.color="yellow"

// const items = document.querySelectorAll(".item")
// items.forEach(element => {
//     element.style.color="yellow"
// });

// const textChngBtn = document.querySelector("#changeTextBtn")
// const content = document.querySelector(".content")

// textChngBtn.addEventListener("click", () => {
//     content.textContent = "new Content added"
// })

// const styleBtn = document.querySelector("#styleBtn");
// const toggleClassBtn = document.querySelector("#toggleClassBtn");
// const styleBox = document.querySelector(".style-box");

// // Inline styles
// styleBtn.addEventListener("click", () => {
//     styleBox.style.backgroundColor = "indigo";
//     styleBox.style.color = "white";
//     styleBox.style.fontSize = "22px";
//     styleBox.style.padding = "20px";
//     styleBox.textContent = "Styled with .style!";
// });

// // Toggle CSS class
// toggleClassBtn.addEventListener("click", () => {
//     styleBox.classList.toggle("active");
// });



// const image = document.querySelector("#myImage");
// const input = document.querySelector("#nameInput");
// const checkbox = document.querySelector("#agreeCheckbox");

// console.log(image.getAttribute("src"));
// console.log(input.value);       // empty until user types
// console.log(checkbox.checked);  // false initially

// input.addEventListener("input", () => {
//     console.log("Input:", input.value);
// });

// checkbox.addEventListener("change", () => {
//     console.log("Checked:", checkbox.checked);
// });

const container = document.querySelector("#container")
const addbtn = document.querySelector("#addBoxBtn")
const removebtn = document.querySelector("#removeLastBtn")

let count=0
addbtn.addEventListener("click", () => {
    count++

    const newDiv = document.createElement("div");
    newDiv.classList.add("box")
    newDiv.textContent = `New Box: ${count}`

    container.append(newDiv)
})

removebtn.addEventListener("click", () => {
    const lastBox = container.lastChild
    if (lastBox) {
        lastBox.remove();
    }
})


const clickBtn = document.querySelector("#clickBtn");
const hoverBtn = document.querySelector("#hoverBtn");
const output = document.querySelector("#output");

clickBtn.addEventListener("click", (event) => {
    output.textContent = `You clicked: ${event.target.textContent}`;
    console.log(event.target);
    console.log(event.type);
});

hoverBtn.addEventListener("mouseover", (event) => {
    output.textContent = `Mouse is over: ${event.target.textContent}`;
});

hoverBtn.addEventListener("mouseout", () => {
    output.textContent = "Mouse left the button.";
});