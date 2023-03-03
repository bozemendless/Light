const serverAPIUrl = "api/server";
const serverMemberAPIUrl = "api/server/members";
const serverArea = document.querySelector("#server-list");
const serverLoadingStatus = {};
const createServerBtn = document.querySelector("#create-server");
const messagesUlWrapper = document.querySelector("#messages");
const serverCreator = {};
const serverMembers = {};

// Load server list
async function serverInit() {
    const response = await fetch(serverAPIUrl);
    const data = await response.json();
    await loadingServerList(data.data);
    switchServer();
    await serverArea.firstElementChild.firstElementChild.click();
    defaultServerLoading = true;
}

async function loadingServerList(servers) {
    const voiceChannelDiv = document.querySelector(".voice-channel");
    servers.forEach((server) => {
        const serverWrapperHTML = `
        <div class="server-wrapper">
            <div class="server" id="server-${server.id}" data-server-id="server-${server.id}" data-server-name="${server.name}">${server.name}</div>
            <div class="pill"></div>
        </div>
        `;
        serverArea.insertAdjacentHTML("beforeend", serverWrapperHTML);
        serverLoadingStatus[server.id] = false;

        // voice channel list
        const voiceUserWrappersWrapperHTML = `
        <div class="voice-user-wrappers-wrapper" id="voice-channel-server-wrapper-${server.id}" style="display: none;"></div>
        `;
        voiceChannelDiv.insertAdjacentHTML(
            "beforeend",
            voiceUserWrappersWrapperHTML
        );
        const wrappersWrapper = document.querySelector(
            `#voice-channel-server-wrapper-${server.id}`
        );
        voiceChannelWrappersWrapperArray.push({
            id: server.id,
            wrapper: wrappersWrapper,
        });

        if (server.creator.id === userId) {
            serverCreator[server.id] = true;
        } else {
            serverCreator[server.id] = false;
        }

        serverMembers[server.id] = {
            name: server.name,
            creator: server.creator.username,
            member: server.members,
        };
    });
}

// Switch server
function switchServer() {
    serverArea.addEventListener("click", async (event) => {
        if (event.target.classList.contains("server-active")) {
            return;
        }
        if (event.target.classList.contains("server")) {
            // Get click serverId
            const serverId = event.target
                .getAttribute("data-server-id")
                .split("-")[1];
            const serverName = event.target.getAttribute("data-server-name");
            currentServerId = serverId;
            currentServerName = serverName;

            // active view switch
            const activeServer = document.querySelector(".server-active");
            if (activeServer) {
                activeServer.classList.remove("server-active");
                event.target.classList.add("server-active");
            } else {
                event.target.classList.add("server-active");
            }

            // switch sidebar channel name
            const channelName = document.querySelector("#channel-name");
            channelName.textContent = event.target.textContent;

            //  check if first time loading this server
            // have ever loaded
            if (serverLoadingStatus[currentServerId]) {
                console.log("載入過了");

                // first time load
            } else {
                // create ul
                const ulHTML = `
                <ul class="message-list" id="message-list-${currentServerId}"></ul>
                `;
                messagesUlWrapper.insertAdjacentHTML("beforeend", ulHTML);
                const currentUl = document.querySelector(
                    `#message-list-${currentServerId}`
                );
                uls.push({ id: serverId, ul: currentUl });

                // load chat logs
                const logs = await getChatLogs(currentServerId);
                createChatLogs(logs);
                serverLoadingStatus[currentServerId] = true;
                currentUl.scrollTop = currentUl.scrollHeight;
            }

            // switch ul(message-list) view
            const messageLists = document.querySelectorAll(".message-list");
            messageLists.forEach((list) => {
                list.style.display = "none";
            });
            const ulObject = uls.find((ul) => ul.id === serverId);
            ulObject.ul.style.display = "block";

            messageInput.placeholder = `傳送訊息到 ${currentServerName}`;
            messageInput.value = "";
            // switch voice channel wrappers wrapper
            // const wrapper = voiceChannelWrappersWrapperArray.find(
            //     (wrapper) => wrapper.id === serverId
            // ).wrapper;
            // wrapper.style.display = "block";
            voiceChannelWrappersWrapperArray.forEach((wrapper) => {
                if (wrapper.id === serverId) {
                    wrapper.wrapper.style.display = "block";
                } else {
                    wrapper.wrapper.style.display = "none";
                }
            });
        }
    });
}

// Create server button
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
        const regex = /^[a-zA-Z0-9\u4e00-\u9fa5 ]{2,100}$/;
        if (regex.test(createServerInput.value)) {
            createServer(createServerInput.value.trim());
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

serverInit().then(() => {
    webSocket = webSocketConnect();
});
