// 🌓 Theme toggle
window.toggleTheme = function () {
  document.body.classList.toggle("light-mode");
};

// 🧹 Page load par sab reset
window.onload = () => {
  document.getElementById("sizeLimit").value = "default";
  document.getElementById("customSize").value = "";
  document.getElementById("customSize").style.display = "none";

  document.getElementById("dimensionPreset").value = "default";
  ["width", "height", "unit"].forEach(id => {
    document.getElementById(id).value = "";
    document.getElementById(id).style.display = "none";
  });

  document.getElementById("format").value = "image/jpeg";
  document.getElementById("upload").value = "";
  document.getElementById("download").style.display = "none";
  document.getElementById("progress").style.display = "none";

  const cropBox = document.getElementById("cropBox");
  cropBox.style.display = "none";
  document.getElementById("toggleCropBtn").textContent = "✂️ Enable Crop";
};

const upload = document.getElementById("upload");
const dropArea = document.getElementById("drop-area");
const previewCanvas = document.getElementById("previewCanvas");
const ctxPreview = previewCanvas.getContext("2d");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const cropBox = document.getElementById("cropBox");
const toggleCropBtn = document.getElementById("toggleCropBtn");
const resetBtn = document.getElementById("resetBtn");
const processBtn = document.getElementById("processBtn");
const download = document.getElementById("download");
const progress = document.getElementById("progress");

let image = new Image();
let scale = 1, cropEnabled = false, dragging = false, resizing = false;
let startX, startY, resizeCorner = '';
let crop = { left: 50, top: 50, width: 200, height: 200 };

// 📤 File upload
upload.addEventListener("change", () => loadImage(upload.files[0]));
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = e => { image.src = e.target.result; };
  reader.readAsDataURL(file);
}

// 🖱️ Drag & drop
dropArea.addEventListener("dragover", e => {
  e.preventDefault(); dropArea.classList.add("dragover");
});
dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragover");
});
dropArea.addEventListener("drop", e => {
  e.preventDefault(); dropArea.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) loadImage(e.dataTransfer.files[0]);
});

// 🖼️ Image load
image.onload = () => {
  const maxW = 700;
  scale = image.width > maxW ? maxW / image.width : 1;
  previewCanvas.width = image.width * scale;
  previewCanvas.height = image.height * scale;
  ctxPreview.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctxPreview.drawImage(image, 0, 0, previewCanvas.width, previewCanvas.height);
  cropBox.style.display = cropEnabled ? "block" : "none";
  crop = { left: 50, top: 50, width: 200, height: 200 };
  updateCropBox();
};

function updateCropBox() {
  cropBox.style.left = crop.left + "px";
  cropBox.style.top = crop.top + "px";
  cropBox.style.width = crop.width + "px";
  cropBox.style.height = crop.height + "px";
}

// ✂️ Crop toggle
toggleCropBtn.addEventListener("click", () => {
  cropEnabled = !cropEnabled;
  cropBox.style.display = cropEnabled ? "block" : "none";
  toggleCropBtn.textContent = cropEnabled ? "❌ Disable Crop" : "✂️ Enable Crop";
});

// 🖱️ Drag + Resize crop
cropBox.addEventListener("mousedown", e => {
  if (!cropEnabled) return;
  if (e.target.classList.contains("resize-handle")) {
    resizing = true;
    resizeCorner = e.target.dataset.corner;
  } else {
    dragging = true;
  }
  startX = e.clientX;
  startY = e.clientY;
});
document.addEventListener("mousemove", e => {
  if (!cropEnabled || (!dragging && !resizing)) return;
  let dx = e.clientX - startX;
  let dy = e.clientY - startY;
  if (dragging) {
    crop.left += dx; crop.top += dy;
  } else {
    if (resizeCorner.includes("r")) crop.width += dx;
    if (resizeCorner.includes("l")) { crop.left += dx; crop.width -= dx; }
    if (resizeCorner.includes("b")) crop.height += dy;
    if (resizeCorner.includes("t")) { crop.top += dy; crop.height -= dy; }
  }
  startX = e.clientX;
  startY = e.clientY;
  updateCropBox();
});
document.addEventListener("mouseup", () => {
  dragging = false; resizing = false;
});

// 📐 Dimension input toggle
document.getElementById("dimensionPreset").addEventListener("change", () => {
  const show = document.getElementById("dimensionPreset").value === "custom";
  ["width", "height", "unit"].forEach(id => {
    document.getElementById(id).style.display = show ? "inline-block" : "none";
  });
});

// 💾 Size limit input toggle
document.getElementById("sizeLimit").addEventListener("change", () => {
  document.getElementById("customSize").style.display =
    document.getElementById("sizeLimit").value === "custom" ? "inline-block" : "none";
});

// 🔧 Process image
processBtn.addEventListener("click", () => {
  if (!image.src) return alert("Upload image first!");
  download.style.display = "none";
  progress.style.display = "block";
  progress.textContent = "🔄 Working... -------> 0%";

  const format = document.getElementById("format").value;
  const sizeVal = document.getElementById("sizeLimit").value;
  const targetSize = sizeVal === "custom"
    ? parseInt(document.getElementById("customSize").value) * 1024
    : sizeVal === "default" ? Infinity : parseInt(sizeVal);

  let cropX = cropEnabled ? crop.left / scale : 0;
  let cropY = cropEnabled ? crop.top / scale : 0;
  let cropW = cropEnabled ? crop.width / scale : image.width;
  let cropH = cropEnabled ? crop.height / scale : image.height;

  let width = cropW, height = cropH;
  const dimPreset = document.getElementById("dimensionPreset").value;
  if (dimPreset === "custom") {
    width = parseFloat(document.getElementById("width").value) || cropW;
    height = parseFloat(document.getElementById("height").value) || cropH;
    const unit = document.getElementById("unit").value;
    if (unit === "cm") { width *= 37.8; height *= 37.8; }
    else if (unit === "mm") { width *= 3.78; height *= 3.78; }
    else if (unit === "in") { width *= 96; height *= 96; }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, width, height);

  let quality = 0.92;
  const ext = format.split("/")[1];

  function compressLoop() {
    canvas.toBlob(blob => {
      progress.textContent = `🔄 Working... -------> ${(quality * 100).toFixed(0)}%`;
      if (blob.size <= targetSize || quality <= 0.1 || format === "image/png") {
        const url = URL.createObjectURL(blob);
        download.href = url;
        download.download = `compressed.${ext}`;
        download.style.display = "inline-block";
        progress.textContent = "✅ Done -------> 100%";
      } else {
        quality -= 0.05;
        compressLoop();
      }
    }, format, quality);
  }

  compressLoop();
});

// ♻️ Reset
resetBtn.addEventListener("click", () => {
  image.src = "";
  ctxPreview.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  cropBox.style.display = "none";
  download.style.display = "none";
  progress.style.display = "none";
  upload.value = "";
});
