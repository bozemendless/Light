// User data
let userId;
let username;
let email;
let avatar = null;

// Websocket
let isSocketConnect = false;
let currentInChanneL;
const channelMap = {};
const webSocket = webSocketConnect();

// P2P connection & WebRTC
let peer;
let peerId = null;
const mediaConnections = [];
const localStream = new MediaStream();

// Servers
let defaultServerLoading = false;
let currentServerId;
let currentServerName;
const uls = [];
const voiceChannelWrappersWrapperArray = [];

// DOM
const messageInput = document.querySelector("#message-input");
const messageList = document.querySelector("#message-list");
let channelActive = document.querySelector(".channel-active");
const channelList = document.querySelector(".channel-list");
const generalVideoChannel = document.querySelector("#general-video-channel");

// Functions
function init() {
    switchChannel(); // default is general text channel

    // Get user infos
    getUserData();

    // Create My Peer Object
    peer = createMyPeer();

    // Preload gif
    preload();
}

async function getUserData() {
    const getUserDataUrl = "/api/user/auth";

    const response = await fetch(getUserDataUrl);
    const data = await response.json();
    userId = data.id;
    username = data.username;
    email = data.email;
    avatar = data.avatar;
    if (!avatar) {
        updateAvatar("load", avatar);
    } else {
        updateAvatar("update", avatar);
    }

    updateUsername(username);
    updateEmail(email);
}

function updateUsername(newUsername) {
    // Show username in setting zone
    const usernameContainer = document.querySelector(".username-container");
    usernameContainer.textContent = newUsername;
    // Show username in setting page
    const cardUsername = document.querySelector("#card-username");
    cardUsername.textContent = newUsername;
    // Show username in setting page > card background
    const backgroundUsername = document.querySelector("#background-username");
    backgroundUsername.textContent = newUsername;
    // Show username in setting page > card preview
    const previewUsername = document.querySelector("#preview-username");
    previewUsername.textContent = newUsername;
}

function updateChatUsername(oldUsername, newUsername) {
    const messagesUsernames = document.querySelectorAll(`.${oldUsername}`);
    messagesUsernames.forEach((username) => {
        username.textContent = newUsername;
        username.classList.remove(oldUsername);
        username.classList.add(newUsername);
    });
}

function updateEmail(newEmail) {
    const backgroundEmail = document.querySelector("#background-email");
    backgroundEmail.textContent = newEmail;
}

function updateAvatar(type, newAvatar) {
    let src;
    if (!newAvatar) {
        const avatarRemoveBtn = document.querySelector("#avatar-remove-button");
        avatarRemoveBtn.style.display = "none";
        src = url;
    } else {
        avatarRemoveBtn.style.display = "flex";
        src = newAvatar;
    }
    if (type === "update") {
        const messagesAvatars = document.querySelectorAll(`.${username}Avatar`);
        messagesAvatars.forEach((avatar) => {
            avatar.src = src;
        });
    }

    const avatarImg = document.querySelector("#avatar");
    const settingAvatarImg = document.querySelector("#setting-avatar-img");
    const previewAvatarImg = document.querySelector("#preview-avatar-img");
    previewAvatarImg.src = src;
    avatarImg.src = src;
    settingAvatarImg.src = src;
}

function createMyPeer() {
    // Get my peerId
    const peer = new Peer({
        host: "0.peerjs.com",
        port: 443,
        path: "/",
        pingInterval: 5000,
    });

    peer.on("open", function (id) {
        peerId = id;
    });

    return peer;
}

function preload() {
    const a = setInterval(() => {
        if (isSocketConnect && peerId && defaultServerLoading) {
            const preload = document.getElementById("preload");
            preload.parentNode.removeChild(preload);
            clearInterval(a);
        }
    }, 2000);
}

function switchChannel() {
    const chatPage = document.querySelector(".chat");
    const videoPage = document.querySelector(".video");
    if (channelActive.id === "general-chat-channel") {
        chatPage.style.display = "flex";
        videoPage.style.display = "none";
    }

    if (channelActive.id === "general-video-channel") {
        videoPage.style.display = "block";
        chatPage.style.display = "none";
    }
}

