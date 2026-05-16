const screens = {
  menu: document.getElementById("screen-menu"),
  room: document.getElementById("screen-room"),
  ready: document.getElementById("screen-ready"),
  game: document.getElementById("screen-game"),
  result: document.getElementById("screen-result"),
};

const state = {
  screen: "menu",
  playerName: "ビリビリくん",
  laps: 3,
  boostEnabled: true,
  course: "neon",
  courseName: "ネオンストリート",
  countdownTimer: null,
  race: null,
  lastResult: null,
};

const courseCopy = {
  neon: {
    name: "ネオンストリート",
    copy: "ネオンが輝く夜の街を、かべに気をつけてかけぬけよう！",
    tags: ["直線多め", "初心者向け", "3ラップ推奨"],
  },
  pastel: {
    name: "パステルプラネット",
    copy: "カラフルなかべが続く、リズムよく曲がるコース。",
    tags: ["カーブ多め", "集中力", "3ラップ推奨"],
  },
  garden: {
    name: "サンダーガーデン",
    copy: "明るい庭園を走る、ゆるやかだけど油断できないコース。",
    tags: ["広め", "復帰しやすい", "初心者向け"],
  },
};

const elements = {
  playerName: document.getElementById("player-name"),
  slotPlayerName: document.getElementById("slot-player-name"),
  readyPlayerName: document.getElementById("ready-player-name"),
  resultPlayerName: document.getElementById("result-player-name"),
  lapOutput: document.getElementById("lap-output"),
  missionLaps: document.getElementById("mission-laps"),
  boostToggle: document.getElementById("boost-toggle"),
  selectedCourseName: document.getElementById("selected-course-name"),
  selectedCourseCopy: document.getElementById("selected-course-copy"),
  readyCourseName: document.getElementById("ready-course-name"),
  resultCourseName: document.getElementById("result-course-name"),
  countdownBadge: document.getElementById("countdown-badge"),
  raceTime: document.getElementById("race-time"),
  raceLap: document.getElementById("race-lap"),
  crashCount: document.getElementById("crash-count"),
  boostStatus: document.getElementById("boost-status"),
  rankName: document.getElementById("rank-name"),
  rankScore: document.getElementById("rank-score"),
  raceToast: document.getElementById("race-toast"),
  resultTime: document.getElementById("result-time"),
  resultCrashes: document.getElementById("result-crashes"),
  leaderName: document.getElementById("leader-name"),
  leaderTime: document.getElementById("leader-time"),
  modal: document.getElementById("info-modal"),
};

const readyCanvas = document.getElementById("ready-canvas");
const gameCanvas = document.getElementById("game-canvas");
const minimapCanvas = document.getElementById("minimap-canvas");

const ctxReady = readyCanvas.getContext("2d");
const ctxGame = gameCanvas.getContext("2d");
const ctxMini = minimapCanvas.getContext("2d");

const keys = new Set();

const trackPoints = [
  [170, 555],
  [170, 210],
  [315, 165],
  [590, 165],
  [800, 190],
  [855, 350],
  [735, 445],
  [555, 405],
  [450, 285],
  [310, 360],
  [330, 550],
  [560, 580],
  [780, 545],
  [850, 455],
  [835, 275],
  [700, 220],
  [510, 245],
  [435, 390],
  [520, 520],
  [300, 580],
  [170, 555],
];

const samples = buildSamples(trackPoints, 20);
const trackPath = buildTrackPath(trackPoints);

function buildTrackPath(points) {
  const path = new Path2D();
  path.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    const [x, y] = points[i];
    path.lineTo(x, y);
  }
  return path;
}

