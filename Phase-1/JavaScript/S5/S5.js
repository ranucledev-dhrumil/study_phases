// Mouse
el.addEventListener("click", handler);
el.addEventListener("dblclick", handler);
el.addEventListener("mouseenter", handler);
el.addEventListener("mouseleave", handler);

// Keyboard
el.addEventListener("keydown", handler);
el.addEventListener("keyup", handler);

// Form / Input
input.addEventListener("input", handler);   // fires on every keystroke/change
input.addEventListener("change", handler);  // fires when value is committed (e.g. blur, or dropdown selection)
form.addEventListener("submit", handler);

// Focus
input.addEventListener("focus", handler);
input.addEventListener("blur", handler);    // fires when element loses focus

// Window/Document
window.addEventListener("load", handler);
document.addEventListener("DOMContentLoaded", handler); // fires when HTML is parsed, before images/etc finish loading

// 2. The Event Object (reminder + more detail)
el.addEventListener("keydown", (event) => {
  console.log(event.key);        // e.g. "Enter", "a", "Shift"
  console.log(event.target);      // the element the event fired on
  console.log(event.type);        // "keydown"
});

// 3. event.preventDefault()

// Stops the browser's default behavior for that event. Most commonly used with forms, to stop the page from reloading on submit:
form.addEventListener("submit", (event) => {
  event.preventDefault();
  console.log("Form submitted, but page didn't reload");
});
// Without preventDefault(), submitting a form causes a full page reload/navigation by default — which usually isn't what you want when handling it with JS.

// 4. Basic Form Validation Pattern
{/* <form id="signupForm">
  <input type="text" id="username" />
  <span id="usernameError" class="error"></span>

  <input type="email" id="email" />
  <span id="emailError" class="error"></span>

  <button type="submit">Sign Up</button>
</form> */}

const form = document.querySelector("#signupForm");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = document.querySelector("#username").value.trim();
  const email = document.querySelector("#email").value.trim();

  let isValid = true;

  // clear old errors
  document.querySelector("#usernameError").textContent = "";
  document.querySelector("#emailError").textContent = "";

  if (username.length < 3) {
    document.querySelector("#usernameError").textContent = "Username must be at least 3 characters";
    isValid = false;
  }

  if (!email.includes("@")) {
    document.querySelector("#emailError").textContent = "Enter a valid email";
    isValid = false;
  }

  if (isValid) {
    console.log("Form is valid, submitting:", { username, email });
    // form.submit() or send via fetch, etc.
  }
});


// 5. Built-in HTML5 Validation (bonus, worth knowing)
// <input type="email" required minlength="3" />
input.checkValidity();     // true/false based on HTML constraints
input.validity.valid;      // same info, more detail available (validity.tooShort, etc.) 
// JS validation is often layered on top of these built-in HTML constraints, not a full replacement for them.