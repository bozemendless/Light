const mapPeers = {};

const usernameInput = document.querySelector("#username");
const btnJoin = document.querySelector("#btn-join");

let username;

let webSocket;

const localVideo = document.querySelector("#local-video");
const btnToggleAudio = document.querySelector("#btn-toggle-audio");
const btnToggleVideo = document.querySelector("#btn-toggle-video");

function webSocketOnMessage(event) {
    const parsedData = JSON.parse(event.data);
    const peerUsername = parsedData['peer'];
    const action = parsedData["action"];

    if (username === peerUsername) {
        return;
    }

    const receiver_channel_name = parsedData["message"]["receiver_channel_name"]

    if (action === "new peer") {
        createOfferer(peerUsername, receiver_channel_name);

        return;
    }

    if (action === "new-offer") {
        const offer = parsedData["message"]["sdp"];

        createAnswerer(offer, peerUsername, receiver_channel_name);

        return;
    }

    if (action === "new-answer") {
        const answer = parsedData["message"]["sdp"];

        const peer = mapPeers[peerUsername][0];

        peer.setRemoteDescription(answer);

        return;
    }
}

btnJoin.addEventListener("click", () => {
    username = usernameInput.value;

    if (username == "") {
        return;
    }

    usernameInput.value = "";
    usernameInput.disable = true;
    usernameInput.style.visibility = "hidden";

    // btnJoin.style.visibility = "hidden";

    localVideo.style.display = "block";
    btnToggleAudio.style.display = "block";
    btnToggleVideo.style.display = "block";

    const labelUsername = document.querySelector("#label-username");
    labelUsername.textContent = username;

    let wsStart = "ws://";

    if (window.location.protocol === "https://") {
        wsStart = "wss://";
    }

    const endpoint = wsStart + window.location.host + window.location.pathname;

    console.log(endpoint);

    webSocket = new WebSocket(endpoint);

    webSocket.addEventListener("open", event => {
        console.log("connection opened!")

        sendSignal("new peer", {});
    })

    webSocket.addEventListener("message", webSocketOnMessage);
    
    webSocket.addEventListener("close", event => {
        console.log("connection closed!");
    });

    webSocket.addEventListener("error", event => {
        console.log("error!");
    });
})

let localStream = new MediaStream();

const constraints = {
    "video": true,
    "audio": true
};

const userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;

        const audioTracks = stream.getAudioTracks();
        const videoTracks = stream.getVideoTracks();

        audioTracks[0].enabled = true;  
        videoTracks[0].enabled = true;

        btnToggleAudio.addEventListener("click", () => {
            audioTracks[0].enabled = !audioTracks[0].enabled;

            if (audioTracks[0].enabled) {
                btnToggleAudio.textContent = "🔈 Mute";
                
                return;
            }

            btnToggleAudio.textContent = "🔈 Unmute";
        })

        btnToggleVideo.addEventListener("click", () => {
            videoTracks[0].enabled = !videoTracks[0].enabled;

            if (videoTracks[0].enabled) {
                btnToggleVideo.textContent = "📹 Off";
                
                return;
            }

            btnToggleVideo.textContent = "📹 On";
        })

    })
    .catch(error => {
        console.log("error accessing media devices", error);
    })

function sendSignal(action, message) { // our username is same for now so don't need to have username in arguments

    const jsonStr = JSON.stringify({
        "peer": username,
        "action": action,
        "message": message
    });

    webSocket.send(jsonStr);
}

// CreateOfferer
function createOfferer(peerUsername, receiver_channel_name) {
    const peer = new RTCPeerConnection(null); // same network

    addLocalTracks(peer);

    const dataChannel = peer.createDataChannel("channel");
    dataChannel.addEventListener("open", () => {
        console.log("connection opened!");
    });

    dataChannel.addEventListener("message", dataChannelOnMessage)

    const remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dataChannel];

    peer.addEventListener("iceconnectionstatechange", () => {
        const iceConnectionState = peer.iceConnectionState;

        if(iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
            delete mapPeers[peerUsername];

            if (iceConnectionState !== "closed") {
                peer.close();
            }

            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener("icecandidate", e => {
        if (e.candidate) {
            console.log("new icecandidate", JSON.stringify(peer.localDescription));

            return;
        }

        sendSignal("new-offer", {
            "sdp": peer.localDescription,
            "receiver_channel_name": receiver_channel_name
        });
    });

    peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
            console.log("Local description set successfully"); 
        })
}
// CreateAnswerer
function createAnswerer(offer, peerUsername, receiver_channel_name) {
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peer = new RTCPeerConnection(configuration); // same network

    addLocalTracks(peer);

    const remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener("datachannel", e => {
        peer.dataChannel = e.channel
        peer.dataChannel.addEventListener("open", () => {
            console.log("connection opened!");
        });
        peer.dataChannel.addEventListener("message", dataChannelOnMessage);

        mapPeers[peerUsername] = [peer, peer.dataChannel];
    })



    peer.addEventListener("iceconnectionstatechange", () => {
        const iceConnectionState = peer.iceConnectionState;
        console.log(iceConnectionState);

        if (
            iceConnectionState === "failed" ||
            iceConnectionState === "disconnected" ||
            iceConnectionState === "closed"
            ) {
                delete mapPeers[peerUsername];

                if (iceConnectionState !== "closed") {
                    peer.close();
                }

                removeVideo(remoteVideo);
        }
    });

    peer.addEventListener("icecandidate", (event) => {
        if (event.candidate) {
            console.log("new icecandidate", JSON.stringify(peer.localDescription));

            return;
        }

        sendSignal("new-answer", {
            sdp: peer.localDescription,
            receiver_channel_name: receiver_channel_name
        });
    });

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log(`Remote description set successfully for ${peerUsername}`)

            return peer.createAnswer();
        })
        .then(answer => {
            console.log("answer created");

            peer.setLocalDescription(answer);
        })

}


function addLocalTracks(peer) {
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });

    return;
}

const messageList = document.querySelector("#message-list");
function dataChannelOnMessage(event) {
    const message = event.data;
    const list = document.createElement("li");
    list.textContent = message;
    messageList.appendChild(list);

}

function createVideo(peerUsername) {
    const videosContainer = document.querySelector(".videos-container");

    const videoContainer = document.createElement("div");
    videoContainer.className = "video-container";
    // const videoContainer = document.querySelector("#video-container");
    const remoteVideo = document.createElement("video");

    remoteVideo.id = `${peerUsername}-video`;
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    remoteVideo.className = "video";

    const videoWrapper = document.createElement("div");
    videoWrapper.className = "video-wrapper"

    videosContainer.appendChild(videoContainer);
    videoContainer.appendChild(videoWrapper);
    videoWrapper.appendChild(remoteVideo); 
    videoContainer.appendChild(videoWrapper);

    return remoteVideo;
}

function setOnTrack(peer, remoteVideo) {
    const remoteStream = new MediaStream();

    remoteVideo.srcObject = remoteStream;

    peer.addEventListener("track", async(event) => {
        remoteStream.addTrack(event.track, remoteStream);
    })
}

function removeVideo(video) {
    const videoWrapper = video.parentNode;

    videoWrapper.parentNode.removeChild(videoWrapper);
}

