const submit = document.getElementById("submit");
const emailInput = document.getElementById("email");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
let email;
let username;
let password;
const emailInputMessage = document.querySelector(".email .input-message");
const usernameInputMessage = document.querySelector(".username .input-message");
const passwordInputMessage = document.querySelector(".password .input-message");


submit.addEventListener("click", event => {
    event.preventDefault();

    email = emailInput.value;
    username = usernameInput.value;
    password = passwordInput.value;

    if (checkTheField()) {
        const infos = getInfos();
        registerFetch(infos);
    }
});

// check if the fields are valid
// if valid return true
// if invalid, show the warning message, return false
function checkTheField() {
    const emailRegex = /^(?=.{8,64}$)\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
    const usernameRegex = /^[A-Za-z0-9]{2,32}$/;
    const passwordRegex = /^.{6,72}$/;
    let isEmailValid;
    let isUsernameValid;
    let isPasswordValid;
    let isValid = false;

    // email
    if (email === "") {
        emailInputMessage.textContent = "請輸入電子信箱。";
        emailInputMessage.classList.add("error-message");
    } else if (!emailRegex.test(email)) {
        emailInputMessage.textContent = "請輸入正確格式的電子信箱。";
        emailInputMessage.classList.add("error-message");
    } else {
        emailInputMessage.textContent = "";
        isEmailValid = true;
    }

    // username
    if (username === "") {
        usernameInputMessage.textContent = "請輸入使用者名稱。";
        usernameInputMessage.classList.add("error-message");
    } else if (!usernameRegex.test(username)) {
        usernameInputMessage.textContent = "長度必須在 2 和 32 之間。"
        usernameInputMessage.classList.add("error-message");
    } else {
        usernameInputMessage.textContent = "";
        isUsernameValid = true;
    }

    // password
    if (password === "") {
        passwordInputMessage.textContent = "請輸入密碼。";
        passwordInputMessage.classList.add("error-message");
    } else if (!passwordRegex.test(password)) {
        passwordInputMessage.textContent = "密碼必須在 6 和 72 之間。"
        passwordInputMessage.classList.add("error-message");
    } else {
        passwordInputMessage.textContent = "";
        isPasswordValid = true;
    }

    // is all fields valid
    if (isEmailValid && isUsernameValid && isPasswordValid) {
        isValid = true;
    }

    return isValid
}

// get register infos
function getInfos() {
    const infos = JSON.stringify({
        "email": email,
        "username": username,
        "password": password
    })
    return infos
}

// send register info
async function registerFetch(info) {
    const token = document.getElementsByName("csrfmiddlewaretoken")[0].value;
    const registerUrl = "/api/register";

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token
        },
        body: info
    }

    try {
        const response = await fetch (registerUrl, options);
        const data = await response.json();
        registerResult(data);
    } catch (error) {
        console.log(error);
    }
}


function registerResult(data) {
    let message;
    if (data.ok) {
        message = "註冊成功，請登入會員帳號！"
        alert(message);
        location.href = "/login"
    }
    if (data.message === "email already exists") {
        emailInputMessage.textContent = "電子信箱已被使用。";
        emailInputMessage.classList.add("error-message");
    }
    if (data.message === "username already exists") {
        usernameInputMessage.textContent = "使用者名稱已被使用。";
        usernameInputMessage.classList.add("error-message");
    }
    if (data.message === "email and username already exist") {
        emailInputMessage.textContent = "電子信箱已重複。";
        emailInputMessage.classList.add("error-message");
        usernameInputMessage.textContent = "使用者名稱已被使用。";
        usernameInputMessage.classList.add("error-message");
    }
}