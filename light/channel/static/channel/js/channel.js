let isSocketConnect = false;
let peer;
let userId;
let username;
let peerId;
const channelMap = {};
let currentInChanneL;
let clickedChannel;
const settingUnmuteSvg = document.querySelector("#setting-unmute-svg");
const settingMuteSvg = document.querySelector("#setting-mute-svg");
let localStream = null;

// Channel label views
const messageList = document.querySelector("#message-list");
let channelActive = document.querySelector(".channel-active");
const chatPage = document.querySelector(".chat");
const videoPage = document.querySelector(".video");
const onePeopleVideo = document.querySelector(".one-people-video");

function switchChannel() {
    if (channelActive.id === "general-chat-channel") {
        chatPage.style.display = "flex";
        videoPage.style.display = "none";
    }

    if (channelActive.id === "general-video-channel") {
        videoPage.style.display = "block";
        chatPage.style.display = "none";
    }
}

const channelList = document.querySelector(".channel-list");
const channelNameLabel = document.querySelectorAll(".channel-name-label");
channelList.addEventListener("click", (event) => {
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

function init() {
    switchChannel(); // default is general text channel

    // Get user infos
    getUserData();

    // Get chat logs
    getChatLogs().then((chatLogs) => {
        // Show chat logs
        createChatLogs(chatLogs);
    });

    // Create My Peer Object
    peer = createMyPeer();

    // Default media toggle
    settingMuteSvg.style.display = "none";
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

init();

// Join Voice Channel
function joinVoiceChannel() {
    // Change my already in Channel Name
    currentInChanneL = "general-video-channel";

    // Send my peerId, (Light)userId, (Light)username to existing Members(ask for connecting)
    const sendData = {
        action: "peer",
        peerId: peerId,
        id: userId,
        username: username,
    };
    webSocket.send(JSON.stringify(sendData));

    // Listen on WebSocket message
    webSocket.addEventListener("message", (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === "sdp") {
            const action = parsedData["data"]["action"];

            // be asked for connecting
            if (action === "peer") {
                const newPeerId = parsedData["data"]["peer_id"];
                const peerUsername = parsedData["data"]["peer_username"];
                const userId = parsedData["data"]["user_id"];
                const peerChannelName = parsedData["data"]["peer_channel_name"];
                if (peerId === newPeerId) {
                    // do nothing with myself join message(ask for connecting)
                    return;
                }
                // Existing members track the new member
                channelMap[`${peerChannelName}`] = {
                    peerUsername: peerUsername,
                    peerId: newPeerId,
                    userId: userId,
                };
                if (Object.keys(channelMap).length !== 0) {
                    onePeopleVideo.style.display = "none";
                }
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
                const remoteVideo = createRemoteVideo(peerUsername);
                call.on("stream", (stream) => {
                    remoteVideo.srcObject = stream;
                });
                // });
                // conn.on("close", () => {
                //     console.log("我們的好朋友", conn.label, "離開了");
                //     const videoId = `#${conn.label}-video`;
                //     const closeVideo = document.querySelector(videoId);
                //     removeVideo(closeVideo);
                // });
            }

            if (action === "answer") {
                const existingPeerId = parsedData["data"]["peer_id"];
                const peerUsername = parsedData["data"]["peer_username"];
                const userId = parsedData["data"]["user_id"];
                const peerChannelName =
                    parsedData["data"]["answer_channel_name"];
                peerUsernameInRemoteVideo = peerUsername;
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
                    removeVideo(leaveUserVideo);
                }

                delete channelMap[`${peerChannelName}`];
                if (Object.keys(channelMap).length === 0) {
                    onePeopleVideo.style.display = "block";
                }
            }
        }
    });

    // *new-peer just joining the room * Listen to existing members connections
    let peerUsernameInRemoteVideo;
    let remoteVideo;
    const localStream = createLocalStream();
    peer.on("call", (call) => {
        console.log("on call!!!!!!!!!!!!!!!!!1");
        call.answer(localStream);
        remoteVideo = createRemoteVideo(peerUsernameInRemoteVideo);

        call.on("stream", (stream) => {
            remoteVideo.srcObject = stream;
        });
        call.on("error", (e) => {
            console.log(e);
        });
        call.on("close", () => {
            console.log("dc closed");
        });
    });
    peer.on("close", () => {
        console.log("peer on closed!!!!!!!");
    });
    peer.on("disconnected", () => {
        console.log("peer on disconnected");
    });
}
const generalVideoChannel = document.querySelector("#general-video-channel");
generalVideoChannel.addEventListener("click", () => {
    if (isSocketConnect === true) {
        clickedChannel = "general-video-channel";

        // been joined channel and the current channel cannot be the same
        if (currentInChanneL === clickedChannel) {
            console.log("already in this channel");
        }
        if (currentInChanneL !== clickedChannel) {
            joinVoiceChannel();
        }
    }
});

// Functions
async function getUserData() {
    const getUserDataUrl = "/api/account";

    const response = await fetch(getUserDataUrl);
    const data = await response.json();
    userId = data.id;
    username = data.username;

    // Show username in setting zone
    const usernameContainer = document.querySelector(".username-container");
    usernameContainer.textContent = username;
}

// Chat Logs
// Get history chat logs when user logs in
async function getChatLogs() {
    const getChatLogsUrl = "/api/chat_logs";
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
        const messageDiv = document.createElement("div");
        const messageContentDiv = document.createElement("div");
        const messageUserAvatar = document.createElement("img");
        const messageHeader = document.createElement("div");
        const messageUser = document.createElement("span");
        const messageTime = document.createElement("span");
        const messageContent = document.createElement("div");

        messageList.appendChild(messageDiv);
        messageDiv.appendChild(messageContentDiv);
        messageContentDiv.appendChild(messageUserAvatar);
        messageContentDiv.appendChild(messageHeader);
        messageContentDiv.appendChild(messageContent);
        messageHeader.appendChild(messageUser);
        messageHeader.appendChild(messageTime);

        messageDiv.className = "message-div";
        messageUserAvatar.className = "message-user-avatar";
        messageContentDiv.className = "message-content-div";
        messageHeader.className = "message-header";
        messageUser.className = "message-user";
        messageTime.className = "message-time";
        messageContent.className = "message-content";

        messageUser.textContent = chatLog["username"];
        messageContent.textContent = chatLog["message"];

        // Avatar
        messageUserAvatar.src = url;

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
    });
}

