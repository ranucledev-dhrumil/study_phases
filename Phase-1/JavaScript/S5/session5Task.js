const form = document.querySelector("#signupForm")
const usernameError = document.querySelector("#usernameError")
const emailError = document.querySelector("#emailError")
const passwordError = document.querySelector("#passwordError")
const SuccessMessage = document.querySelector("#successMsg")
const username = document.querySelector("#username")
const email = document.querySelector("#email")
const password = document.querySelector("#password")



form.addEventListener("submit", (event) => {
    event.preventDefault();
    let isValid = true;
    let usernameVal = username.value;
    let emailVal = email.value;
    let passwordVal = password.value;

    usernameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";
    SuccessMessage.textContent = "";

    if (usernameVal.length < 3) {
        console.log("Username should be greater than 3 letters")
        usernameError.textContent = "Username should be greater than 3 letters"
        isValid = false
    }

    if (!emailVal.includes("@") || !emailVal.includes(".")) {
        console.log("Enter valid Email with @")
        emailError.textContent = "Enter valid Email"
        isValid = false
    }

    if (passwordVal.length < 6) {
        console.log("Password length should be more than 6")
        passwordError.textContent = "Password length should be more than 6"
        isValid = false
    }

    if (isValid) {
        SuccessMessage.textContent = "Validation Passed"
    }
})

password.addEventListener("input", () => {
    const len = password.value.length;
    if (len <= 6) {
        passwordError.textContent = `${len}/6 characters`
    }
    if (len == 6) {
        passwordError.textContent = ""
    }
})

username.addEventListener("keydown", (event) => {
    if (event.key == "Enter") {
        event.preventDefault()
        email.focus()
    }
})