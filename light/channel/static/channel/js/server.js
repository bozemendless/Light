const serverAPIUrl = "api/server";
serverInit();

// Load server list
async function serverInit() {
    const response = await fetch(serverAPIUrl);
    const data = await response.json();
    loadingServerList(data.data);
}

// Create server
const createServerBtn = document.querySelector("#create-server");
createServerBtn.addEventListener("click", () => {
    const createServerHTML = `
    <div class="create-server-wrapper" id="create-server-wrapper">
        <div class="create-server-title-div">
            <div class="create-server-title">創建伺服器</div>
            <div class="create-server-slogan">幫您的新伺服器取個名字。</div>
            <div class="editor-close pointer" id="editor-close">
                <svg class="closeIcon" width="24" height="24" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
                </svg>
            </div>
        </div>
        <div class="create-server-name-div">
            <div class="create-server-error">
                <div class="create-server-error-message"> - 允許長度在 2 和 100 之間，中、英文或數字的任意組合</div>
            </div>
            <div class="create-server-name-title">伺服器名稱</div>
            <div class="create-server-input-wrapper">
                <input class="create-server-input" id="create-server-input" />
            </div>
        </div>
        <div class="create-server-submit-div">
            <div class="create-server-submit-button forbidden" id="create-server-submit-button">
                <div class="create-server-submit-text">建立</div>
            </div>
        </div>
    </div>
    `;
    main.insertAdjacentHTML("beforeend", editLayerHTML + createServerHTML);
    const closeBtn = document.querySelector("#editor-close");
    const editLayer = document.querySelector("#edit-layer");
    const createServerWrapper = document.querySelector(
        "#create-server-wrapper"
    );
    const createServerInput = document.querySelector("#create-server-input");
    const createServerSubmitBtn = document.querySelector(
        "#create-server-submit-button"
    );
    closeBtn.addEventListener("click", () => {
        editLayer.remove();
        createServerWrapper.remove();
    });
    editLayer.addEventListener("click", () => {
        editLayer.remove();
        createServerWrapper.remove();
    });
    createServerInput.addEventListener("input", () => {
        if (createServerInput.value === "") {
            createServerSubmitBtn.classList.add("forbidden");
        } else createServerSubmitBtn.classList.remove("forbidden");
    });
    createServerSubmitBtn.addEventListener("click", () => {
        const regex = /^[a-zA-Z0-9\u4e00-\u9fa5]{2,100}$/;
        if (regex.test(createServerInput.value)) {
            createServer(createServerInput.value);
            return;
        } else {
            alert("必須為長度在 2 和 100 之間的中、英文或數字的任意組合");
            return;
        }
    });
    async function createServer(name) {
        const info = {
            name: name,
        };
        const options = {
            method: "POST",
            headers: {
                "X-CSRFToken": token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(info),
        };
        const response = await fetch(serverAPIUrl, options);
        const data = await response.json();
        if (response.ok) {
            console.log(data.data);
            loadingServerList(data.data);
            editLayer.remove();
            createServerWrapper.remove();
            return;
        }
    }
});

function loadingServerList(servers) {
    const serverArea = document.querySelector("#server-list");
    servers.forEach((server) => {
        const serverWrapperHTML = `
        <div class="server-wrapper">
            <div class="server">${server.name}</div>
            <div class="pill"></div>
        </div>
        `;
        serverArea.insertAdjacentHTML("beforeend", serverWrapperHTML);
    });
}