// WebSocket
const webSocket = webSocketConnect();

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

    // Listen to chat message
    webSocket.addEventListener("message", (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === "message") {
            const arr = [parsedData.data];
            createChatLogs(arr);
        }
    });

    // Listen to close event
    webSocket.addEventListener("close", (event) => {
        isSocketConnect = false;
        console.log("WebSocket close", "connection closed!", event);
    });

    // Listen to error event
    webSocket.addEventListener("error", (event) => {
        console.log("WebSocket error", "error!", event);
    });

    return webSocket;
}

// Send Chat Message via WebSocket
const messageInput = document.querySelector("#message-input");
messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && isSocketConnect) {
        const messageValue = messageInput.value;
        send_message(messageValue);
        messageInput.value = "";
    }
});

function send_message(message) {
    if (message !== "") {
        const sendData = {
            action: "message",
            id: userId,
            message: message,
        };
        webSocket.send(JSON.stringify(sendData));
    }
}

// Stream
// Local Video
function createLocalStream() {
    localStream = new MediaStream();
    const localVideo = document.querySelector("#local-video");
    const cameraBtn = document.querySelector("#camera-btn");
    const audioBtn = document.querySelector("#audio-btn");
    const leaveBtn = document.querySelector("#leave-btn");
    const audioOnSvg = document.querySelector("#audio-on-svg");
    const audioOffSvg = document.querySelector("#audio-off-svg");

    let videoTracks;
    let audioTracks;

    cameraBtn.classList.add("camera-active");
    audioBtn.classList.add("audio-active");
    audioOffSvg.style.display = "none";

    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: true,
        })
        .then(async (localMedia) => {
            audioTracks = localMedia.getAudioTracks();
            videoTracks = localMedia.getVideoTracks();
            localStream.addTrack(audioTracks[0]);
            localStream.addTrack(videoTracks[0]);
            audioTracks[0].enabled = true;
            videoTracks[0].enabled = true;
        });

    function cameraBtnClick() {
        videoTracks[0].enabled = !videoTracks[0].enabled;

        if (videoTracks[0].enabled) {
            localVideo.style.display = "block";
            cameraBtn.classList.add("camera-active");
        } else {
            localVideo.style.display = "none";
            cameraBtn.classList.remove("camera-active");
        }
    }
    cameraBtn.addEventListener("click", cameraBtnClick);

    audioBtn.addEventListener("click", (e) => {
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
    });

    leaveBtn.addEventListener("click", (event) => {
        peer.destroy();
        // const sendData = {
        //     action: "leave",
        // };
        // webSocket.send(JSON.stringify(sendData));

        // // Stop local stream
        // if (localStream) {
        //     localStream.getTracks().forEach((track) => {
        //         track.stop();
        //     });
        //     localStream = null;
        // }

        // // Delete remote video
        // Object.keys(channelMap).forEach((key) => {
        //     const remoteVideo = document.querySelector(
        //         `#${channelMap[key]["peerUsername"]}-video`
        //     );
        //     removeVideo(remoteVideo);
        //     delete channelMap[key];
        // });
        // if (Object.keys(channelMap).length === 0) {
        //     onePeopleVideo.style.display = "block";
        // }

        location.reload();
    });

    localVideo.srcObject = localStream;
    localVideo.muted = true;

    // Name label
    const localVideoWrapper = document.querySelector(".local-video-wrapper");
    const channelUsernameLabel = document.createElement("div");
    channelUsernameLabel.className = "channel-username-label";
    localVideoWrapper.appendChild(channelUsernameLabel);
    channelUsernameLabel.textContent = username;

    return localStream;
}