// Join Voice Channel
function joinVoiceChannel(server) {
    const onePeopleVideo = document.querySelector(".one-people-video");
    console.log(server);
    // Change my already in Channel Name
    currentInChanneL = "general-video-channel";
    createLocalStream();

    // Listen on WebSocket messages
    webSocket.addEventListener("message", (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === "sdp") {
            const action = parsedData["data"]["action"];

            // (existing peer) be asked for connecting
            if (action === "peer") {
                const newPeerId = parsedData["data"]["peer_id"];
                const peerUsername = parsedData["data"]["peer_username"];
                const userId = parsedData["data"]["user_id"];
                const peerChannelName = parsedData["data"]["peer_channel_name"];
                const peerServerId = parsedData["data"]["peer_server_id"];
                if (peerId === newPeerId || peerServerId !== currentServerId) {
                    // do nothing with myself join message(ask for connecting)
                    return;
                }
                // Existing members track the new member
                channelMap[`${peerChannelName}`] = {
                    peerUsername: peerUsername,
                    peerId: newPeerId,
                    userId: userId,
                    peerServerId: peerServerId,
                };
                if (Object.keys(channelMap).length !== 0) {
                    onePeopleVideo.style.display = "none";
                }

                //  same server
                if (peerServerId === currentServerId) {
                    // answer to new peer
                    const sendData = {
                        action: "answer",
                        userId: userId,
                        peerId: peerId,
                        username: username,
                        peerChannelName: peerChannelName,
                    };
                    webSocket.send(JSON.stringify(sendData));

                    // *peers existing in room already * Connect to new peer
                    const call = peer.call(newPeerId, localStream);
                    mediaConnections.push(call.peerConnection);
                    // console.log(call.peerConnection.getSenders()[0]);
                    const { remoteVideo, remoteAudio } =
                        createRemoteVideo(peerUsername);
                    call.on("stream", (stream) => {
                        // console.log(stream.getVideoTracks());
                        remoteVideo.srcObject = stream;
                        remoteAudio.srcObject = stream;
                    });
                }
            }

            if (action === "answer") {
                const existingPeerId = parsedData["data"]["peer_id"];
                const peerUsername = parsedData["data"]["peer_username"];
                const userId = parsedData["data"]["user_id"];
                const peerChannelName =
                    parsedData["data"]["answer_channel_name"];
                channelMap[`${peerChannelName}`] = {
                    peerUsername: peerUsername,
                    peerId: existingPeerId,
                    userId: userId,
                };
                if (Object.keys(channelMap).length !== 0) {
                    onePeopleVideo.style.display = "none";
                }
            }

            if (action === "leave") {
                const peerChannelName = parsedData["data"]["peer_channel_name"];
                if (!channelMap.hasOwnProperty(peerChannelName)) {
                    return;
                }
                const leaveUsername = channelMap[peerChannelName].peerUsername;
                const leaveUserVideo = document.querySelector(
                    `#${leaveUsername}-video`
                );
                if (leaveUserVideo) {
                    deleteVideo(leaveUserVideo);
                }

                delete channelMap[`${peerChannelName}`];
                if (Object.keys(channelMap).length === 0) {
                    onePeopleVideo.style.display = "block";
                }
            }
        }
    });

    // *new-peer just joining the room *
    // Send my peerId, (Light)userId, (Light)username to existing Members(ask for connecting)
    const sendData = {
        action: "peer",
        peerId: peerId,
        id: userId,
        username: username,
        server: currentServerId,
    };
    webSocket.send(JSON.stringify(sendData));

    // *new-peer just joining the room *
    // Listen to existing members' connections (wait for connecting)

    peer.on("call", (call) => {
        // console.log("on call!");
        call.answer(localStream);

        mediaConnections.push(call.peerConnection);
        let remotePeerUsername;
        for (let peer in channelMap) {
            remotePeerUsername = channelMap[peer].peerUsername;
        }

        const { remoteVideo, remoteAudio } =
            createRemoteVideo(remotePeerUsername);

        call.on("stream", (stream) => {
            remoteVideo.srcObject = stream;
            remoteAudio.srcObject = stream;
        });
        call.on("error", (e) => {
            console.log(e);
        });
        call.on("close", () => {
            console.log("media connection closed");
            // mediaConnections.remove(call.peerConnection);
        });
    });
}

