window.onload = function () {
  let orbits = {};
  let player = {};
  const socket = io();

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const initialRandomColor =
    "#" + Math.floor(Math.random() * 16777215).toString(16);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  function updateBackground() {
    ctx.fillStyle = "#f2fbff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#cfd7da";
    const linesCount = 20;

    for (let x = 0; x < canvas.width; x += linesCount * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += linesCount * 2) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
  updateBackground();

  socket.emit("init", {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  });
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  socket.on("update", (gameState) => {
    const { players, orbits: updatedOrbits } = gameState; 

    orbits = updatedOrbits;
    player = players[socket.id];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateBackground();

    Object.values(orbits).forEach((orbit) => {
      const adjustedX = (orbit.x / 800) * window.innerWidth;
      const adjustedY = (orbit.y / 600) * window.innerHeight;

      ctx.beginPath();
      ctx.arc(adjustedX, adjustedY, orbit.size, 0, 2 * Math.PI);
      ctx.fillStyle = orbit.color;
      ctx.fill();
    });

    Object.values(players).forEach((player) => {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.size, 0, 2 * Math.PI);
      ctx.fillStyle = initialRandomColor;
      ctx.fill();
      ctx.strokeStyle = initialRandomColor
        .replace(/^#/, "#")
        .replace(/../g, (color) =>
          ("0" + Math.max(0, parseInt(color, 16) - 20).toString(16)).slice(-2),
        );
    });
  });

  socket.on("updateOrbits", (updatedOrbits) => {
    orbits = updatedOrbits;
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    socket.emit("move", {
      x: mouseX,
      y: mouseY,
    });

    Object.entries(orbits).forEach(([orbitID, orbit]) => {
      const adjustedX = (orbit.x / 800) * window.innerWidth;
      const adjustedY = (orbit.y / 600) * window.innerHeight;
      const distance = Math.sqrt(
        (adjustedX - mouseX) ** 2 + (adjustedY - mouseY) ** 2,
      );

      if (distance < player.size + orbit.size * 0.6) {
        socket.emit("eatOrbit", orbitID);
      }
    });
  });
};
