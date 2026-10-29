
/*
  ASYMMETRY LAB — EXPERIMENT 01
  NON-EQUILIBRIUM MATTER

  p5.js only. No external libraries.

  Interactions:
  - Open / close the central barrier
  - Drag individual particles
  - Click the chamber to inject energy
  - Adjust temperature, initial imbalance and mobility
  - Monitor live density imbalance and coarse-grained entropy
  - Pause, reset and restart the experiment
*/

const CFG = {
  particles: 240,
  bins: 24,
  history: 180,
  radius: 2.6
};

const C = {
  bg: [7, 12, 25],
  panel: [12, 21, 39],
  panel2: [17, 29, 49],
  border: [40, 62, 87],
  cyan: [89, 221, 255],
  amber: [255, 174, 96],
  white: [235, 243, 255],
  muted: [133, 157, 187],
  green: [124, 238, 190]
};

let chamber, graphs;
let particles = [];
let temperature = 0.65;
let initialImbalance = 0.8;
let mobility = 0.65;

let barrierOpen = false;
let running = true;
let elapsed = 0;
let simTime = 0;
let selectedParticle = null;

let densityHistory = [];
let entropyHistory = [];
let previousSample = 0;

let sliders = [];
let buttons = [];

let densityImbalance = 0;
let entropy = 0;
let leftCount = 0;
let rightCount = 0;
let totalCollisions = 0;

function setup() {
  createCanvas(1200, 820);
  pixelDensity(1);
  textFont("monospace");
  frameRate(60);

  chamber = { x: 38, y: 156, w: 740, h: 405 };
  graphs = { x: 798, y: 156, w: 364, h: 195 };

  buildControls();
  resetExperiment();
}

function draw() {
  background(...C.bg);
  drawBackground();
  drawHeader();
  drawExperimentTabs();
  drawChamber();
  drawGraphs();
  drawMetrics();
  drawControls();
  drawFooter();

  if (running) {
    updateSimulation();
    updateMeasurements();
  }
}

// ==================================================
// INTERFACE
// ==================================================

function drawBackground() {
  noStroke();

  for (let i = 0; i < 5; i++) {
    fill(20, 65, 100, 7 - i);
    circle(width - 80, 50, 180 + i * 45);
  }

  stroke(35, 53, 76, 35);
  strokeWeight(1);

  for (let x = 0; x < width; x += 32) {
    line(x, 0, x, height);
  }

  for (let y = 0; y < height; y += 32) {
    line(0, y, width, y);
  }
}

function drawHeader() {
  noStroke();
  fill(...C.cyan);
  textSize(11);
  text("ASYMMETRY LAB   /   EXPERIMENT 001", 40, 28);

  fill(...C.white);
  textSize(27);
  text("NON-EQUILIBRIUM MATTER", 38, 63);

  fill(...C.muted);
  textSize(11);
  text("FROM AN UNEVEN BEGINNING TO A DYNAMICALLY EVOLVING SYSTEM", 40, 87);

  fill(running ? C.green : C.amber);
  circle(1132, 31, 7);

  fill(...C.white);
  textAlign(RIGHT);
  textSize(10);
  text(running ? "SIMULATION LIVE" : "SIMULATION PAUSED", 1118, 35);
  textAlign(LEFT);

  fill(...C.muted);
  textSize(10);
  text("MODEL: STOCHASTIC PARTICLE DIFFUSION", 40, 117);
  text("TIME  " + nf(simTime, 1, 1) + " s", 40, 134);
}

function drawExperimentTabs() {
  // This is a single-experiment laboratory.
  noStroke();
  fill(...C.cyan);
  textSize(10);
  text("01   /   INITIAL CONDITIONS → EVOLUTION → EQUILIBRIUM", 798, 119);
}

function panel(x, y, w, h, title, subtitle) {
  noStroke();
  fill(...C.panel);
  rect(x, y, w, h, 10);

  stroke(...C.border);
  noFill();
  rect(x, y, w, h, 10);

  noStroke();
  fill(...C.cyan);
  textSize(10);
  text(title, x + 15, y + 21);

  fill(...C.muted);
  textSize(9);
  text(subtitle, x + 15, y + 37);
}