// Chat Logs
// Get history chat logs when user logs in
async function getChatLogs(server) {
    const getChatLogsUrl = `/api/chat?server_id=${server}`;
    const response = await fetch(getChatLogsUrl);
    const data = await response.json();
    return data.data;
}

// Create and show history logs
function createChatLogs(data) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    data.forEach((chatLog) => {
        if (chatLog.length === 0) {
            return;
        }
        // if a user was texting continuously, the dom structure will be different
        let isSameUserTexting = false;

        // the fist message in the history would not have previous log >> lastUserDiv | null
        // const ulObject = uls.find((ul) => ul.id === chatLog["server"]);
        // currentServerId
        // const lastUserDiv = ulObject.ul.lastChild;

        // // check if is first chat log
        // if (lastUserDiv) {
        //     const lastUser =
        //         lastUserDiv.querySelector(".message-user").textContent;
        //     // check if the same user texting continuously
        //     if (lastUser === chatLog["username"]) {
        //         isSameUserTexting = true;
        //     } else {
        //         isSameUserTexting = false;
        //     }
        // }

        const messageDiv = document.createElement("div");
        const messageContentDiv = document.createElement("div");
        const messageUserAvatar = document.createElement("img");
        const messageHeader = document.createElement("div");
        const messageUser = document.createElement("span");
        const messageTime = document.createElement("span");
        const messageContent = document.createElement("div");
        const messageContentTextNode = document.createTextNode(
            chatLog["message"].replace(/&newline;/g, "\n")
        );
        const ulObject = uls.find((ul) => ul.id === chatLog["server"]);
        ulObject.ul.appendChild(messageDiv);

        // messageList.
        messageDiv.appendChild(messageContentDiv);
        messageContentDiv.appendChild(messageUserAvatar);
        messageContentDiv.appendChild(messageHeader);
        messageContentDiv.appendChild(messageContent);
        messageHeader.appendChild(messageUser);
        messageHeader.appendChild(messageTime);
        messageContent.appendChild(messageContentTextNode);

        messageDiv.className = "message-div";
        messageUserAvatar.className = `message-user-avatar ${chatLog["username"]}Avatar`;
        messageContentDiv.className = "message-content-div";
        messageHeader.className = "message-header";
        messageUser.className = `message-user ${chatLog["username"]}`;
        messageTime.className = "message-time";
        messageContent.className = "message-content";

        messageUser.textContent = chatLog["username"];

        // if is different user texting
        if (isSameUserTexting) {
            messageContentDiv.classList.add("same-user-texting");
        }

        // Avatar
        if (!chatLog["avatar"]) {
            messageUserAvatar.src = url;
        } else {
            messageUserAvatar.src = chatLog["avatar"];
        }

        // Display time
        const chatTime = new Date(chatLog["time"]);
        let displayTime;
        let hour = chatTime.getHours();
        let minutes = chatTime.getMinutes();

        if (hour < 10) {
            hour = "0" + hour;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }

        if (chatTime.toDateString() === today.toDateString()) {
            displayTime = `今天 ${hour}:${minutes}`;
        } else if (chatTime.toDateString() === yesterday.toDateString()) {
            displayTime = `昨天 ${hour}:${minutes}`;
        } else {
            let month = chatTime.getMonth() + 1;
            let date = chatTime.getDate();
            if (month < 10) {
                month = "0" + month;
            }
            if (date < 10) {
                date = "0" + date;
            }
            displayTime = `${chatTime.getFullYear()}/${month}/${date} ${hour}:${minutes}`;
        }
        messageTime.textContent = displayTime;
        ulObject.ul.scrollTop = ulObject.ul.scrollHeight;
    });
}

function sendMessage(message) {
    const sendData = {
        action: "message",
        id: userId,
        username: username,
        message: message,
        serverId: currentServerId,
    };
    const today = new Date();
    const arr = [
        {
            avatar: avatar,
            message: message,
            username: username,
            server: currentServerId,
            time: today,
        },
    ];
    createChatLogs(arr);
    webSocket.send(JSON.stringify(sendData));
}

