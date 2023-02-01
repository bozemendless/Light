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
    const password = document.getElementById("password").value;

    registerInfo.email = email;
    registerInfo.password = password;

    return

}


function isRegisterAvailable() {

    if (registerInfo.email !== "" && registerInfo !== "") {
        return true;
    } else {
        const emailInputMessage = document.querySelector(".email .input-message");
        const passwordInputMessage = document.querySelector(".password .input-message");
        emailInputMessage.textContent = "請輸入電子郵件";
        passwordInputMessage.textContent = "請輸入密碼";
        emailInputMessage.classList.add("error-message");
        passwordInputMessage.classList.add("error-message");
        return false;
    }

}


function registerFetch(info) {
        const token = document.getElementsByName("csrfmiddlewaretoken")[0].value;
        const loginUrl = "/api/login";

        const options = {
            method: "PUT",
            headers: {
                "X-CSRFToken": token,
                "content-type": "application/json"
            },
            body: JSON.stringify(info)
        }

        fetch (loginUrl, options)
        .then(res => {return res.json();})
        .then(data => {
            registerResult(data);
        })

    }


function registerResult(data) {
    console.log(data);
}