// RemoTe Video
function createRemoteVideo(peerUsername) {
    const videos = document.querySelector(".videos");
    const videoWrapper = document.createElement("div");
    const remoteVideo = document.createElement("video");

    videos.appendChild(videoWrapper);
    videoWrapper.appendChild(remoteVideo);

    videoWrapper.className = "video-wrapper";
    remoteVideo.id = `${peerUsername}-video`;

    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;

    // Name label
    const channelPeerNameLabel = document.createElement("div");
    channelPeerNameLabel.className = "channel-username-label";
    videoWrapper.appendChild(channelPeerNameLabel);
    channelPeerNameLabel.textContent = peerUsername;

    return remoteVideo;
}

// RemoVe Video
function removeVideo(video) {
    const videoWrapper = video.parentNode;
    if (videoWrapper) {
        videoWrapper.parentNode.removeChild(videoWrapper);
    }
    return;
}

/*








*/
// // let peer;
// const configuration = {
//     iceServers: [
//         {
//             urls: [
//                 "stun:stun.l.google.com:19302",
//                 "stun:stun1.l.google.com:19302",
//                 // "stun:stun2.l.google.com:19302",
//             ],
//         },
//     ],
// };

// // create offer
// function createOffer(peerUsername, receiverChannelName) {
//     const peer = new RTCPeerConnection(configuration);

//     // add local tracks
//     addLocalTracks(peer);

//     const dc = peer.createDataChannel("channel");
//     dc.addEventListener("open", () => {
//         console.log("create offer open dc");
//     });

//     const remoteVideo = createRemoteVideo(peerUsername);
//     setOnTrack(peer, remoteVideo);

//     mapPeers[peerUsername] = [peer, dc];

//     peer.addEventListener("iceconnectionstatechange", () => {
//         const iceConnectionState = peer.iceConnectionState;
//         console.log(111, iceConnectionState);

//         if (
//             iceConnectionState === "failed" ||
//             iceConnectionState === "disconnected" ||
//             iceConnectionState === "closed"
//         ) {
//             delete mapPeers[peerUsername];

//             if (iceConnectionState !== "closed") {
//                 peer.close();
//             }

//             removeVideo(remoteVideo);
//         }
//     });

//     peer.addEventListener("icecandidate", (e) => {
//         if (e.candidate) {
//             console.log("new ice candidate");

//             return;
//         }

//         sendSignal("new-offer", username, {
//             sdp: peer.localDescription,
//             receiver_channel_name: receiverChannelName,
//         });
//     });

//     peer.createOffer()
//         .then((offer) => {
//             peer.setLocalDescription(offer);
//         })
//         .then(() => {
//             console.log("setLocalDescription set successfully");
//         });
// }

// // Add Local Tracks
// function addLocalTracks(peer) {
//     localStream.getTracks().forEach((track) => {
//         peer.addTrack(track, localStream);
//     });

//     return;
// }

// // Set On Track
// function setOnTrack(peer, remoteVideo) {
//     const remoteStream = new MediaStream();

//     remoteVideo.srcObject = remoteStream;

//     peer.addEventListener("track", async (event) => {
//         remoteStream.addTrack(event.track, remoteStream);
//     });
// }

// // Create Answer
// function createAnswer(sdp, peerUsername, receiverChannelName) {
//     const peer = new RTCPeerConnection(configuration);

//     // add local tracks
//     addLocalTracks(peer);

//     const remoteVideo = createRemoteVideo(peerUsername);
//     setOnTrack(peer, remoteVideo);

//     peer.addEventListener("datachannel", (e) => {
//         peer.dc = e.channel;
//         peer.dc.addEventListener("open", () => {
//             console.log("ans open dc");
//         });

//         mapPeers[peerUsername] = [peer, peer.dc];
//     });

//     peer.addEventListener("iceconnectionstatechange", () => {
//         const iceConnectionState = peer.iceConnectionState;
//         console.log(iceConnectionState);

//         if (
//             iceConnectionState === "failed" ||
//             iceConnectionState === "disconnected" ||
//             iceConnectionState === "closed"
//         ) {
//             delete mapPeers[peerUsername];

//             if (iceConnectionState !== "closed") {
//                 peer.close();
//             }
//             removeVideo(remoteVideo);
//         }
//     });

//     peer.addEventListener("icecandidate", (event) => {
//         if (event.candidate) {
//             console.log("new ice candidate");

//             return;
//         }
//     });

//     peer.setRemoteDescription(sdp)
//         .then(() => {
//             console.log(
//                 `remote description set successfully for ${peerUsername}`
//             );

//             return peer.createAnswer();
//         })
//         .then((a) => {
//             console.log("ans created");

//             peer.setLocalDescription(a);
//         })
//         .then(() => {
//             sendSignal("new-answer", username, {
//                 sdp: peer.localDescription,
//                 receiver_channel_name: receiverChannelName,
//             });
//         });
// }

// function sendSignal(action, username, message) {
//     const sendData = {
//         action: action,
//         username: username,
//         message: message,
//     };
//     webSocket.send(JSON.stringify(sendData));
// }