// WebSocket
function webSocketConnect() {
    // Connect to server
    let wsStart = "ws://";
    if (window.location.protocol === "https:") {
        wsStart = "wss://";
    }
    const endpoint = `${wsStart}${window.location.host}${window.location.pathname}ws`;
    const webSocket = new WebSocket(endpoint);
    webSocket.addEventListener("open", (event) => {
        console.log("webSocket connected");
        isSocketConnect = true;
    });

    webSocket.addEventListener("message", (event) => {
        const parsedData = JSON.parse(event.data);

        // Listen to chat message
        if (parsedData.type === "message") {
            const arr = [parsedData.data];
            if (
                arr[0]["username"] === username && // self's message
                serverLoadingStatus[arr[0]["server"]] // already loading
            ) {
                return;
            } else {
                createChatLogs(arr);
            }
        }

        // Listen to notifications
        if (parsedData.type === "notification") {
            if (parsedData.data.action === "channel_list") {
                // console.log(parsedData.data.general_voice_channel);
                // [{peer_username:peer_username, peer_channel_name: peer_channel_name}]
                const members = parsedData.data.general_voice_channel;
                showChannelMember("join_room", members);
            }
            if (parsedData.data.action === "join_room") {
                // console.log(
                //     `${parsedData.data.peer_username} 進入了語音頻道，他的 channel name 是 ${parsedData.data.peer_channel_name}`
                // );
                const members = [
                    {
                        peer_username: parsedData.data.peer_username,
                        peer_channel_name: parsedData.data.peer_channel_name,
                        peer_server_id: parsedData.data.peer_server_id,
                    },
                ];
                showChannelMember("join_room", members);
            }
            if (parsedData.data.action === "leave_room") {
                //
                // console.log(
                //     `${parsedData.data.peer_username} 離開了語音頻道，他的 channel name 是 ${parsedData.data.peer_channel_name}`
                // );
                const members = [
                    {
                        peer_username: parsedData.data.peer_username,
                        peer_channel_name: parsedData.data.peer_channel_name,
                        peer_server_id: parsedData.data.peer_server_id,
                    },
                ];
                showChannelMember("leave_room", members);
            }
        }
    });

    // Listen to close event
    webSocket.addEventListener("close", (event) => {
        isSocketConnect = false;
        console.log("WebSocket close", "connection closed!", event);
        const message = "與伺服器失去連線，即將重新載入頁面。";
        alert(message);
        location.reload();
    });

    // Listen to error event
    webSocket.addEventListener("error", (event) => {
        console.log("WebSocket error", "error!", event);
    });

    return webSocket;
}

