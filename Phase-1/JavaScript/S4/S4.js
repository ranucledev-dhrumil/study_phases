document.querySelector(".my-class");     // first match, CSS selector syntax
document.querySelector("#my-id");        // class
document.querySelector("div.card p");    // any valid CSS selector works
document.querySelectorAll(".item");      // ALL matches — returns a NodeList

document.querySelectorAll(".item").forEach(el => {
    console.log(el.textContent);
});

// Older/alternative selectors you'll still see in the wild:
document.getElementById("my-id");         // single element, no "#"
document.getElementsByClassName("item");  // live HTMLCollection
document.getElementsByTagName("li");      // live HTMLCollection

// 2. Changing Content
const el = document.querySelector(".title");

el.textContent = "New Text";     // sets plain text (safe, escapes HTML)
el.innerHTML = "<b>Bold</b>";    // sets HTML — can inject actual tags

// 3. Changing Styles
el.style.color = "red";
el.style.backgroundColor = "black";   // camelCase for hyphenated CSS props
el.style.display = "none";            // hide
el.style.display = "block";           // show

// Better for toggling predefined styles — use classes instead of inline styles:
el.classList.add("active");
el.classList.remove("active");
el.classList.toggle("active");       // adds if absent, removes if present
el.classList.contains("active");     // true/false
// General rule: prefer classList + CSS classes for style changes over directly setting .style.x — keeps styling in your CSS file, JS just toggles state.

// 4. Changing Attributes
el.setAttribute("src", "image.png");
el.getAttribute("src");
el.removeAttribute("disabled");

// common ones also have direct properties:
// inputEl.value;         // for <input>, <textarea>
// imgEl.src;
// linkEl.href;
// checkboxEl.checked;

// 5. Creating and Adding Elements
const newDiv = document.createElement("div");
newDiv.textContent = "I'm new here";
newDiv.classList.add("box");

document.body.appendChild(newDiv);        // add to end
// parentEl.insertBefore(newDiv, referenceEl); // add before a specific element
// newDiv.remove();                           // remove from DOM

// 6. addEventListener — the basics
const btn = document.querySelector("button");

btn.addEventListener("click", function() {
  console.log("Clicked!");
});

// arrow function version (common)
btn.addEventListener("click", () => {
  console.log("Clicked!");
});


// The callback receives an event object with useful info:
btn.addEventListener("click", (event) => {
  console.log(event.target);       // the actual element clicked
  console.log(event.type);         // "click"
});

// You can attach multiple listeners to the same element for the same event — they all run.
// removeEventListener needs a named function reference (not an anonymous one) to remove it later:
function handleClick() { console.log("hi"); }
btn.addEventListener("click", handleClick);
btn.removeEventListener("click", handleClick);