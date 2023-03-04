const main = document.querySelector("main");
const settingBtn = document.querySelector(".setting-button");
const settingPage = document.querySelector(".setting-page");
const exitBtn = document.querySelector(".exit");
const authUrl = "/api/user/auth";
const avatarUrl = "/api/user/avatar";
const aboutMeUrl = "/api/user/about_me";
const getMemberDataUrl = "/api/server/members";
const token = document.getElementsByName("csrfmiddlewaretoken")[0].value;
const editLayerHTML = `<div class="edit-layer" id="edit-layer"></div>`;
const editUsernameHTML = `<div class="editor username-editor" id="username-editor">
<div class="editor-title-wrapper">
    <div class="editor-title">變更使用者名稱</div>
    <div class="editor-slogan">輸入新的使用者名稱與現存的密碼。</div>
    <div class="editor-close pointer" id="editor-close">
        <svg class="closeIcon" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
        </svg>
    </div>
</div>
<div class="editor-content-wrapper">
    <div class="editor-username-wrapper">
        <div class="editor-username-title">
            使用者名稱
            <span class="error-separator"> - </span>
            <span class="input-error-message" id="username-message"></span>
        </div>
        <div class="editor-username-div">
            <input class="editor-username-input" id="username-input" autocomplete="new-text" />
        </div>
    </div>
    <div class="editor-password-wrapper">
        <div class="editor-password-title">
            目前密碼
            <span class="error-separator"> - </span>
            <span class="input-error-message" id="password-message"></span>
        </div>
        <div class="editor-password-div">
            <input type="password" class="editor-password-input" id="password-input" onMouseDown="this.removeAttribute('readonly')" />
        </div>
    </div>
</div>
<div class="editor-confirm-wrapper">
    <div class="editor-cancer-div pointer" id="cancer">
        <div class="editor-cancer-button">取消</div>
    </div>
    <div class="editor-confirm-div pointer" id="username-edit-button">
        <div class="editor-confirm-button">完成</div>
    </div>
</div>
</div>`;
const editEmailHTML = `<div class="editor email-editor" id="email-editor">
<div class="editor-title-wrapper">
    <div class="editor-title">變更電子郵件</div>
    <div class="editor-slogan">輸入新的電子郵件與現存的密碼。</div>
    <div class="editor-close pointer" id="editor-close">
        <svg class="closeIcon" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
        </svg>
    </div>
</div>
<div class="editor-content-wrapper">
    <div class="editor-email-wrapper">
        <div class="editor-email-title">
            電子郵件
            <span class="error-separator"> - </span>
            <span class="input-error-message" id="email-message"></span>
        </div>
        <div class="editor-email-div">
            <input class="editor-email-input" id="email-input" autocomplete="new-text" />
        </div>
    </div>
    <div class="editor-password-wrapper">
        <div class="editor-password-title">
            目前密碼
            <span class="error-separator"> - </span>
            <span class="input-error-message" id="password-message"></span>
        </div>
        <div class="editor-password-div">
            <input type="password" class="editor-password-input" id="password-input" onMouseDown="this.removeAttribute('readonly')" />
        </div>
    </div>
</div>
<div class="editor-confirm-wrapper">
    <div class="editor-cancer-div pointer" id="cancer">
        <div class="editor-cancer-button">取消</div>
    </div>
    <div class="editor-confirm-div pointer" id="email-edit-button">
        <div class="editor-confirm-button">完成</div>
    </div>
</div>
</div>`;
const editUsernameBtn = document.querySelector("#edit-username-button");
const editEmailBtn = document.querySelector("#edit-email-button");
settingBtn.addEventListener("click", () => {
    settingPage.style.display = "flex";
    function closeSettingPage(event) {
        if (event.key === "Escape") {
            settingPage.style.display = "none";
            document.body.removeEventListener("keydown", closeSettingPage);
        }
    }
    document.body.addEventListener("keydown", closeSettingPage);
});

exitBtn.addEventListener("click", () => {
    settingPage.style.display = "none";
});