// Stream
// Local Video
async function createLocalStream() {
    const localVideo = document.querySelector("#local-video");
    const cameraBtn = document.querySelector("#camera-btn");
    const audioBtn = document.querySelector("#audio-btn");
    const leaveBtn = document.querySelector("#leave-btn");
    const audioOnSvg = document.querySelector("#audio-on-svg");
    const audioOffSvg = document.querySelector("#audio-off-svg");

    let videoTracks;
    let audioTracks;

    let cameraExist = false;
    let cameraToggle = false;
    let audioExist = false;

    // Name label
    const localVideoWrapper = document.querySelector(".local-video-wrapper");
    const channelUsernameLabel = document.createElement("div");
    channelUsernameLabel.className = "channel-username-label";
    localVideoWrapper.appendChild(channelUsernameLabel);
    channelUsernameLabel.textContent = username;

    // Add fake track
    const fakeVideoTrack = createAvatarVideoTrack();
    // const fakeAudioTrack = createFakeAudioTrack();
    localStream.addTrack(fakeVideoTrack);
    // localStream.addTrack(fakeAudioTrack);

    // Check if media devices exist
    navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
            // console.log(devices);
            devices.forEach((device) => {
                if (device.kind === "videoinput") {
                    // console.log(device.label);
                    cameraExist = true;
                }
                if (device.kind === "audioinput") {
                    audioExist = true;
                }
            });
        })
        .then(() => {
            if (!cameraExist) {
                cameraBtn.classList.add("button-forbidden");
            }
            if (!audioExist) {
                audioBtn.classList.add("button-forbidden");
            }
        });

    navigator.mediaDevices
        .getUserMedia({
            audio: true,
        })
        .then(async (localMedia) => {
            audioTracks = localMedia.getAudioTracks();
            audioTracks.forEach((track) => {
                localStream.addTrack(track);
            });
            audioTracks[0].enabled = false;
            // console.log(localStream.getTracks());
        });

    cameraBtn.addEventListener("click", cameraBtnClick);
    audioBtn.addEventListener("click", audioBtnClick);
    leaveBtn.addEventListener("click", leaveBtnClick);

    localVideo.srcObject = localStream;
    localVideo.muted = true;

    // Create avatar video track
    function createAvatarVideoTrack() {
        let canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#757e8a";
        ctx.fillRect(0, 0, 640, 480);
        // const image = new Image();
        // image.addEventListener("load", () => {
        //     canvas.width = Math.min(image.width, image.height);
        //     canvas.height = Math.min(image.width, image.height);
        //     const radius = canvas.width / 2;
        // ctx.drawImage(image, 0, 0);
        // ctx.beginPath();
        // ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
        // ctx.clip();
        // ctx.drawImage(
        //     image,
        //     0,
        //     0,
        //     canvas.width,
        //     canvas.height,
        //     0,
        //     0,
        //     canvas.width,
        //     canvas.height
        // );
        // });

        // image.src = streamAvatarUrl;
        const stream = canvas.captureStream(1);
        stream.getVideoTracks()[0].enabled = true;
        return stream.getVideoTracks()[0];
    }

    function cameraBtnClick() {
        if (!cameraExist) {
            const message = `偵測不到攝影機，請確認已在您的裝置上啟用攝影機後重新進入語音頻道。`;
            alert(message);
            return;
        }

        // Turn the camera on
        if (!cameraToggle) {
            navigator.mediaDevices
                .getUserMedia({
                    video: true,
                })
                .then(async (localMedia) => {
                    videoTracks = localMedia.getVideoTracks();
                    videoTracks[0].enabled = true;
                    mediaConnections.forEach((connection) => {
                        connection.getSenders().forEach((sender) => {
                            if (sender.track.kind === "video") {
                                sender.replaceTrack(videoTracks[0]);
                            }
                        });
                    });
                    localVideo.style.display = "block";
                    cameraBtn.classList.add("camera-active");
                    localStream.removeTrack(fakeVideoTrack);
                    localStream.addTrack(videoTracks[0]);
                    cameraToggle = true;
                })
                .catch((e) => {
                    console.log("no camera", e);
                    cameraBtn.classList.remove("camera-active");
                    cameraBtn.classList.add("button-forbidden");
                    localVideo.style.display = "none";
                    cameraExist = false;
                });
            return;
        }

        // Turn the camera off
        if (cameraToggle) {
            // localVideo.style.display = "none";
            cameraBtn.classList.remove("camera-active");
            mediaConnections.forEach((connection) => {
                connection.getSenders().forEach((sender) => {
                    if (sender.track.kind === "video") {
                        sender.replaceTrack(fakeVideoTrack);
                    }
                });
            });

            videoTracks[0].enabled = false;
            videoTracks[0].stop();
            localStream.removeTrack(videoTracks[0]);
            localStream.addTrack(fakeVideoTrack);
            cameraToggle = false;
        }
    }

    function audioBtnClick() {
        const settingUnmuteSvg = document.querySelector("#setting-unmute-svg");
        const settingMuteSvg = document.querySelector("#setting-mute-svg");
        audioTracks[0].enabled = !audioTracks[0].enabled;
        if (audioTracks[0].enabled) {
            audioBtn.classList.add("audio-active");
            audioOnSvg.style.display = "inline";
            audioOffSvg.style.display = "none";
            settingUnmuteSvg.style.display = "inline";
            settingMuteSvg.style.display = "none";
        } else {
            audioBtn.classList.remove("audio-active");
            audioOnSvg.style.display = "none";
            audioOffSvg.style.display = "inline";
            settingUnmuteSvg.style.display = "none";
            settingMuteSvg.style.display = "inline";
        }
        // console.log(mediaConnections[0].getSenders());
    }

    function leaveBtnClick() {
        peer.destroy();
        location.reload();
    }
}

