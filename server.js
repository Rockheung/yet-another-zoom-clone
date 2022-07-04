const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server);

app.use((req, res, next) => {
  if (req.method === "HEAD") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  next();
});
app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("listening on *:3000");
});