editUsernameBtn.addEventListener("click", () => {
    let oldUsername = username;
    main.insertAdjacentHTML("beforeend", editLayerHTML + editUsernameHTML);
    const editLayer = document.querySelector("#edit-layer");
    const usernameEditor = document.querySelector("#username-editor");
    const editorClose = document.querySelector("#editor-close");
    const cancer = document.querySelector("#cancer");
    const usernameEditBtn = document.querySelector("#username-edit-button");
    const newUsernameInput = document.querySelector("#username-input");
    newUsernameInput.value = username;
    editLayer.addEventListener("click", () => {
        editLayer.remove();
        usernameEditor.remove();
    });
    editorClose.addEventListener("click", () => {
        editLayer.remove();
        usernameEditor.remove();
    });
    cancer.addEventListener("click", () => {
        editLayer.remove();
        usernameEditor.remove();
    });
    usernameEditBtn.addEventListener("click", async () => {
        const newUsername = newUsernameInput.value;
        if (newUsername === username) {
            editLayer.remove();
            usernameEditor.remove();
            return;
        }
        const password = document.querySelector("#password-input").value;
        const result = await updateAccountInfo(
            "username",
            newUsername,
            password
        );
        if (result) {
            editLayer.remove();
            usernameEditor.remove();
            username = result.value;
            updateUsername(result.value);
            updateChatUsername(oldUsername, result.value);
        }
    });
});

async function updateAccountInfo(type, newValue, password) {
    // Check fields
    // regex
    const usernameRegex = /^[A-Za-z0-9]{2,32}$/;
    const emailRegex =
        /^(?=.{8,64}$)\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
    const passwordRegex = /^.{6,72}$/;
    // error message
    const editorUsernameWrapper = document.querySelector(
        ".editor-username-wrapper"
    );
    const editorEmailWrapper = document.querySelector(".editor-email-wrapper");
    const editorPasswordWrapper = document.querySelector(
        ".editor-password-wrapper"
    );
    const usernameInputMessage = document.querySelector("#username-message");
    const emailInputMessage = document.querySelector("#email-message");
    const passwordInputMessage = document.querySelector("#password-message");
    // if valid
    let valueValid = false;
    let passwordValid = false;
    // fetch body: info
    const info = { type: type, value: newValue, password: password };

    // Type
    // username
    if (type === "username") {
        if (newValue === "") {
            usernameInputMessage.textContent = "請輸入使用者名稱。";
            editorUsernameWrapper.classList.add("error-wrapper");
        } else if (!usernameRegex.test(newValue)) {
            usernameInputMessage.textContent = "長度必須在 2 和 32 之間。";
            editorUsernameWrapper.classList.add("error-wrapper");
        } else {
            editorUsernameWrapper.classList.remove("error-wrapper");
            valueValid = true;
        }
        // email
    } else if (type === "email") {
        if (newValue === "") {
            emailInputMessage.textContent = "請輸入電子信箱。";
            editorEmailWrapper.classList.add("error-wrapper");
        } else if (!emailRegex.test(newValue)) {
            emailInputMessage.textContent = "請輸入正確格式的電子信箱。";
            editorEmailWrapper.classList.add("error-wrapper");
        } else {
            editorEmailWrapper.classList.remove("error-wrapper");
            valueValid = true;
        }
    }
    //password
    if (password === "") {
        passwordInputMessage.textContent = "請輸入密碼。";
        editorPasswordWrapper.classList.add("error-wrapper");
    } else if (!passwordRegex.test(password)) {
        passwordInputMessage.textContent = "密碼必須在 6 和 72 之間。";
        editorPasswordWrapper.classList.add("error-wrapper");
    } else {
        editorPasswordWrapper.classList.remove("error-wrapper");
        passwordValid = true;
    }
    // if newValue or password field invalid
    if (!valueValid || !passwordValid) {
        return false;
    }

    // fetch options
    const options = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
        },
        body: JSON.stringify(info),
    };

    // Call the API to Update the user info
    try {
        const response = await fetch(authUrl, options);
        const data = await response.json();

        if (!response.ok) {
            if (data.message === "Password is invalid") {
                passwordInputMessage.textContent = "密碼錯誤。";
                editorPasswordWrapper.classList.add("error-wrapper");
            } else if (data.message === "Username already exists") {
                usernameInputMessage.textContent = "使用者名稱已被使用。";
                editorUsernameWrapper.classList.add("error-wrapper");
            } else if (data.message === "Email already exists") {
                emailInputMessage.textContent = "電子郵件已被使用。";
                editorEmailWrapper.classList.add("error-wrapper");
            }

            return false;
        }

        return data;
    } catch (error) {
        console.log(error);
        return false;
    }
}