// Remote Video
/*
We need to separate the video and audio element here, because of Chrome!!! Google Chrome!!!!!
In Chrome, video element won't autoplay before it receives the first frame!!!
In other words, if the remote peer doesn't turn on the camera, Chrome will keep waiting for the first frame,
    and there will be NO VOICE.
*/
function createRemoteVideo(peerUsername) {
    const videos = document.querySelector(".videos");
    const videoWrapper = document.createElement("div");
    const remoteVideo = document.createElement("video");
    const remoteAudio = document.createElement("audio");

    videos.appendChild(videoWrapper);
    videoWrapper.appendChild(remoteVideo);
    videoWrapper.appendChild(remoteAudio);

    videoWrapper.className = "video-wrapper";
    remoteVideo.id = `${peerUsername}-video`;

    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    remoteVideo.muted = true;

    remoteAudio.autoplay = true;

    // Name label
    const channelPeerNameLabel = document.createElement("div");
    channelPeerNameLabel.className = "channel-username-label";
    videoWrapper.appendChild(channelPeerNameLabel);
    channelPeerNameLabel.textContent = peerUsername;

    return { remoteVideo: remoteVideo, remoteAudio: remoteAudio };
}

// Delete Video
function deleteVideo(video) {
    const videoWrapper = video.parentNode;
    if (videoWrapper) {
        videoWrapper.parentNode.removeChild(videoWrapper);
    }
    return;
}

// Show channel member
function showChannelMember(action, members) {
    console.log(action, members);

    if (action === "join_room") {
        members.forEach((member) => {
            const voiceUserWrapper = document.createElement("div");
            const voiceUser = document.createElement("div");
            const voiceUserAvatar = document.createElement("div");
            const voiceUsername = document.createElement("div");
            voiceUserWrapper.className = "voice-user-wrapper";
            voiceUserWrapper.id = member.peer_channel_name;
            voiceUser.className = "voice-user";
            voiceUserAvatar.className = "voice-user-avatar";
            voiceUsername.className = "voice-username";
            voiceUsername.textContent = member.peer_username;
            voiceUser.appendChild(voiceUserAvatar);
            voiceUser.appendChild(voiceUsername);
            voiceUserWrapper.appendChild(voiceUser);
            const wrapper = voiceChannelWrappersWrapperArray.find(
                (wrapper) => wrapper.id === member.peer_server_id
            ).wrapper;
            wrapper.appendChild(voiceUserWrapper);
        });
    }

    if (action === "leave_room") {
        members.forEach((member) => {
            const leaveUserChannelId = member.peer_channel_name;
            const leaveVoiceUserWrapper =
                document.getElementById(leaveUserChannelId);
            leaveVoiceUserWrapper.remove();
        });
    }
}

// Event Listener
// 點擊了哪個頻道
channelList.addEventListener("click", (event) => {
    const channelNameLabel = document.querySelectorAll(".channel-name-label");
    if (event.target.classList.contains("channel-active")) {
        return;
    }
    if (event.target.classList.contains("channel-name-label")) {
        channelNameLabel.forEach((element) => {
            element.classList.toggle("channel-active");
        });
        channelActive = document.querySelector(".channel-active");
        switchChannel();
    }
});

generalVideoChannel.addEventListener("click", () => {
    let clickedChannel;
    if (isSocketConnect === true) {
        clickedChannel = "general-video-channel";

        // been joined channel and the current channel cannot be the same
        if (currentInChanneL === clickedChannel) {
            console.log("already in this channel");
        }
        if (currentInChanneL !== clickedChannel && peerId != null) {
            joinVoiceChannel(currentServerId);
        }
    }
});

// Send Chat Message via WebSocket
messageInput.addEventListener("keydown", (event) => {
    if (isSocketConnect) {
        if (event.key === "Enter" && !event.shiftKey) {
            // event.preventDefault();
            if (messageInput.value.trim() !== "") {
                const messageValue = messageInput.value.replace(
                    /\n/g,
                    "&newline;"
                );
                sendMessage(messageValue);
                messageInput.value = "";
            }
        }
    }
});

// Init

init();
