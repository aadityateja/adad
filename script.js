// Close button functionality
document.querySelector(".close").addEventListener("click", function() {
  document.querySelector(".window").style.display = "none";
});

// Make window draggable
const win = document.querySelector(".window");
const bar = document.querySelector(".title-bar");
let offsetX = 0, offsetY = 0, isDown = false;

bar.addEventListener("mousedown", (e) => {
  isDown = true;
  offsetX = e.clientX - win.offsetLeft;
  offsetY = e.clientY - win.offsetTop;
});

document.addEventListener("mouseup", () => isDown = false);

document.addEventListener("mousemove", (e) => {
  if (isDown) {
    win.style.left = (e.clientX - offsetX) + "px";
    win.style.top = (e.clientY - offsetY) + "px";
  }
});
