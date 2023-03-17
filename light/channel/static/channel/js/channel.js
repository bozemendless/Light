// User data
let userId;
let username;
let email;
let aboutMeContent;
let avatar = null;
let isSubmitting = false;
let remote;

// Websocket
let isSocketConnect = false;
let currentInChanneL;
const channelMap = {};
let webSocket;

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
const hamburger = document.querySelector("#hamburger");
const serverMenu = document.querySelector("#server-menu");
const avatarWrapper = document.querySelector(".avatar-wrapper");

// Functions
async function init() {
    switchChannel(); // default is general text channel

    // Get user infos
    await getUserData();

    // Create My Peer Object
    peer = await createMyPeer();

    // Preload gif
    preload();

    await serverInit();
    webSocket = await webSocketConnect();
}

async function getUserData() {
    const getUserDataUrl = "/api/user/auth";

    const response = await fetch(getUserDataUrl);
    const data = await response.json();
    userId = data.id;
    username = data.username;
    email = data.email;
    avatar = data.avatar;
    aboutMeContent = data.about_me;
    if (!avatar) {
        updateAvatar("load", avatar);
    } else {
        updateAvatar("update", avatar);
    }

    updateUsername(username);
    updateEmail(email);
    updateAboutMe(aboutMeContent);
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

function updateAboutMe() {
    aboutMe.value = aboutMeContent;
    aboutMePreview.textContent = aboutMeContent;
}

async function createMyPeer() {
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
async function webSocketConnect() {
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
        const sendData = {
            action: "login",
            id: userId,
            username: username,
        };
        webSocket.send(JSON.stringify(sendData));
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
                const members = parsedData.data.general_voice_channel;
                showChannelMember("join_room", members);
            }
            if (parsedData.data.action === "join_room") {
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
                const members = [
                    {
                        peer_username: parsedData.data.peer_username,
                        peer_channel_name: parsedData.data.peer_channel_name,
                        peer_server_id: parsedData.data.peer_server_id,
                    },
                ];
                showChannelMember("leave_room", members);
            }
            if (parsedData.data.action === "server_add_member") {
                loadingServerList(parsedData.data.data);
            }

            if (parsedData.data.action === "server_delete_member") {
                const removedServerName =
                    serverMembers[parsedData.data.server].name;
                const alertMessage = `你被移出了 ${removedServerName} 伺服器。`;
                alert(alertMessage);
                location.reload();
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
    remote += 1;
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

    // size
    videoResize();
    return { remoteVideo: remoteVideo, remoteAudio: remoteAudio };
}

// Delete Video
function deleteVideo(video) {
    remote -= 1;
    const videoWrapper = video.parentNode;
    if (videoWrapper) {
        videoWrapper.parentNode.removeChild(videoWrapper);
        videoResize();
    }
    return;
}

async function getMemberData(username) {
    const response = await fetch(
        `${getMemberDataUrl}?member_username=${username}`
    );
    const data = response.json();
    return data;
}

// Show channel member
function showChannelMember(action, members) {
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

function videoResize() {
    const videoWrappers = document.querySelectorAll(".video-wrapper");
    const numberOfVideoWrappers = videoWrappers.length - 1;
    if (numberOfVideoWrappers === 1 || numberOfVideoWrappers === 2) {
        videoWrappers.forEach((wrapper) => {
            wrapper.style.width = "45%";
        });
    }
    if (numberOfVideoWrappers === 3 || numberOfVideoWrappers === 4) {
        videoWrappers.forEach((wrapper) => {
            wrapper.style.width = "38%";
        });
    }
    if (numberOfVideoWrappers === 5 || numberOfVideoWrappers === 6) {
        videoWrappers.forEach((wrapper) => {
            wrapper.style.width = "32%";
        });
    }
    if (numberOfVideoWrappers === 7 || numberOfVideoWrappers === 8) {
        videoWrappers.forEach((wrapper) => {
            wrapper.style.width = "25%";
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
            return;
        }
        const numberOfVoiceUser = document
            .querySelector(`#voice-channel-server-wrapper-${currentServerId}`)
            .querySelectorAll(".voice-user-wrapper").length;
        if (numberOfVoiceUser > 7) {
            alert("頻道人數過多，請稍後再試");
            location.reload();
            return;
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

// Channel-menu
hamburger.addEventListener("click", () => {
    const menuLayerHTML = `<div class="menu-layer" id="menu-layer"></div>`;
    const channelMenuHTML = `
    <div class="server-menu" id="server-menu">
        <ul>
            <li id="add-member-menu-button">新增其他人</li>
            <li id="remove-member-menu-button">移除成員</li>
            <li id="leave-server-menu-button">退出伺服器</li>
        </ul>
    </div>
    `;
    main.insertAdjacentHTML("beforeend", menuLayerHTML + channelMenuHTML);
    const serverMenu = document.querySelector("#server-menu");
    const menuLayer = document.querySelector("#menu-layer");
    const addMemberBtn = document.querySelector("#add-member-menu-button");
    const removeMemberBtn = document.querySelector(
        "#remove-member-menu-button"
    );
    const leaveServerBtn = document.querySelector("#leave-server-menu-button");
    menuLayer.addEventListener("click", () => {
        menuLayer.remove();
        serverMenu.remove();
    });
    if (serverCreator[currentServerId]) {
        leaveServerBtn.remove();
    } else {
        addMemberBtn.remove();
        removeMemberBtn.remove();
    }

    // Add member into server
    addMemberBtn.addEventListener("click", async () => {
        menuLayer.remove();
        serverMenu.remove();
        const addMemberHTML = `
        <div class="add-member-wrapper" id="add-member-wrapper">
            <div class="add-member-title-div">
                <div class="add-member-title">新增好友到 ${currentServerName} 伺服器</div>
                <div class="editor-close pointer" id="editor-close">
                    <svg class="closeIcon" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
                    </svg>
                </div>
            </div>
            <div class="add-member-name-div">
                <div class="add-member-error">
                    <div class="add-member-error-message"></div>
                </div>
                <div class="add-member-name-title">新增加入的使用者名稱</div>
                <div class="add-member-input-wrapper">
                    <input class="add-member-input" id="add-member-input" />
                </div>
            </div>
            <div class="add-member-submit-div">
                <div class="add-member-submit-button forbidden" id="add-member-submit-button">
                    <div class="add-member-submit-text">新增</div>
                </div>
            </div>
        </div>
        `;
        main.insertAdjacentHTML("beforeend", editLayerHTML + addMemberHTML);
        const closeBtn = document.querySelector("#editor-close");
        const editLayer = document.querySelector("#edit-layer");
        const addMemberWrapper = document.querySelector("#add-member-wrapper");
        const addMemberInput = document.querySelector("#add-member-input");
        const addMemberSubmitBtn = document.querySelector(
            "#add-member-submit-button"
        );
        closeBtn.addEventListener("click", () => {
            editLayer.remove();
            addMemberWrapper.remove();
        });
        editLayer.addEventListener("click", () => {
            editLayer.remove();
            addMemberWrapper.remove();
        });
        addMemberInput.addEventListener("input", () => {
            if (addMemberInput.value === "") {
                addMemberSubmitBtn.classList.add("forbidden");
            } else addMemberSubmitBtn.classList.remove("forbidden");
        });
        addMemberSubmitBtn.addEventListener("click", () => {
            if (isSubmitting) {
                return;
            }
            const regex = /^[A-Za-z0-9]{2,32}$/;
            if (regex.test(addMemberInput.value)) {
                addMember(currentServerId, addMemberInput.value.trim());
                return;
            } else {
                alert("長度必須在 2 和 32 之間，英文及數字組成的使用者名稱。");
                return;
            }
        });
        async function addMember(server, member) {
            isSubmitting = true;
            const info = {
                server: server,
                member: member,
            };
            const options = {
                method: "POST",
                headers: {
                    "X-CSRFToken": token,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(info),
            };
            const response = await fetch(serverMemberAPIUrl, options);
            const data = await response.json();
            if (response.status === 400) {
                const errorMessage = document.querySelector(
                    ".add-member-error-message"
                );
                errorMessage.style.display = "block";
                if (data.message === "The user is not existed") {
                    errorMessage.textContent = ` - 使用者 ${member} 不存在。`;
                } else if (data.message === "Failed to add member") {
                    errorMessage.textContent = ` - 無法新增使用者 ${member}`;
                } else if (
                    data.message === "Member already exists in the server"
                ) {
                    errorMessage.textContent = ` - 使用者 ${member} 已經在伺服器中。`;
                }
            } else if (response.ok) {
                alert(`新增使用者 ${member} 成功！`);
                editLayer.remove();
                addMemberWrapper.remove();
                const memberData = await getMemberData(member);
                if (
                    !serverMembers[server].member.some(
                        (member) => member.username === memberData.username
                    )
                ) {
                    serverMembers[server].member.push(memberData);
                }
                const sendData = {
                    action: "serverAddMember",
                    server: server,
                    username: member,
                };
                webSocket.send(JSON.stringify(sendData));
            }
            isSubmitting = false;
        }
    });
    // Remove member from server
    removeMemberBtn.addEventListener("click", async () => {
        if (isSubmitting) {
            return;
        }
        menuLayer.remove();
        serverMenu.remove();
        const deleteMemberHTML = `
        <div class="delete-member-wrapper" id="delete-member-wrapper">
            <div class="delete-member-title-div">
                <div class="delete-member-title">從 ${currentServerName} 伺服器 移除使用者</div>
                <div class="editor-close pointer" id="editor-close">
                    <svg class="closeIcon" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
                    </svg>
                </div>
            </div>

            <div class="delete-member-list" id="delete-member-list">
            </div>
        </div>
        `;
        main.insertAdjacentHTML("beforeend", editLayerHTML + deleteMemberHTML);
        const closeBtn = document.querySelector("#editor-close");
        const editLayer = document.querySelector("#edit-layer");
        const deleteMemberWrapper = document.querySelector(
            "#delete-member-wrapper"
        );
        closeBtn.addEventListener("click", () => {
            editLayer.remove();
            deleteMemberWrapper.remove();
        });
        editLayer.addEventListener("click", () => {
            editLayer.remove();
            deleteMemberWrapper.remove();
        });
        const deleteMemberList = document.querySelector("#delete-member-list");
        const deleteMemberElement = `
            <div class="delete-member-element" style="justify-content: flex-start;">
                <img id="me-delete-img" src=${url} /><div id="delete-username">${username}</div>
                <svg class="ownerIcon" width="14" height="14" viewBox="0 0 16 16">
                <path d="M13.6572 5.42868C13.8879 5.29002 14.1806 5.30402 14.3973 5.46468C14.6133 5.62602 14.7119 5.90068 14.6473 6.16202L13.3139 11.4954C13.2393 11.7927 12.9726 12.0007 12.6666 12.0007H3.33325C3.02725 12.0007 2.76058 11.792 2.68592 11.4954L1.35258 6.16202C1.28792 5.90068 1.38658 5.62602 1.60258 5.46468C1.81992 5.30468 2.11192 5.29068 2.34325 5.42868L5.13192 7.10202L7.44592 3.63068C7.46173 3.60697 7.48377 3.5913 7.50588 3.57559C7.5192 3.56612 7.53255 3.55663 7.54458 3.54535L6.90258 2.90268C6.77325 2.77335 6.77325 2.56068 6.90258 2.43135L7.76458 1.56935C7.89392 1.44002 8.10658 1.44002 8.23592 1.56935L9.09792 2.43135C9.22725 2.56068 9.22725 2.77335 9.09792 2.90268L8.45592 3.54535C8.46794 3.55686 8.48154 3.56651 8.49516 3.57618C8.51703 3.5917 8.53897 3.60727 8.55458 3.63068L10.8686 7.10202L13.6572 5.42868ZM2.66667 12.6673H13.3333V14.0007H2.66667V12.6673Z" fill="currentColor" />
                </svg>
            </div>
        `;
        deleteMemberList.insertAdjacentHTML("beforeend", deleteMemberElement);
        if (avatar) {
            const img = document.querySelector("#me-delete-img");
            img.src = avatar;
        }
        serverMembers[currentServerId].member.forEach((member) => {
            if (member.username === username) {
                return;
            }
            const deleteMemberElement = `
            <div class="delete-member-element">
                <img id="delete-img" src=${url} /><div id="delete-username">${member.username}</div><div data-delete-button="${member.username}" class="delete-button"><div class="delete-button-text" id="">移除</div></div>
            </div>
            `;
            deleteMemberList.insertAdjacentHTML(
                "beforeend",
                deleteMemberElement
            );
            if (member.avatar) {
                const img = document.querySelector("#delete-username");
                img.src = member.avatar;
            }
        });
        deleteMemberList.addEventListener("click", async (event) => {
            if (event.target.className === "delete-button") {
                const deletedUsername =
                    event.target.getAttribute("data-delete-button");
                const deleteResult = await deleteMember(
                    currentServerId,
                    deletedUsername
                );
                if (deleteResult) {
                    alert(`移除使用者 ${deletedUsername} 成功！`);
                    // editLayer.remove();
                    // deleteMemberWrapper.remove();
                    const index = serverMembers[
                        currentServerId
                    ].member.findIndex(
                        (member) => member.username === deletedUsername
                    );

                    serverMembers[currentServerId].member.splice(index, 1);

                    event.target.parentNode.parentNode.removeChild(
                        event.target.parentNode
                    );

                    const sendData = {
                        action: "serverRemoveMember",
                        username: deletedUsername,
                        serverId: currentServerId,
                    };
                    webSocket.send(JSON.stringify(sendData));
                }
            }
        });

        async function deleteMember(server, member) {
            isSubmitting = true;
            const info = {
                server: server,
                member: member,
            };
            const options = {
                method: "DELETE",
                headers: {
                    "X-CSRFToken": token,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(info),
            };
            const response = await fetch(serverMemberAPIUrl, options);
            const data = await response.json();
            isSubmitting = false;
            return response.ok;
        }
    });
    leaveServerBtn.addEventListener("click", async () => {
        menuLayer.remove();
        serverMenu.remove();
        const leaveServerHTML = `
        <div class="leave-server-wrapper" id="leave-server-wrapper">
            <div class="leave-server-title-div">
                <div class="leave-server-title">從 ${currentServerName} 伺服器 離開</div>
            </div>

            <div class="leave-server-content">您確定您要退出 ${currentServerName}伺服器？ 您將無法重新進入此伺服器，除非您被重新加入。</div>
            <div class="leave-server-confirm-div">
                <div class="cancel-button" id="cancel-button">
                    <div class="cancel-button-text">取消</div>
                </div>
                <div class="leave-server-button" id="leave-server-button">
                    <div class="leave-server-button-text">退出伺服器</div>
                </div>
            </div>
        </div>
        `;
        main.insertAdjacentHTML("beforeend", editLayerHTML + leaveServerHTML);
        const cancelBtn = document.querySelector("#cancel-button");
        const editLayer = document.querySelector("#edit-layer");
        const leaveServerWrapper = document.querySelector(
            "#leave-server-wrapper"
        );
        const leaveServerBtn = document.querySelector("#leave-server-button");
        cancelBtn.addEventListener("click", () => {
            editLayer.remove();
            leaveServerWrapper.remove();
        });
        editLayer.addEventListener("click", () => {
            editLayer.remove();
            leaveServerWrapper.remove();
        });
        leaveServerBtn.addEventListener("click", () => {
            if (isSubmitting) {
                return;
            } else {
                leaveServer();
            }
        });
        async function leaveServer() {
            isSubmitting = true;
            const info = {
                server: currentServerId,
                member: username,
            };
            const options = {
                method: "DELETE",
                headers: {
                    "X-CSRFToken": token,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(info),
            };
            const response = await fetch(serverMemberAPIUrl, options);
            const data = await response.json();
            if (response.ok) {
                location.reload();
            }
            isSubmitting = false;
        }
    });
});

messagesUlWrapper.addEventListener("click", async (event) => {
    if (event.target.classList.contains("message-user")) {
        const cardData = {};
        if (event.target.classList[1] === username) {
            cardData.username = username;
            cardData.avatar = avatar;
            cardData.aboutMe = aboutMeContent;
        } else {
            const data = await getMemberData(event.target.classList[1]);
            cardData.username = data.username;
            cardData.avatar = data.avatar;
            cardData.aboutMe = data.about_me;
        }
        if (!cardData.avatar) {
            cardData.avatar = url;
        }
        const mainCardHTML = `
        <div class="main-card" id="main-card">
            <div class="main-card-profile-card">
                <div class="main-card-decorator-bar"></div>
                <div class="main-card-avatar-wrapper">
                    <img id="main-card-avatar-img" src="${cardData.avatar}">
                </div>
                <div class="main-card-user-background">
                    <div class="main-card-username-wrapper">
                        <div class="main-card-username" id="main-card-username">${cardData.username}</div>
                    </div>
                    <div class="main-card-aboutme">
                        <div class="main-card-aboutme-title">關於我</div>
                        <div class="main-card-aboutme-content">${cardData.aboutMe}</div>
                    </div>
                </div>
            </div>
        </div>
        `;
        const cardLayerHTML = `<div class="menu-layer" id="menu-layer"></div>`;
        main.insertAdjacentHTML("beforeend", cardLayerHTML + mainCardHTML);
        const cardLayer = document.querySelector("#menu-layer");
        const mainCard = document.querySelector("#main-card");
        cardLayer.addEventListener("click", () => {
            cardLayer.remove();
            mainCard.remove();
        });
    }
});

avatarWrapper.addEventListener("click", () => {
    let myAvatar;
    if (!avatar) {
        myAvatar = url;
    } else {
        myAvatar = avatar;
    }
    const mainCardHTML = `
        <div class="main-card" id="main-card" style="bottom: 62px; top: unset; transform: unset; left: 52px">
            <div class="main-card-profile-card">
                <div class="main-card-decorator-bar"></div>
                <div class="main-card-avatar-wrapper">
                    <img id="main-card-avatar-img" src="${myAvatar}">
                </div>
                <div class="main-card-user-background">
                    <div class="main-card-username-wrapper">
                        <div class="main-card-username" id="main-card-username">${username}</div>
                    </div>
                    <div class="main-card-aboutme">
                        <div class="main-card-aboutme-title">關於我</div>
                        <div class="main-card-aboutme-content">${aboutMeContent}</div>
                    </div>
                </div>
            </div>
        </div>
        `;
    const cardLayerHTML = `<div class="menu-layer" id="menu-layer"></div>`;
    main.insertAdjacentHTML("beforeend", cardLayerHTML + mainCardHTML);
    const cardLayer = document.querySelector("#menu-layer");
    const mainCard = document.querySelector("#main-card");
    cardLayer.addEventListener("click", () => {
        cardLayer.remove();
        mainCard.remove();
    });
});

// Init

init();
