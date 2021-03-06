import io from "./socket.io.esm.min.js";

async function getMediaSources() {
  const mediaSources = await navigator.mediaDevices
    .enumerateDevices()
    .then((devices) =>
      devices.filter((device) => device.kind === "videoinput")
    );

  return mediaSources;
}

async function getMediaStream(
  deviceId,
  constrain = {
    audio: true,
    video: { facingMode: "user" },
  }
) {
  if (typeof deviceId !== "undefined") {
    constrain.video = { deviceId: { exact: deviceId } };
  }
  const stream = await navigator.mediaDevices.getUserMedia(constrain);

  return stream;
}

function getElements() {
  return {
    screenHost:
      document.querySelector("[data-component-video-host]") || undefined,
    screenGuest:
      document.querySelector("[data-component-video-guest]") || undefined,
    buttonAudio:
      document.querySelector("[data-component-menu-audio]") || undefined,
    buttonCamera:
      document.querySelector("[data-component-menu-camera]") || undefined,
    formRoomName:
      document.querySelector("[data-component-join-room]") || undefined,
    selectCamera:
      document.querySelector("[data-component-select-device]") || undefined,
    selectCameraModal:
      document.querySelector("[data-layout-select-device]") || undefined,
    buttonChangeRoom:
      document.querySelector("[data-component-menu-room-change]") || undefined,
  };
}

function mountCameraOption(target, device) {
  const _option = document.createElement("option");
  _option.innerText = device.label;
  _option.value = device.deviceId;
  target.appendChild(_option);
  return target;
}

function handleCameraChange(form, screen, store) {
  return async function (evt) {
    form.classList.add("hidden");
    const selectedDeviceId = evt.currentTarget.value;
    store.stream = await getMediaStream(selectedDeviceId);
    screen.srcObject = store.stream
    // TODO: Re-connect peer stream
    if (store.rtcConnection) {
      const videoTrack = store.stream.getVideoTracks()[0];
      const videoSender = store.rtcConnection
        .getSenders()
        .find((sender) => sender.track.kind === "video");
      videoSender.replaceTrack(videoTrack);
    }

  };
}

function handleVisible(form) {
  return function () {
    form.classList.contains("hidden")
      ? form.classList.remove("hidden")
      : form.classList.add("hidden");
  };
}

function handleRoomJoin(store, socket) {
  return function (evt) {
    evt.preventDefault();
    evt.currentTarget.classList.add("hidden");
    const roomNameInput = evt.currentTarget.querySelector(
      'input[name="room_name"]'
    );
    store.roomName = roomNameInput.value;
    socket.emit("join_room", roomNameInput.value);
  };
}
async function getPublicStunServers() {
  const res = await fetch(
    "https://raw.githubusercontent.com/pradt2/always-online-stun/master/valid_hosts.txt"
  );
  const text = await res.text();
  const urls = text
    .split("\n")
    .slice(0, 4)
    .map((host) => "stun:" + host);
  return {
    urls,
  };
}

function handleIce(store, socket) {
  return function (data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, store.roomName);
  };
}

function handleTrack(screen) {
  return function (track) {
    console.log("???? ~ file: app.js ~ line 101 ~ data", track);
    screen.srcObject = track.streams[0];
  };
}

function handleRemoteTracks(stream, rtcCon) {
  return function (track) {
    return rtcCon.addTrack(track, stream);
  };
}

async function makeRTCConnection(screen, store, socket) {
  const iceServers = [await getPublicStunServers()];
  const rtcConnection = new RTCPeerConnection({
    iceServers,
  });

  rtcConnection.addEventListener("icecandidate", handleIce(store, socket));
  rtcConnection.addEventListener("track", handleTrack(screen));
  store.stream.getTracks().forEach(handleRemoteTracks(store.stream, rtcConnection));

  return rtcConnection;
}

function handleWebRTCWelcome(store, socket) {
  return async function () {
    store.dataChannel = store.rtcConnection.createDataChannel("chat");
    store.dataChannel.addEventListener("message", (event) =>
      console.log(event.data)
    );
    console.log("made data channel");
    const offer = await store.rtcConnection.createOffer();
    store.rtcConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, store.roomName);
  };
}

function handleWebRTCOffer(store, socket) {
  return async function (offer) {
    store.rtcConnection.addEventListener("datachannel", (event) => {
      store.dataChannel = event.channel;
      store.dataChannel.addEventListener("message", (event) =>
        console.log(event.data)
      );
    });
    console.log("received the offer");
    store.rtcConnection.setRemoteDescription(offer);
    const answer = await store.rtcConnection.createAnswer();
    store.rtcConnection.setLocalDescription(answer);
    socket.emit("answer", answer, store.roomName);
    console.log("sent the answer");
  };
}

function handleWebRTCAnswer(rtcCon) {
  return function (answer) {
    console.log("received the answer");
    rtcCon.setRemoteDescription(answer);
  };
}

function handleWebRTCIce(rtcCon) {
  return function (ice) {
    console.log("received candidate");
    rtcCon.addIceCandidate(ice);
  };
}

async function main() {
  const store = {};
  const socket = io();
  const {
    screenHost,
    screenGuest,
    selectCamera,
    selectCameraModal,
    formRoomName,
    buttonChangeRoom,
    buttonCamera,
  } = getElements();
  store.stream = await getMediaStream();
  screenHost.srcObject = store.stream;
  store.rtcConnection = await makeRTCConnection(
    screenGuest,
    store,
    socket
  );
  const sources = await getMediaSources();
  sources.reduce(mountCameraOption, selectCamera);

  selectCamera.onchange = handleCameraChange(selectCameraModal, screenHost, store);
  formRoomName.onsubmit = handleRoomJoin(store, socket);
  buttonChangeRoom.onclick = handleVisible(formRoomName);
  buttonCamera.onclick = handleVisible(selectCameraModal);

  socket.on("welcome", handleWebRTCWelcome(store, socket));
  socket.on("offer", handleWebRTCOffer(store, socket));
  socket.on("answer", handleWebRTCAnswer(store.rtcConnection));
  socket.on("ice", handleWebRTCIce(store.rtcConnection));
}

main().catch(console.error);