editEmailBtn.addEventListener("click", () => {
    main.insertAdjacentHTML("beforeend", editLayerHTML + editEmailHTML);
    const editLayer = document.querySelector("#edit-layer");
    const emailEditor = document.querySelector("#email-editor");
    const editorClose = document.querySelector("#editor-close");
    const cancer = document.querySelector("#cancer");
    const emailEditBtn = document.querySelector("#email-edit-button");
    const newEmailInput = document.querySelector("#email-input");
    newEmailInput.value = email;
    editLayer.addEventListener("click", () => {
        editLayer.remove();
        emailEditor.remove();
    });
    editorClose.addEventListener("click", () => {
        editLayer.remove();
        emailEditor.remove();
    });
    cancer.addEventListener("click", () => {
        editLayer.remove();
        emailEditor.remove();
    });
    emailEditBtn.addEventListener("click", async () => {
        const newEmail = newEmailInput.value;
        if (newEmail === email) {
            editLayer.remove();
            emailEditor.remove();
            return;
        }
        const password = document.querySelector("#password-input").value;
        const result = await updateAccountInfo("email", newEmail, password);
        if (result) {
            editLayer.remove();
            emailEditor.remove();
            email = result.value;
            updateEmail(result.value);
        }
    });
});

const accountSetting = document.querySelector("#account");
const profileSetting = document.querySelector("#profile");
const accountPage = document.querySelector("#account-page");
const profilePage = document.querySelector("#profile-page");

accountSetting.addEventListener("click", () => {
    accountSetting.classList.add("setting-list-active");
    profileSetting.classList.remove("setting-list-active");
    accountPage.style.display = "block";
    profilePage.style.display = "none";
});

profileSetting.addEventListener("click", () => {
    profileSetting.classList.add("setting-list-active");
    accountSetting.classList.remove("setting-list-active");
    accountPage.style.display = "none";
    profilePage.style.display = "block";
});

const editInfoBtn = document.querySelector("#edit-info-button");
editInfoBtn.addEventListener("click", () => {
    profileSetting.click();
});

const logoutBtn = document.querySelector("#logout");
logoutBtn.addEventListener("click", logout);

// Logout
async function logout() {
    const options = {
        method: "DELETE",
        headers: {
            "X-CSRFToken": token,
        },
    };
    const response = await fetch(authUrl, options);
    const data = await response.json();
    if (data.ok) {
        location.reload();
    }
}

// Avatar
const editAvatarHTML = `
<div class="editor avatar-editor" id="avatar-editor">
    <div class="editor-title-wrapper">
        <div class="editor-title">選擇圖片</div>
        <div class="editor-close pointer" id="editor-close">
            <svg class="closeIcon" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
            </svg>
        </div>
    </div>
    <div class="editor-content-wrapper pointer">
        <div class="editor-avatar-wrapper">
            <div class="editor-avatar-div">
                <svg class="uploadIcon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.2899 2L6 2C3.79086 2 2 3.79086 2 6V18C2 20.2091 3.79086 22 6 22H18C20.2091 22 22 20.2091 22 18V10.7101C21.3663 10.8987 20.695 11 20 11C16.134 11 13 7.86599 13 4C13 3.30503 13.1013 2.63371 13.2899 2ZM8 6C9.1032 6 10 6.8952 10 8C10 9.1056 9.1032 10 8 10C6.8944 10 6 9.1056 6 8C6 6.8952 6.8944 6 8 6ZM6 18L9 14L11 16L15 11L18 18H6Z" fill="currentColor" />
                    <path d="M21 0V3H24V5H21V8H19V5H16V3H19V0H21Z" fill="currentColor" />
                </svg>
                <div class="avatar-preview-circle">
                    <img class="avatar-preview-img" id="avatar-preview-img" />
                </div>
                <input type="file" id="avatar-input" accept=".jpeg, .jpg, .png"></input>
            </div>
            <div class="editor-avatar-title">
                上傳圖片
                <span class="error-separator"> - </span>
                <span class="input-error-message" id="avatar-message"></span>
            </div>
        </div>
    </div>
    <div class="editor-confirm-wrapper">
        <div class="editor-cancer-div pointer" id="cancer">
            <div class="editor-cancer-button">重置</div>
        </div>
        <div class="editor-confirm-div pointer" id="avatar-edit-button">
            <div class="editor-confirm-button">儲存變更</div>
        </div>
</div>
</div>
`;
const editAvatarBtn = document.querySelector("#avatar-editor-button");

