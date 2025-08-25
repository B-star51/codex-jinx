// 🧠 Cybersecurity Quotes
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

// 🧬 Matrix Animation
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

// 🧭 Transition to Dashboard
setTimeout(() => {
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  canvas.style.display = 'none';
}, 3000);

// 🧠 Show Random Quote on Load
showRandomQuote();

// 📁 Dynamic Sidebar Builder
const fileStructure = {
  "Network": ["nmap.md", "wireshark.md"],
  "Web": ["burpsuite.md", "sqlmap.md"],
  "OSINT": ["recon-ng.md", "theHarvester.md"]
};

function buildSidebar() {
  const sidebar = document.querySelector("aside ul");
  sidebar.innerHTML = "";

  for (const [folder, files] of Object.entries(fileStructure)) {
    const folderItem = document.createElement("li");
    folderItem.textContent = `📁 ${folder}`;
    sidebar.appendChild(folderItem);

    files.forEach(file => {
      const noteItem = document.createElement("li");
      noteItem.textContent = `   └── 📄 ${file.replace(".md", "")}`;
      noteItem.onclick = () => loadNote(`notes/${folder.toLowerCase()}/${file}`);
      sidebar.appendChild(noteItem);
    });
  }
}

buildSidebar();

// 📄 Load Markdown Note
function loadNote(path) {
  fetch(path)
    .then(res => res.text())
    .then(text => {
      document.getElementById('note-viewer').innerText = text;
    });
}

