const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// STAR + PARTICLE SETTINGS
const stars = [];
const numStars = 400;

for (let i = 0; i < numStars; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * canvas.width,
        size: Math.random() * 2 + 0.2
    });
}

function animate() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let star of stars) {
        star.z -= 2;

        if (star.z <= 0) {
            star.z = canvas.width;
        }

        let k = 128 / star.z;
        let px = star.x * k + canvas.width / 2;
        let py = star.y * k + canvas.height / 2;

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
            let size = (1 - star.z / canvas.width) * star.size;
            ctx.beginPath();
            ctx.fillStyle = "white";
            ctx.arc(px, py, size, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    requestAnimationFrame(animate);
}

animate();

// Resize
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