function buildSamples(points, stepsPerSegment) {
  const result = [];
  let distance = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const segment = Math.hypot(dx, dy);
    for (let step = 0; step < stepsPerSegment; step += 1) {
      const t = step / stepsPerSegment;
      result.push({ x: x1 + dx * t, y: y1 + dy * t, distance });
      distance += segment / stepsPerSegment;
    }
  }
  result.total = distance;
  return result;
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((totalSeconds % 1) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle("is-active", key === name);
  });
  state.screen = name;

  if (name !== "ready") {
    clearCountdown();
  }
  if (name !== "game" && state.race) {
    state.race.running = false;
  }
}

function syncUi() {
  const safeName = state.playerName.trim() || "ビリビリくん";
  state.playerName = safeName;
  elements.playerName.value = safeName;
  elements.slotPlayerName.textContent = safeName;
  elements.readyPlayerName.textContent = safeName;
  elements.resultPlayerName.textContent = safeName;
  elements.rankName.textContent = safeName;
  elements.leaderName.textContent = safeName;
  elements.lapOutput.textContent = state.laps;
  elements.missionLaps.textContent = state.laps;
  elements.boostToggle.textContent = state.boostEnabled ? "ON" : "OFF";
  elements.boostToggle.classList.toggle("is-on", state.boostEnabled);

  const course = courseCopy[state.course];
  state.courseName = course.name;
  elements.selectedCourseName.textContent = course.name;
  elements.selectedCourseCopy.textContent = course.copy;
  elements.readyCourseName.textContent = course.name;
  elements.resultCourseName.textContent = course.name;
  document.querySelectorAll(".mini-course").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.course === state.course);
  });
  const tagRow = document.querySelector(".course-panel .tag-row");
  tagRow.innerHTML = "";
  course.tags.forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag;
    tagRow.appendChild(span);
  });
}

function openModal(title) {
  document.getElementById("modal-title").textContent = title;
  elements.modal.hidden = false;
  elements.modal.querySelector(".close").focus();
}

function closeModal() {
  elements.modal.hidden = true;
}

function startReadyCountdown() {
  syncUi();
  drawTrack(ctxReady, readyCanvas.width, readyCanvas.height, null, true);
  showScreen("ready");
  let count = 3;
  elements.countdownBadge.textContent = count;
  clearCountdown();
  state.countdownTimer = window.setInterval(() => {
    count -= 1;
    elements.countdownBadge.textContent = count > 0 ? count : "GO!";
    if (count < 0) {
      clearCountdown();
      startRace();
    }
  }, 900);
}

function clearCountdown() {
  if (state.countdownTimer) {
    window.clearInterval(state.countdownTimer);
    state.countdownTimer = null;
  }
}

function startRace() {
  clearCountdown();
  const start = samples[0];
  state.race = {
    x: start.x,
    y: start.y,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    running: true,
    startedAt: performance.now(),
    lastFrame: performance.now(),
    lap: 1,
    completedLaps: 0,
    crashes: 0,
    progress: 0,
    lastProgress: 0,
    invulnerableUntil: performance.now() + 900,
    boostCooldownUntil: 0,
    boostPulseUntil: 0,
    toastUntil: 0,
  };
  elements.raceToast.classList.remove("is-visible");
  updateHud();
  showScreen("game");
  gameCanvas.focus();
  requestAnimationFrame(tick);
}

function finishRace() {
  const race = state.race;
  const elapsed = performance.now() - race.startedAt;
  race.running = false;
  state.lastResult = {
    time: elapsed,
    crashes: race.crashes,
    playerName: state.playerName,
    courseName: state.courseName,
  };
  elements.resultTime.textContent = formatTime(elapsed);
  elements.resultCrashes.textContent = `${race.crashes}回`;
  elements.leaderTime.textContent = formatTime(elapsed);
  showScreen("result");
}

function tick(now) {
  const race = state.race;
  if (!race || !race.running) return;

  const dt = Math.min(40, now - race.lastFrame) / 1000;
  race.lastFrame = now;

  updateCar(race, dt, now);
  drawTrack(ctxGame, gameCanvas.width, gameCanvas.height, race, false);
  drawMiniMap(race);
  updateHud();

  requestAnimationFrame(tick);
}

