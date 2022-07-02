import io from "./socket.io.esm.min.js";

async function getMediaSource() {
  const [mediaSource] = await navigator.mediaDevices
    .enumerateDevices()
    .then((devices) =>
      devices.filter((device) => device.kind === "videoinput")
    );

  return mediaSource;
}

async function getMediaStream(
  deviceId,
  constrain = {
    audio: true,
    video: { facingMode: "user" },
  }
) {
  if (typeof deviceId !== 'undefined') {
    constrain.video = { deviceId: { exact: deviceId } }
  }
  const stream = await navigator.mediaDevices.getUserMedia(constrain);

  return stream;
}

function getElements () {
  return {
    screenHost: document.querySelector('[data-component-video-host]') || undefined,
    screenGuest: document.querySelector('[data-component-video-guest]') || undefined,
    buttonAudio: document.querySelector('[data-component-menu-audio]') || undefined,
    buttonCamera: document.querySelector('[data-component-menu-camera]') || undefined,
    formRoomName: document.querySelector('[data-component-join-room]') || undefined,
  }
}

async function main() {
  const socket = io();
  const {screenHost} = getElements();
  const stream = getMediaStream();
  const source = getMediaSource();
  screenHost.srcObject = await stream;

  socket.on("connect", () => {});
}

main().catch(console.error);
