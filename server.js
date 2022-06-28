const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));
app.use((req, res, next) => {
  if (req.method === "HEAD") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  next();
});

app.use("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
