const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const uuid = require("uuid");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

const players = {};
const orbits = {};

let clientWidth, clientHeight;

const maxOrbits = 200;
const orbitGenerationInterval = 370;
let lastOrbitGenerationTime = Date.now();

function generateRandomOrbit(clientWidth, clientHeight) {
  const orbit = {
    x: Math.random() * clientWidth,
    y: Math.random() * clientHeight,
    size: 8,
    color: "#" + Math.floor(Math.random() * 16777215).toString(16), // Generate random color
  };
  return orbit;
}

function updateOrbits() {
  const currentTime = Date.now();

  if (currentTime - lastOrbitGenerationTime >= orbitGenerationInterval &&
    Object.keys(orbits).length < maxOrbits) {
    const orbitID = uuid.v4();
    orbits[orbitID] = generateRandomOrbit(clientWidth, clientHeight);
    lastOrbitGenerationTime = currentTime;
    io.emit("updateOrbits", orbits);
  }
}

setInterval(updateOrbits, 200);

io.on("connection", (socket) => {
  // console.log("A user connected");

  const playerID = socket.id;

  players[playerID] = {
    x: Math.random() * 800,
    y: Math.random() * 600,
    size: 20,
  };
  socket.emit("init", {
    playerID: socket.id,
    players: players,
    orbits: orbits,
  });

  socket.on("init", (data) => {
    clientWidth = data.windowWidth;
    clientHeight = data.windowHeight;
  });

  socket.on("move", (movement) => {
    players[playerID].x = movement.x;
    players[playerID].y = movement.y;

    io.emit("update", { players, orbits });
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected");
    delete players[playerID];
    io.emit("update", { players, orbits });
  });
  socket.on("eatOrbit", (orbitID) => {
    if (orbits[orbitID]) {
      players[socket.id].size += 10;
      delete orbits[orbitID];

      io.emit("update", { players, orbits });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
