// 🧠 Quotes
const quotes = [
  "“Hackers are artists of logic.”",
  "“Security is not a product, it’s a process.”",
  "“The best defense is knowing your offense.”",
  "“Every system has a weakness — find it.”",
  "“Obscurity is not security.”",
  "“Tools don’t hack. Hackers do.”",
  "“Recon is the soul of the breach.”",
  "“The quieter you become, the more you are able to hear.”",
  "“Firewalls don’t stop curiosity.”",
  "“A good hacker knows when not to hack.”"
];

function showRandomQuote() {
  const quoteBox = document.querySelector(".quote");
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  quoteBox.textContent = random;
}

// 🧬 Matrix
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

const chars = "01#@$%&*";
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
  ctx.fillStyle = "rgba(10, 31, 68, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00ffff";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    drops[i]++;
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
  }
}

setInterval(drawMatrix, 50);

// 🧭 Transition
setTimeout(() => {
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  canvas.style.display = 'none';
}, 4000);

showRandomQuote();
setInterval(showRandomQuote, 5000);

// 📁 File System
let folders = {
  "Network": ["Nmap"],
  "Web": ["BurpSuite"],
  "OSINT": ["Recon-ng"]
};

let currentNote = "";

function buildSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = "";

  for (const [folder, files] of Object.entries(folders)) {
    const folderItem = document.createElement("li");
    folderItem.textContent = `📁 ${folder}`;
    sidebar.appendChild(folderItem);

    files.forEach(file => {
      const noteItem = document.createElement("li");
      noteItem.textContent = `   └── 📄 ${file}`;
      noteItem.onclick = () => loadNote(folder, file);
      sidebar.appendChild(noteItem);
    });
  }
}

function addFolder() {
  const name = prompt("Enter folder name:");
  if (name && !folders[name]) {
    folders[name] = [];
    buildSidebar();
  }
}

function saveNote() {
  if (!currentNote) return;
  const content = document.getElementById("editor").value;
  localStorage.setItem(currentNote, content);
  alert("Note saved!");
}

function loadNote(folder, file) {
  currentNote = `${folder}/${file}`;
  const content = localStorage.getItem(currentNote) || "";
  document.getElementById("editor").value = content;
}

buildSidebar();