// ==================================================
// PARTICLE CHAMBER
// ==================================================

function drawChamber() {
  let b = chamber;
  panel(
    b.x, b.y, b.w, b.h,
    "THE CHAMBER",
    "Drag particles to disturb the system  /  Click empty space to inject energy"
  );

  let x0 = b.x + 12;
  let y0 = b.y + 52;
  let cw = b.w - 24;
  let ch = b.h - 68;
  let mid = x0 + cw / 2;

  // Chamber interior.
  noStroke();
  fill(7, 15, 29);
  rect(x0, y0, cw, ch, 5);

  // Subtle measurement grid.
  stroke(30, 48, 70, 90);
  strokeWeight(1);

  for (let i = 1; i < 10; i++) {
    let gx = x0 + cw * i / 10;
    line(gx, y0, gx, y0 + ch);
  }

  for (let i = 1; i < 6; i++) {
    let gy = y0 + ch * i / 6;
    line(x0, gy, x0 + cw, gy);
  }

  // Initial regions.
  noStroke();
  fill(89, 221, 255, 13);
  rect(x0, y0, cw / 2, ch);

  fill(255, 174, 96, 10);
  rect(mid, y0, cw / 2, ch);

  fill(...C.cyan);
  textSize(9);
  textAlign(CENTER);
  text("REGION A", x0 + cw * 0.25, y0 + 15);

  fill(...C.amber);
  text("REGION B", x0 + cw * 0.75, y0 + 15);
  textAlign(LEFT);

  // Central barrier.
  if (!barrierOpen) {
    stroke(255, 198, 125, 190);
    strokeWeight(2);
    line(mid, y0 + 3, mid, y0 + ch - 3);

    noStroke();
    fill(...C.amber);
    circle(mid, y0 + ch / 2, 7);

    fill(...C.amber);
    textAlign(CENTER);
    textSize(9);
    text("BARRIER CLOSED", mid, y0 + ch - 12);
    textAlign(LEFT);
  } else {
    drawingGlowLine(mid, y0 + 3, mid, y0 + ch - 3, C.green, 0.12);

    fill(...C.green);
    textAlign(CENTER);
    textSize(9);
    text("BARRIER OPEN", mid, y0 + ch - 12);
    textAlign(LEFT);
  }

  // Render particles with a small glow.
  for (let p of particles) {
    let col = p.kind === 0 ? C.cyan : C.amber;
    let r = p.r;

    noStroke();
    fill(col[0], col[1], col[2], 20);
    circle(p.x, p.y, r * 6);

    fill(col[0], col[1], col[2], 45);
    circle(p.x, p.y, r * 3);

    fill(...col);
    circle(p.x, p.y, r * 1.8);

    if (p === selectedParticle) {
      noFill();
      stroke(...C.white);
      strokeWeight(1);
      circle(p.x, p.y, r * 5);
    }
  }

  // Region divider markers.
  noStroke();
  fill(...C.muted);
  textSize(9);
  text("LEFT", x0 + 5, y0 + ch - 6);
  textAlign(RIGHT);
  text("RIGHT", x0 + cw - 5, y0 + ch - 6);
  textAlign(LEFT);

  // Chamber border.
  noFill();
  stroke(52, 78, 105);
  rect(x0, y0, cw, ch, 5);
}

function drawingGlowLine(x1, y1, x2, y2, col, alpha) {
  stroke(col[0], col[1], col[2], 30);
  strokeWeight(9);
  line(x1, y1, x2, y2);

  stroke(col[0], col[1], col[2], 120);
  strokeWeight(3);
  line(x1, y1, x2, y2);

  stroke(col[0], col[1], col[2], 230);
  strokeWeight(1);
  line(x1, y1, x2, y2);
}

// ==================================================
// PHYSICS ENGINE
// ==================================================