function updateCar(race, dt, now) {
  let ax = 0;
  let ay = 0;
  if (keys.has("ArrowUp") || keys.has("KeyW")) ay -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) ay += 1;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) ax -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) ax += 1;

  const length = Math.hypot(ax, ay);
  const accel = now < race.boostPulseUntil ? 980 : 560;
  if (length > 0) {
    ax /= length;
    ay /= length;
    race.vx += ax * accel * dt;
    race.vy += ay * accel * dt;
    race.angle = Math.atan2(ay, ax);
  }

  const drag = length > 0 ? 0.982 : 0.945;
  race.vx *= drag;
  race.vy *= drag;
  const maxSpeed = now < race.boostPulseUntil ? 470 : 320;
  const speed = Math.hypot(race.vx, race.vy);
  if (speed > maxSpeed) {
    race.vx = (race.vx / speed) * maxSpeed;
    race.vy = (race.vy / speed) * maxSpeed;
  }

  const nextX = race.x + race.vx * dt;
  const nextY = race.y + race.vy * dt;
  const onRoad = isOnRoad(ctxGame, nextX, nextY);
  if (!onRoad && now > race.invulnerableUntil) {
    resetToStart(race, now);
    return;
  }

  race.x = nextX;
  race.y = nextY;
  const nextProgress = nearestProgress(race.x, race.y);
  race.lastProgress = race.progress;
  race.progress = nextProgress;

  if (race.lastProgress > 0.86 && race.progress < 0.1 && now - race.startedAt > 1600) {
    race.completedLaps += 1;
    if (race.completedLaps >= state.laps) {
      finishRace();
    } else {
      race.lap = race.completedLaps + 1;
      race.toastUntil = now + 900;
      elements.raceToast.textContent = `LAP ${race.lap}/${state.laps}`;
      elements.raceToast.classList.add("is-visible");
    }
  }

  if (race.toastUntil < now) {
    elements.raceToast.classList.remove("is-visible");
  }
}

function resetToStart(race, now) {
  const start = samples[0];
  race.x = start.x;
  race.y = start.y;
  race.vx = 0;
  race.vy = 0;
  race.angle = -Math.PI / 2;
  race.crashes += 1;
  race.invulnerableUntil = now + 1100;
  race.toastUntil = now + 1200;
  elements.raceToast.textContent = "⚡ かべにせっしょく！ スタートへもどる";
  elements.raceToast.classList.add("is-visible");
}

function isOnRoad(ctx, x, y) {
  ctx.save();
  ctx.lineWidth = 146;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const result = ctx.isPointInStroke(trackPath, x, y);
  ctx.restore();
  return result;
}

