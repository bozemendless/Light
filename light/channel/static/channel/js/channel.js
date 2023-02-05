let is_socket_connect = false;
let userId;
const messageList = document.querySelector("#message-list");

// Get user infos
getUserData();

// Get chat logs
getChatLogs().then((chatLogs) => {
    // Show chat logs
    createChatLogs(chatLogs);
});

// Functions
async function getUserData() {
    const getUserDataUrl = "/api/account";

    const response = await fetch(getUserDataUrl);
    const data = await response.json();
    userId = data.id;
}

async function getChatLogs() {
    const getChatLogsUrl = "/api/chat_logs";
    const response = await fetch(getChatLogsUrl);
    const data = await response.json();
    return data.data;
}

function createChatLogs(data) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const options = { hour: "2-digit", minute: "2-digit" };

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

        // Img
        messageUserAvatar.src = url;

        // Display time
        const chatTime = new Date(chatLog["time"]);
        let displayTime;

        if (chatTime.toDateString() === today.toDateString()) {
            displayTime = `今天 ${chatTime.getHours()}:${chatTime.getMinutes()}`;
        } else if (chatTime.toDateString() === yesterday.toDateString()) {
            displayTime = `昨天 ${chatTime.getHours()}:${chatTime.getMinutes()}`;
        } else {
            displayTime = `${chatTime.getFullYear()}-${
                chatTime.getMonth() + 1
            }-${chatTime.getDate()} ${chatTime.getHours()}:${chatTime.getMinutes()}`;
        }

        messageTime.textContent = displayTime;
    });
}

const webSocket = webSocketConnect();

// WebSocket

function webSocketConnect() {
    let wsStart = "ws://";
    if (window.location.protocol === "https:") {
        wsStart = "wss://";
    }
    const endpoint = `${wsStart}${window.location.host}${window.location.pathname}ws`;
    const webSocket = new WebSocket(endpoint);
    webSocket.addEventListener("open", (event) => {
        console.log("webSocket connected");
        is_socket_connect = true;

        // sendSignal("new peer", {});
    });

    // webSocket.addEventListener("message", webSocketOnMessage);
    webSocket.addEventListener("message", (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === "message") {
            const arr = [parsedData.data];
            createChatLogs(arr);
        }
    });

    webSocket.addEventListener("close", (event) => {
        is_socket_connect = false;
        console.log("WebSocket close", "connection closed!", event);
    });

    webSocket.addEventListener("error", (event) => {
        console.log("WebSocket error", "error!", event);
    });

    return webSocket;
}

