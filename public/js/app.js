import io from "./socket.io.esm.min.js";

async function main() {
  const socket = io();
  socket.on('connect', () => {
    
  })
}

main().catch(console.error);
