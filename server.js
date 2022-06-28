const app = require("express")();

app.use((req, res, next) => {
  if (req.method === "HEAD") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  next();
});

app.use("/", (req, res) => {
  res.send("good");
});

app.listen(3000);
