const submit = document.getElementById("submit");
const registerInfo = {};

submit.addEventListener("click", event => {
    event.preventDefault();

    getRegisterInfo(); // Update values in loginInfo

    if (isRegisterAvailable()) {
        registerFetch(registerInfo);
    }

});


function getRegisterInfo() {

    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    registerInfo.email = email;
    registerInfo.username = username;
    registerInfo.password = password;

    return

}


function isRegisterAvailable() {

    if (registerInfo.email !== "" && registerInfo.username !== "" && registerInfo.password) {
        return true;
    } else {
        const emailInputMessage = document.querySelector(".email .input-message");
        const usernameInputMessage = document.querySelector(".username .input-message");
        const passwordInputMessage = document.querySelector(".password .input-message");
        emailInputMessage.textContent = "請輸入電子郵件";
        usernameInputMessage.textContent = "請輸入使用者名稱";
        passwordInputMessage.textContent = "請輸入密碼";
        emailInputMessage.classList.add("error-message");
        usernameInputMessage.classList.add("error-message");
        passwordInputMessage.classList.add("error-message");
        return false;
    }

}


function registerFetch(info) {
        const token = document.getElementsByName("csrfmiddlewaretoken")[0].value;
        const registerUrl = "/api/register";

        const options = {
            method: "POST",
            headers: {
                "X-CSRFToken": token,
                "content-type": "application/json"
            },
            body: JSON.stringify(info)
        }

        fetch (registerUrl, options)
        .then(res => {return res.json();})
        .then(data => {
            registerResult(data);
        })

    }


function registerResult(data) {
    console.log(data);
}