function nearestProgress(x, y) {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const distance = (sample.x - x) ** 2 + (sample.y - y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return samples[bestIndex].distance / samples.total;
}

function triggerBoost() {
  const race = state.race;
  if (!state.boostEnabled || !race || !race.running) return;
  const now = performance.now();
  if (now < race.boostCooldownUntil) return;
  race.boostPulseUntil = now + 520;
  race.boostCooldownUntil = now + 1800;
  const forward = Math.hypot(race.vx, race.vy) > 8
    ? Math.atan2(race.vy, race.vx)
    : race.angle;
  race.vx += Math.cos(forward) * 170;
  race.vy += Math.sin(forward) * 170;
}

function updateHud() {
  const race = state.race;
  if (!race) return;
  const now = performance.now();
  elements.raceTime.textContent = formatTime(now - race.startedAt);
  elements.raceLap.textContent = `${Math.min(race.lap, state.laps)}/${state.laps}`;
  elements.crashCount.textContent = `${race.crashes}回`;
  elements.rankScore.textContent = `${Math.round(race.progress * 100)}%`;
  elements.boostStatus.textContent = state.boostEnabled
    ? now >= race.boostCooldownUntil ? "OK" : "充電中"
    : "OFF";
}

function drawTrack(ctx, width, height, race, preview) {
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height, preview);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.shadowBlur = 24;
  ctx.shadowColor = "#47efff";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 182;
  ctx.stroke(trackPath);

  ctx.shadowBlur = 18;
  ctx.strokeStyle = "#ff53a4";
  ctx.lineWidth = 168;
  ctx.stroke(trackPath);

  ctx.shadowBlur = 20;
  ctx.strokeStyle = "#1dd5c3";
  ctx.lineWidth = 154;
  ctx.setLineDash([170, 110, 90, 130]);
  ctx.stroke(trackPath);
  ctx.setLineDash([]);

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#d9e5ef";
  ctx.lineWidth = 138;
  ctx.stroke(trackPath);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.setLineDash([28, 28]);
  ctx.stroke(trackPath);
  ctx.setLineDash([]);

  drawFinishLine(ctx);
  drawObstacles(ctx);
  drawElectricity(ctx);
  drawArrowMarks(ctx);

  if (race) {
    drawCar(ctx, race.x, race.y, race.angle, performance.now() < race.invulnerableUntil, performance.now() < race.boostPulseUntil);
  } else {
    drawCar(ctx, 170, 555, -Math.PI / 2, false, false);
    drawCar(ctx, 330, 510, -0.5, false, true, "#ff3f8e");
    drawCar(ctx, 660, 370, -0.3, false, true, "#20c987");
  }

  ctx.restore();
}

function drawBackground(ctx, width, height, preview) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, preview ? "#dff5ff" : "#bce5ff");
  gradient.addColorStop(1, preview ? "#eaf7ff" : "#6bc8ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  for (let x = 0; x < width; x += 42) {
    for (let y = 0; y < height; y += 42) {
      ctx.fillRect(x, y, 22, 22);
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (let i = 0; i < 28; i += 1) {
    const x = (i * 149) % width;
    const y = (i * 83) % height;
    drawStar(ctx, x, y, 7 + (i % 3) * 3, i % 2 ? "#ffd143" : "#ffffff");
  }
}

function drawFinishLine(ctx) {
  const x = 170;
  const y = 555;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2);
  const tile = 18;
  for (let row = -2; row <= 2; row += 1) {
    for (let col = -4; col <= 4; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#1c2c4d";
      ctx.fillRect(col * tile, row * tile, tile, tile);
    }
  }
  ctx.fillStyle = "#fff";
  ctx.font = "900 30px sans-serif";
  ctx.textAlign = "center";
  ctx.strokeStyle = "#126cf4";
  ctx.lineWidth = 8;
  ctx.strokeText("START", 0, 82);
  ctx.fillText("START", 0, 82);
  ctx.restore();

  ctx.save();
  ctx.translate(800, 545);
  ctx.rotate(-0.2);
  ctx.fillStyle = "#ff3f8e";
  roundRect(ctx, -58, -28, 116, 56, 18);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "900 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ゴール!", 0, 8);
  ctx.restore();
}