editAvatarBtn.addEventListener("click", async () => {
    main.insertAdjacentHTML("beforeend", editLayerHTML + editAvatarHTML);
    const avatarEditor = document.querySelector("#avatar-editor");
    const editLayer = document.querySelector("#edit-layer");
    const editorClose = document.querySelector("#editor-close");
    editLayer.addEventListener("click", () => {
        editLayer.remove();
        avatarEditor.remove();
    });
    editorClose.addEventListener("click", () => {
        editLayer.remove();
        avatarEditor.remove();
    });

    const formData = new FormData();
    const avatarInput = document.querySelector("#avatar-input");
    const avatarPreviewImg = document.querySelector("#avatar-preview-img");
    avatarInput.addEventListener("change", (event) => {
        URL.revokeObjectURL(avatarPreviewImg.src);
        const file = event.target.files[0];
        if (file.size > 10 * 1024 * 1024) {
            alert("圖片大小不能超過 10 MB");
            return;
        }
        formData.append("image", file);
        avatarPreviewImg.src = URL.createObjectURL(file);
        avatarPreviewImg.style.display = "block";
    });

    const avatarSubmitBtn = document.querySelector("#avatar-edit-button");
    avatarSubmitBtn.addEventListener("click", async () => {
        const options = {
            method: "POST",
            headers: {
                "X-CSRFToken": token,
            },
            body: formData,
        };

        const response = await fetch(avatarUrl, options);
        const data = await response.json();
        if (response.ok) {
            avatar = data.avatar;
            updateAvatar("update", avatar);
            editLayer.remove();
            avatarEditor.remove();
        }
    });
});

const avatarRemoveBtn = document.querySelector("#avatar-remove-button");
avatarRemoveBtn.addEventListener("click", removeAvatar);

async function removeAvatar() {
    const options = {
        method: "DELETE",
        headers: {
            "X-CSRFToken": token,
        },
    };
    const response = await fetch(avatarUrl, options);
    const data = await response.json();
    if (response.ok) {
        avatar = null;
        updateAvatar("update", avatar);
    }
}

// About me
const aboutMe = document.querySelector("#aboutme");
const aboutMeEditBtn = document.querySelector("#aboutme-edit-button");
const aboutMePreview = document.querySelector(".preview-aboutme-content");
aboutMe.addEventListener("input", () => {
    aboutMePreview.textContent = aboutMe.value;
    aboutMePreview.scrollTop = aboutMePreview.scrollHeight;
    if (aboutMe.value === aboutMeContent) {
        aboutMeEditBtn.style.display = "none";
    } else {
        aboutMeEditBtn.style.display = "flex";
    }
});

aboutMeEditBtn.addEventListener("click", () => {
    if (aboutMe.value !== aboutMeContent) {
        aboutMeEditBtn.style.display = "none";
        saveAboutMe(aboutMe.value);
    }
});

async function saveAboutMe(content) {
    const info = { aboutMe: content };
    const options = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
        },
        body: JSON.stringify(info),
    };
    const response = await fetch(aboutMeUrl, options);
    const data = await response.json();
    if (response.ok) {
        console.log(data);
        aboutMeContent = content;
        alert("更新成功！");
        updateAboutMe();
    }
}
