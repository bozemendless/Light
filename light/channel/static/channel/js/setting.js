const main = document.querySelector("main");
const settingBtn = document.querySelector(".setting-button");
const settingPage = document.querySelector(".setting-page");
const exitBtn = document.querySelector(".exit");
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
        <div class="editor-username-title">使用者名稱</div>
        <div class="editor-username-div">
            <input class="editor-username-input" value="test" autocomplete="new-text" />
        </div>
    </div>
    <div class="editor-password-wrapper">
        <div class="editor-password-title">目前密碼</div>
        <div class="editor-password-div">
            <input type="password" class="editor-password-input" autocomplete="new-password" />
        </div>
    </div>
</div>
<div class="editor-confirm-wrapper">
    <div class="editor-cancer-div pointer" id="cancer">
        <div class="editor-cancer-button">取消</div>
    </div>
    <div class="editor-confirm-div pointer">
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
        <div class="editor-email-title">電子郵件</div>
        <div class="editor-email-div">
            <input class="editor-email-input" value="test@gmail.com" autocomplete="new-text" />
        </div>
    </div>
    <div class="editor-password-wrapper">
        <div class="editor-password-title">目前密碼</div>
        <div class="editor-password-div">
            <input type="password" class="editor-password-input" autocomplete="new-password" />
        </div>
    </div>
</div>
<div class="editor-confirm-wrapper">
    <div class="editor-cancer-div pointer" id="cancer">
        <div class="editor-cancer-button">取消</div>
    </div>
    <div class="editor-confirm-div pointer">
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
    main.insertAdjacentHTML("beforeend", editLayerHTML + editUsernameHTML);
    const editLayer = document.querySelector("#edit-layer");
    const usernameEditor = document.querySelector("#username-editor");
    const editorClose = document.querySelector("#editor-close");
    const cancer = document.querySelector("#cancer");
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
});

editEmailBtn.addEventListener("click", () => {
    main.insertAdjacentHTML("beforeend", editLayerHTML + editEmailHTML);
    const editLayer = document.querySelector("#edit-layer");
    const emailEditor = document.querySelector("#email-editor");
    const editorClose = document.querySelector("#editor-close");
    const cancer = document.querySelector("#cancer");
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
