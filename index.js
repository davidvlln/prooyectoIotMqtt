require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.set("io", io);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para registrar TODAS las peticiones entrantes
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.static("public"));
app.use("/assets", express.static("public"));
app.set("view engine", "ejs");

io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on("join-node", (nodeId) => {
    socket.join(`node:${nodeId}`);
    console.log(`${socket.id} monitorea nodo: ${nodeId}`);
  });

  socket.on("leave-node", (nodeId) => {
    socket.leave(`node:${nodeId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

const apiRoutes = require("./src/routes/apiRoutes");
app.use("/api/v1", apiRoutes);

// Mantenemos la ruta antigua /api/sensores viva para no romper Node-RED
const sensoresController = require("./src/controllers/sensoresController");
app.post("/api/sensores", sensoresController.crearSensor);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const port = 3001;
server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
