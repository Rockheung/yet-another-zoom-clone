const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cookie: {
    name: "socket-id",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 86400
  }
});

app.use((req, res, next) => {
  if (req.method === "HEAD") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  next();
});
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  console.log(socket.rooms)
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
