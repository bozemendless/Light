const submit = document.getElementById("submit");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
let email;
let password;
const emailInputMessage = document.querySelector(".email .input-message");
const passwordInputMessage = document.querySelector(".password .input-message");

submit.addEventListener("click", (event) => {
    event.preventDefault();

    email = emailInput.value;
    password = passwordInput.value;

    if (checkTheField()) {
        const infos = getInfos();
        loginFetch(infos);
    }
});

// check if the fields are valid
// if valid return true
// if invalid, show the warning message, return false
function checkTheField() {
    const emailRegex =
        /^(?=.{8,64}$)\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
    const passwordRegex = /^.{6,72}$/;
    let isEmailValid;
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

    // password
    if (password === "") {
        passwordInputMessage.textContent = "請輸入密碼。";
        passwordInputMessage.classList.add("error-message");
    } else if (!passwordRegex.test(password)) {
        passwordInputMessage.textContent = "密碼必須在 6 和 72 之間。";
        passwordInputMessage.classList.add("error-message");
    } else {
        passwordInputMessage.textContent = "";
        isPasswordValid = true;
    }

    // is all fields valid
    if (isEmailValid && isPasswordValid) {
        isValid = true;
    }

    return isValid;
}

// get login infos
function getInfos() {
    const infos = JSON.stringify({
        email: email,
        password: password,
    });
    return infos;
}

async function loginFetch(info) {
    const token = document.getElementsByName("csrfmiddlewaretoken")[0].value;
    const loginUrl = "/api/user/auth";

    const options = {
        method: "PUT",
        headers: {
            "X-CSRFToken": token,
            "content-type": "application/json",
        },
        body: info,
    };

    try {
        const response = await fetch(loginUrl, options);
        const data = await response.json();
        loginResult(data);
    } catch (error) {
        console.log(error);
    }
}

function loginResult(data) {
    if (data.ok) {
        location.href = "/";
    }
    if (data.message === "Email does NOT exist") {
        alert("電子郵件不存在！");
    }
    if (data.message === "Password is invalid") {
        alert("密碼錯誤！");
    }
    location.reload();
}