const messageInput = document.querySelector("#message-input");
messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && is_socket_connect) {
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

// let username;
// const btnJoin = document.querySelector("#btn-join");
// const mapPeers = {};
// let configuration;

// const localVideo = document.querySelector("#local-video");
// const btnToggleAudio = document.querySelector("#btn-toggle-audio");
// const btnToggleVideo = document.querySelector("#btn-toggle-video");
// Stream
// function webSocketOnMessage(event) {
// const parsedData = JSON.parse(event.data);
// const peerUsername = parsedData["peer"];
// const action = parsedData["action"];
// if (username === peerUsername) {
//     return;
// }
// const receiver_channel_name =
//     parsedData["message"]["receiver_channel_name"];
// if (action === "new peer") {
//     createOfferer(peerUsername, receiver_channel_name);
//     return;
// }
// if (action === "new-offer") {
//     const offer = parsedData["message"]["sdp"];
//     createAnswerer(offer, peerUsername, receiver_channel_name);
//     return;
// }
// if (action === "new-answer") {
//     const answer = parsedData["message"]["sdp"];
//     const peer = mapPeers[peerUsername][0];
//     peer.setRemoteDescription(answer);
//     return;
// }
// }

// btnJoin.addEventListener("click", () => {
//     username = usernameInput.value;

//     if (username == "") {
//         return;
//     }

//     usernameInput.value = "";
//     usernameInput.disable = true;
//     usernameInput.style.visibility = "hidden";

//     // btnJoin.style.visibility = "hidden";

//     localVideo.style.display = "block";
//     btnToggleAudio.style.display = "block";
//     btnToggleVideo.style.display = "block";

//     const labelUsername = document.querySelector("#label-username");
//     labelUsername.textContent = username;
// });

// Get stream
// let localStream = new MediaStream();

// const constraints = {
//     video: true,
//     audio: true,
// };

// const userMedia = navigator.mediaDevices
//     .getUserMedia(constraints)
//     .then((stream) => {
//         localStream = stream;
//         localVideo.srcObject = localStream;
//         localVideo.muted = true;

//         const audioTracks = stream.getAudioTracks();
//         const videoTracks = stream.getVideoTracks();

//         audioTracks[0].enabled = true;
//         videoTracks[0].enabled = true;

//         btnToggleAudio.addEventListener("click", () => {
//             audioTracks[0].enabled = !audioTracks[0].enabled;

//             if (audioTracks[0].enabled) {
//                 btnToggleAudio.textContent = "🔈 Mute";

//                 return;
//             }

//             btnToggleAudio.textContent = "🔈 Unmute";
//         });

//         btnToggleVideo.addEventListener("click", () => {
//             videoTracks[0].enabled = !videoTracks[0].enabled;

//             if (videoTracks[0].enabled) {
//                 btnToggleVideo.textContent = "📹 Off";

//                 return;
//             }

//             btnToggleVideo.textContent = "📹 On";
//         });
//     })
//     .catch((error) => {
//         console.log("error accessing media devices", error);
//     });

// function sendSignal(action, message) {
//     // our username is same for now so don't need to have username in arguments

//     const jsonStr = JSON.stringify({
//         peer: username,
//         action: action,
//         message: message,
//     });

//     console.log("sendSignal");

//     webSocket.send(jsonStr);
// }

// // CreateOfferer
// function createOfferer(peerUsername, receiver_channel_name) {
//     fetch("/api/token")
//         .then((res) => {
//             return res.json();
//         })
//         .then((data) => {
//             configuration = data;
//         })
//         .then(() => {
//             console.log("create offer conf", configuration);
//             const peer = new RTCPeerConnection(configuration); // same network

//             addLocalTracks(peer);

//             const dataChannel = peer.createDataChannel("channel");
//             dataChannel.addEventListener("open", () => {
//                 console.log("Offer dataChannel", "connection opened!");
//             });

//             dataChannel.addEventListener("message", dataChannelOnMessage);

//             const remoteVideo = createVideo(peerUsername);
//             setOnTrack(peer, remoteVideo);

//             mapPeers[peerUsername] = [peer, dataChannel];

//             peer.addEventListener("iceconnectionstatechange", () => {
//                 const iceConnectionState = peer.iceConnectionState;

//                 if (
//                     iceConnectionState === "failed" ||
//                     iceConnectionState === "disconnected" ||
//                     iceConnectionState === "closed"
//                 ) {
//                     delete mapPeers[peerUsername];

//                     if (iceConnectionState !== "closed") {
//                         peer.close();
//                     }

//                     removeVideo(remoteVideo);
//                 }
//             });

//             peer.addEventListener("icecandidate", (e) => {
//                 if (e.candidate) {
//                     console.log("offer new icecandidate");
//                     dataChannel.send({ "new-ice-candidate": e.candidate });
//                 }

//                 sendSignal("new-offer", {
//                     sdp: peer.localDescription,
//                     receiver_channel_name: receiver_channel_name,
//                 });
//             });

//             peer.createOffer()
//                 .then((offer) => peer.setLocalDescription(offer))
//                 .then(() => {
//                     console.log("offer Local description set successfully");
//                 });
//         });
// }
// // CreateAnswerer
// function createAnswerer(offer, peerUsername, receiver_channel_name) {
//     // const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
//     fetch("/api/token")
//         .then((res) => {
//             return res.json();
//         })
//         .then((data) => {
//             configuration = data;
//         })
//         .then(() => {
//             console.log("create ans conf", configuration);
//             const peer = new RTCPeerConnection(configuration);

//             addLocalTracks(peer);

//             const remoteVideo = createVideo(peerUsername);
//             setOnTrack(peer, remoteVideo);

//             peer.addEventListener("datachannel", (e) => {
//                 peer.dataChannel = e.channel;
//                 peer.dataChannel.addEventListener("open", () => {
//                     console.log("answer dataChannel", "connection opened!");
//                 });
//                 peer.dataChannel.addEventListener(
//                     "message",
//                     dataChannelOnMessage
//                 );

//                 mapPeers[peerUsername] = [peer, peer.dataChannel];
//             });

//             peer.addEventListener("iceconnectionstatechange", () => {
//                 const iceConnectionState = peer.iceConnectionState;
//                 console.log(iceConnectionState);

//                 if (
//                     iceConnectionState === "failed" ||
//                     iceConnectionState === "disconnected" ||
//                     iceConnectionState === "closed"
//                 ) {
//                     delete mapPeers[peerUsername];

//                     if (iceConnectionState !== "closed") {
//                         peer.close();
//                     }

//                     removeVideo(remoteVideo);
//                 }
//             });

//             peer.addEventListener("icecandidate", (event) => {
//                 if (event.candidate) {
//                     console.log("ans new icecandidate");

//                     return;
//                 }

//                 sendSignal("new-answer", {
//                     sdp: peer.localDescription,
//                     receiver_channel_name: receiver_channel_name,
//                 });
//             });

//             peer.setRemoteDescription(offer)
//                 .then(() => {
//                     console.log(
//                         `ans Remote description set successfully for ${peerUsername}`
//                     );

//                     return peer.createAnswer();
//                 })
//                 .then((answer) => {
//                     console.log("answer created");

//                     peer.setLocalDescription(answer);
//                 });
//         });
// }

// function addLocalTracks(peer) {
//     localStream.getTracks().forEach((track) => {
//         peer.addTrack(track, localStream);
//     });

//     return;
// }

// const messageList = document.querySelector("#message-list");
// function dataChannelOnMessage(event) {
//     const message = event.data;
//     const list = document.createElement("li");
//     list.textContent = message;
//     messageList.appendChild(list);
//     try {
//         peer.addIceCandidate(message.iceCandidate);
//     } catch (e) {
//         console.error("Error adding received ice candidate", e);
//     }
// }

// function createVideo(peerUsername) {
//     const videosContainer = document.querySelector(".videos-container");

//     const videoContainer = document.createElement("div");
//     videoContainer.className = "video-container";
//     // const videoContainer = document.querySelector("#video-container");
//     const remoteVideo = document.createElement("video");

//     remoteVideo.id = `${peerUsername}-video`;
//     remoteVideo.autoplay = true;
//     remoteVideo.playsInline = true;
//     remoteVideo.className = "video";

//     const videoWrapper = document.createElement("div");
//     videoWrapper.className = "video-wrapper";

//     videosContainer.appendChild(videoContainer);
//     videoContainer.appendChild(videoWrapper);
//     videoWrapper.appendChild(remoteVideo);
//     videoContainer.appendChild(videoWrapper);

//     return remoteVideo;
// }

// function setOnTrack(peer, remoteVideo) {
//     const remoteStream = new MediaStream();

//     remoteVideo.srcObject = remoteStream;

//     peer.addEventListener("track", async (event) => {
//         remoteStream.addTrack(event.track, remoteStream);
//     });
// }

// function removeVideo(video) {
//     const videoWrapper = video.parentNode;

//     videoWrapper.parentNode.removeChild(videoWrapper);
// }