function updateSimulation() {
  let b = chamber;
  let x0 = b.x + 12;
  let y0 = b.y + 52;
  let cw = b.w - 24;
  let ch = b.h - 68;
  let mid = x0 + cw / 2;

  let dt = min(deltaTime / 16.667, 2);

  for (let p of particles) {
    if (p === selectedParticle) continue;

    // Temperature controls the random thermal acceleration.
    let noiseStrength = 0.035 * temperature;

    p.vx += random(-noiseStrength, noiseStrength) * dt;
    p.vy += random(-noiseStrength, noiseStrength) * dt;

    // Mobility controls velocity damping.
    let damping = pow(0.995 - mobility * 0.008, dt);
    p.vx *= damping;
    p.vy *= damping;

    // Maintain a nonzero thermal velocity.
    let speed = sqrt(p.vx * p.vx + p.vy * p.vy);
    let targetSpeed = 0.45 + temperature * 1.7;

    if (speed > targetSpeed * 1.8) {
      p.vx *= targetSpeed * 1.8 / speed;
      p.vy *= targetSpeed * 1.8 / speed;
    }

    if (speed < 0.08) {
      p.vx += random(-0.15, 0.15) * temperature;
      p.vy += random(-0.15, 0.15) * temperature;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Reflect from chamber walls.
    if (p.x < x0 + p.r) {
      p.x = x0 + p.r;
      p.vx = abs(p.vx);
    }

    if (p.x > x0 + cw - p.r) {
      p.x = x0 + cw - p.r;
      p.vx = -abs(p.vx);
    }

    if (p.y < y0 + p.r) {
      p.y = y0 + p.r;
      p.vy = abs(p.vy);
    }

    if (p.y > y0 + ch - p.r) {
      p.y = y0 + ch - p.r;
      p.vy = -abs(p.vy);
    }

    // An impermeable central barrier.
    if (!barrierOpen) {
      let crossed = p.x > mid - p.r && p.x < mid + p.r;
      if (crossed) {
        if (p.vx > 0) {
          p.x = mid - p.r;
        } else {
          p.x = mid + p.r;
        }
        p.vx *= -1;
      }
    }

    // Weak local momentum exchange between nearby particles.
    if (random() < 0.025 * dt) {
      let neighbour = random(particles);
      if (neighbour !== p && neighbour !== selectedParticle &&
          dist(p.x, p.y, neighbour.x, neighbour.y) < 15) {
        let vx = p.vx;
        let vy = p.vy;
        p.vx = neighbour.vx;
        p.vy = neighbour.vy;
        neighbour.vx = vx;
        neighbour.vy = vy;
        totalCollisions++;
      }
    }
  }

  simTime += dt / 60;
  elapsed++;
}

function updateMeasurements() {
  if (frameCount - previousSample < 8) return;
  previousSample = frameCount;

  let b = chamber;
  let mid = b.x + b.w / 2;

  leftCount = 0;
  rightCount = 0;

  for (let p of particles) {
    if (p.x < mid) leftCount++;
    else rightCount++;
  }

  densityImbalance = abs(leftCount - rightCount) /
    max(1, particles.length);

  // Coarse-grained spatial Shannon entropy.
  // Bins partition the chamber horizontally.
  let counts = Array(CFG.bins).fill(0);
  let x0 = chamber.x + 12;
  let cw = chamber.w - 24;

  for (let p of particles) {
    let idx = floor((p.x - x0) / cw * CFG.bins);
    idx = constrain(idx, 0, CFG.bins - 1);
    counts[idx]++;
  }

  entropy = 0;
  for (let count of counts) {
    if (count > 0) {
      let prob = count / particles.length;
      entropy -= prob * Math.log(prob);
    }
  }

  densityHistory.push(densityImbalance);
  entropyHistory.push(entropy / Math.log(CFG.bins));

  if (densityHistory.length > CFG.history) densityHistory.shift();
  if (entropyHistory.length > CFG.history) entropyHistory.shift();
}

// ==================================================
// LIVE GRAPHS
// ==================================================

function drawGraphs() {
  let x = graphs.x;
  let y = graphs.y;
  let w = graphs.w;
  let h = graphs.h;

  drawGraphPanel(
    x, y, w, h,
    "01  /  DENSITY IMBALANCE",
    "Absolute difference between region populations",
    densityHistory,
    C.cyan,
    0, 1
  );

  drawGraphPanel(
    x, y + h + 10, w, h,
    "02  /  SPATIAL ENTROPY",
    "Shannon entropy of particle positions (normalized)",
    entropyHistory,
    C.amber,
    0, 1
  );
}

function drawGraphPanel(x, y, w, h, title, subtitle, data, col, minY, maxY) {
  panel(x, y, w, h, title, subtitle);

  let gx = x + 17;
  let gy = y + 58;
  let gw = w - 34;
  let gh = h - 79;

  // Grid.
  stroke(39, 57, 80);
  strokeWeight(1);

  for (let i = 0; i <= 4; i++) {
    let yy = gy + gh * i / 4;
    line(gx, yy, gx + gw, yy);
  }

  noStroke();
  fill(...C.muted);
  textSize(8);
  textAlign(RIGHT);
  text("1.0", gx - 4, gy + 3);
  text("0.5", gx - 4, gy + gh / 2 + 3);
  text("0.0", gx - 4, gy + gh + 3);
  textAlign(LEFT);

  if (data.length < 2) return;

  // Line glow.
  noFill();
  stroke(col[0], col[1], col[2], 35);
  strokeWeight(6);
  beginShape();
  for (let i = 0; i < data.length; i++) {
    let px = gx + i / (CFG.history - 1) * gw;
    let py = gy + gh * (1 - data[i]);
    vertex(px, py);
  }
  endShape();

  stroke(...col);
  strokeWeight(1.5);
  beginShape();
  for (let i = 0; i < data.length; i++) {
    let px = gx + i / (CFG.history - 1) * gw;
    let py = gy + gh * (1 - data[i]);
    vertex(px, py);
  }
  endShape();

  // Latest value.
  let latest = data[data.length - 1];
  noStroke();
  fill(...col);
  circle(
    gx + (data.length - 1) / (CFG.history - 1) * gw,
    gy + gh * (1 - latest),
    5
  );

  fill(...C.white);
  textAlign(RIGHT);
  textSize(10);
  text(nf(latest, 1, 3), x + w - 17, y + 21);
  textAlign(LEFT);
}

// ==================================================
// METRICS
// ==================================================

function drawMetrics() {
  let y = 575;
  let x = 38;
  let gap = 10;
  let w = (1124 - gap * 3) / 4;
  let h = 61;

  metricCard(x, y, w, h, "PARTICLES", particles.length, "TOTAL IN CHAMBER", C.cyan);
  metricCard(x + w + gap, y, w, h, "LEFT REGION", leftCount, "PARTICLES", C.cyan);
  metricCard(x + (w + gap) * 2, y, w, h, "RIGHT REGION", rightCount, "PARTICLES", C.amber);
  metricCard(x + (w + gap) * 3, y, w, h, "DENSITY IMBALANCE", nf(densityImbalance, 1, 3), "0 = BALANCED", C.green);
}

function metricCard(x, y, w, h, title, value, subtitle, col) {
  noStroke();
  fill(...C.panel);
  rect(x, y, w, h, 7);

  stroke(...C.border);
  noFill();
  rect(x, y, w, h, 7);

  noStroke();
  fill(...col);
  textSize(9);
  text(title, x + 12, y + 16);

  fill(...C.white);
  textSize(19);
  text(value, x + 12, y + 39);

  fill(...C.muted);
  textSize(8);
  text(subtitle, x + w - 12, y + 38);
  textAlign(LEFT);
}

// ==================================================
// CONTROLS
// ==================================================

function buildControls() {
  sliders = [
    {
      id: "temperature",
      label: "TEMPERATURE",
      min: 0.05, max: 1, value: temperature,
      x: 45, y: 692, w: 215
    },
    {
      id: "imbalance",
      label: "INITIAL IMBALANCE",
      min: 0, max: 1, value: initialImbalance,
      x: 310, y: 692, w: 215
    },
    {
      id: "mobility",
      label: "MOBILITY",
      min: 0.05, max: 1, value: mobility,
      x: 575, y: 692, w: 215
    }
  ];

  buttons = [
    { id: "barrier", label: "OPEN BARRIER", x: 820, y: 674, w: 150, h: 31 },
    { id: "energy", label: "INJECT ENERGY", x: 980, y: 674, w: 150, h: 31 },
    { id: "reset", label: "RESET", x: 820, y: 715, w: 88, h: 29 },
    { id: "pause", label: "PAUSE", x: 915, y: 715, w: 88, h: 29 },
    { id: "new", label: "NEW STATE", x: 1010, y: 715, w: 120, h: 29 }
  ];
}

function drawControls() {
  noStroke();
  fill(...C.panel);
  rect(38, 660, 1124, 93, 9);

  stroke(...C.border);
  noFill();
  rect(38, 660, 1124, 93, 9);

  fill(...C.cyan);
  noStroke();
  textSize(9);
  text("EXPERIMENT PARAMETERS", 49, 676);

  for (let s of sliders) {
    let value = getSliderValue(s.id);
    let ratio = (value - s.min) / (s.max - s.min);

    fill(...C.white);
    textSize(10);
    text(s.label, s.x, s.y - 8);

    textAlign(RIGHT);
    fill(...C.cyan);
    text(nf(value, 1, 2), s.x + s.w, s.y - 8);
    textAlign(LEFT);

    stroke(48, 68, 92);
    strokeWeight(4);
    line(s.x, s.y + 7, s.x + s.w, s.y + 7);

    stroke(...C.cyan);
    line(s.x, s.y + 7, s.x + s.w * ratio, s.y + 7);

    noStroke();
    fill(...C.white);
    circle(s.x + s.w * ratio, s.y + 7, 11);
  }

  for (let b of buttons) {
    let label = b.label;

    if (b.id === "barrier") {
      label = barrierOpen ? "CLOSE BARRIER" : "OPEN BARRIER";
    }
    if (b.id === "pause") {
      label = running ? "PAUSE" : "RESUME";
    }

    let active = (b.id === "barrier" && barrierOpen) ||
      (b.id === "pause" && !running);

    stroke(active ? C.cyan : C.border);
    fill(active ? color(21, 60, 78) : color(19, 32, 51));
    rect(b.x, b.y, b.w, b.h, 5);

    noStroke();
    fill(active ? C.cyan : C.white);
    textAlign(CENTER, CENTER);
    textSize(9);
    text(label, b.x + b.w / 2, b.y + b.h / 2);
    textAlign(LEFT, BASELINE);
  }
}

function getSliderValue(id) {
  if (id === "temperature") return temperature;
  if (id === "imbalance") return initialImbalance;
  return mobility;
}

function setSliderValue(id, value) {
  if (id === "temperature") temperature = value;

  if (id === "imbalance") {
    initialImbalance = value;
  }

  if (id === "mobility") mobility = value;
}

function handleSlider(s, mx) {
  let value = map(mx, s.x, s.x + s.w, s.min, s.max);
  setSliderValue(s.id, constrain(value, s.min, s.max));
}

function drawFooter() {
  noStroke();
  fill(...C.muted);
  textSize(9);
  text("MODEL: FINITE STOCHASTIC PARTICLE SYSTEM", 40, 783);

  textAlign(RIGHT);
  text("OBSERVE  /  DISTURB  /  DISCOVER", 1160, 783);
  textAlign(LEFT);
}

// ==================================================
// INITIAL CONDITIONS
// ==================================================

function resetExperiment() {
  particles = [];
  selectedParticle = null;

  simTime = 0;
  elapsed = 0;
  totalCollisions = 0;

  densityHistory = [];
  entropyHistory = [];
  previousSample = 0;

  let b = chamber;
  let x0 = b.x + 12;
  let y0 = b.y + 52;
  let cw = b.w - 24;
  let ch = b.h - 68;

  // initialImbalance = 0 means approximately equal populations;
  // initialImbalance = 1 means all particles start on the left.
  let leftFraction = 0.5 + 0.5 * initialImbalance;

  for (let i = 0; i < CFG.particles; i++) {
    let onLeft = random() < leftFraction;
    let x;

    if (onLeft) {
      x = random(x0 + 8, x0 + cw / 2 - 8);
    } else {
      x = random(x0 + cw / 2 + 8, x0 + cw - 8);
    }

    particles.push({
      x: x,
      y: random(y0 + 8, y0 + ch - 8),
      vx: random(-1, 1) * temperature,
      vy: random(-1, 1) * temperature,
      r: CFG.radius,
      kind: 0
    });
  }

  updateMeasurements();
}

// ==================================================
// USER INPUT
// ==================================================

function mousePressed() {
  // Buttons.
  for (let b of buttons) {
    if (inside(mouseX, mouseY, b)) {
      if (b.id === "barrier") {
        barrierOpen = !barrierOpen;
      } else if (b.id === "energy") {
        injectEnergy();
      } else if (b.id === "reset") {
        resetExperiment();
      } else if (b.id === "pause") {
        running = !running;
      } else if (b.id === "new") {
        barrierOpen = false;
        resetExperiment();
      }
      return;
    }
  }

  // Sliders.
  for (let s of sliders) {
    if (abs(mouseY - (s.y + 7)) < 15 &&
        mouseX >= s.x - 5 && mouseX <= s.x + s.w + 5) {
      handleSlider(s, mouseX);

      // Initial conditions only change on reset.
      if (s.id === "imbalance") {
        // Let the user choose the value before resetting.
      }
      return;
    }
  }

  // Particle dragging.
  let closest = null;
  let best = 14;

  for (let p of particles) {
    let d = dist(mouseX, mouseY, p.x, p.y);
    if (d < best) {
      closest = p;
      best = d;
    }
  }

  if (closest) {
    selectedParticle = closest;
    return;
  }

  // Clicking inside the chamber injects energy.
  let b = chamber;
  if (mouseX > b.x + 12 && mouseX < b.x + b.w - 12 &&
      mouseY > b.y + 52 && mouseY < b.y + b.h - 16) {
    injectEnergyAt(mouseX, mouseY);
  }
}

function mouseDragged() {
  for (let s of sliders) {
    if (mouseX >= s.x - 5 && mouseX <= s.x + s.w + 5 &&
        abs(mouseY - (s.y + 7)) < 18) {
      handleSlider(s, mouseX);
      return;
    }
  }

  if (selectedParticle) {
    selectedParticle.x = constrain(
      mouseX,
      chamber.x + 14,
      chamber.x + chamber.w - 14
    );
    selectedParticle.y = constrain(
      mouseY,
      chamber.y + 56,
      chamber.y + chamber.h - 20
    );
    selectedParticle.vx = 0;
    selectedParticle.vy = 0;
  }
}

function mouseReleased() {
  selectedParticle = null;
}

function inside(mx, my, b) {
  return mx >= b.x && mx <= b.x + b.w &&
    my >= b.y && my <= b.y + b.h;
}

function injectEnergy() {
  injectEnergyAt(
    random(chamber.x + 30, chamber.x + chamber.w - 30),
    random(chamber.y + 70, chamber.y + chamber.h - 30)
  );
}

function injectEnergyAt(x, y) {
  for (let p of particles) {
    if (dist(x, y, p.x, p.y) < 85) {
      let dx = p.x - x;
      let dy = p.y - y;
      let d = max(1, sqrt(dx * dx + dy * dy));

      p.vx += dx / d * random(1.2, 3.2);
      p.vy += dy / d * random(1.2, 3.2);
    }
  }
}

function keyPressed() {
  if (key === " ") {
    running = !running;
    return false;
  }

  if (key === "r" || key === "R") resetExperiment();

  if (key === "b" || key === "B") {
    barrierOpen = !barrierOpen;
  }

  if (key === "e" || key === "E") injectEnergy();
}