function drawObstacles(ctx) {
  const blocks = [
    [410, 250, 92, 78],
    [690, 338, 102, 54],
    [520, 470, 70, 96],
  ];
  blocks.forEach(([x, y, w, h], index) => {
    ctx.save();
    ctx.fillStyle = index === 0 ? "#4aa6ff" : "#ffffff";
    ctx.strokeStyle = "#87c8ff";
    ctx.lineWidth = 10;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#4ce8ff";
    roundRect(ctx, x - w / 2, y - h / 2, w, h, 18);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawElectricity(ctx) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#55f4ff";
  for (let i = 0; i < samples.length; i += 9) {
    const sample = samples[i];
    const next = samples[(i + 2) % samples.length];
    ctx.beginPath();
    ctx.moveTo(sample.x + Math.sin(i) * 65, sample.y + Math.cos(i) * 65);
    ctx.lineTo((sample.x + next.x) / 2, (sample.y + next.y) / 2);
    ctx.lineTo(next.x + Math.cos(i) * 64, next.y + Math.sin(i) * 64);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrowMarks(ctx) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 209, 67, 0.8)";
  [[310, 170, 0], [785, 315, 1.2], [340, 548, -0.2]].forEach(([x, y, rotate]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotate);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 24, 0);
      ctx.lineTo(i * 24 + 24, 18);
      ctx.lineTo(i * 24, 36);
      ctx.lineTo(i * 24 + 8, 18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });
  ctx.restore();
}

function drawCar(ctx, x, y, angle, ghost, boost, color = "#168bff") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.globalAlpha = ghost ? 0.55 : 1;

  if (boost) {
    ctx.fillStyle = "rgba(255, 209, 67, 0.55)";
    ctx.beginPath();
    ctx.moveTo(0, 35);
    ctx.lineTo(-22, 82);
    ctx.lineTo(0, 64);
    ctx.lineTo(22, 82);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#22375f";
  roundRect(ctx, -34, -28, 68, 70, 24);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, -28, -34, 56, 66, 24);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#dff8ff";
  roundRect(ctx, -17, -24, 34, 26, 14);
  ctx.fill();
  ctx.fillStyle = "#ffe55c";
  ctx.beginPath();
  ctx.arc(-16, -34, 5, 0, Math.PI * 2);
  ctx.arc(16, -34, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMiniMap(race) {
  ctxMini.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  ctxMini.save();
  ctxMini.scale(minimapCanvas.width / gameCanvas.width, minimapCanvas.height / gameCanvas.height);
  ctxMini.lineCap = "round";
  ctxMini.lineJoin = "round";
  ctxMini.strokeStyle = "#dfefff";
  ctxMini.lineWidth = 120;
  ctxMini.stroke(trackPath);
  ctxMini.strokeStyle = "#178bff";
  ctxMini.lineWidth = 18;
  ctxMini.stroke(trackPath);
  ctxMini.fillStyle = "#ff3f8e";
  ctxMini.beginPath();
  ctxMini.arc(race.x, race.y, 24, 0, Math.PI * 2);
  ctxMini.fill();
  ctxMini.restore();
}

function drawStar(ctx, x, y, radius, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  if (!action) return;

  if (action === "solo" || action === "room") {
    showScreen(action === "solo" ? "room" : "room");
  }
  if (action === "menu") showScreen("menu");
  if (action === "start") startReadyCountdown();
  if (action === "force-start") startRace();
  if (action === "retry") startReadyCountdown();
  if (action === "howto") openModal("あそびかた");
  if (action === "settings") openModal("設定");
  if (action === "close-modal") closeModal();
  if (action === "lap-down") {
    state.laps = Math.max(1, state.laps - 1);
    syncUi();
  }
  if (action === "lap-up") {
    state.laps = Math.min(7, state.laps + 1);
    syncUi();
  }
  if (action === "boost-toggle") {
    state.boostEnabled = !state.boostEnabled;
    syncUi();
  }
  if (action === "boost") triggerBoost();

  if (button.dataset.course) {
    state.course = button.dataset.course;
    syncUi();
  }
});

elements.playerName.addEventListener("input", () => {
  state.playerName = elements.playerName.value.trim() || "ビリビリくん";
  syncUi();
});

document.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === "Escape") {
    if (!elements.modal.hidden) closeModal();
    else if (state.screen === "room") showScreen("menu");
  }
  if (event.code === "Enter" && state.screen === "ready") {
    startRace();
  }
  if (event.code === "Space") {
    triggerBoost();
  }
  keys.add(event.code);
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("resize", () => {
  if (state.screen === "ready") {
    drawTrack(ctxReady, readyCanvas.width, readyCanvas.height, null, true);
  }
});

syncUi();
drawTrack(ctxReady, readyCanvas.width, readyCanvas.height, null, true);
