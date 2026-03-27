const canvas = document.getElementById('memoryCanvas');
const ctx = canvas.getContext('2d');
const msg = document.getElementById('msg');

// --- 1. VARIABLES DES JEUX PRÉCÉDENTS (A LIER) ---
const playerColor = "#D4213D"; // Ta couleur gagnée
const patternChar = "❁";       // Ton motif gagné

// --- 2. CHARGEMENT DE L'IMAGE DE FOND ---
const backgroundImage = new Image();
backgroundImage.src = 'Img/maison_henriette.png'; // <--- TON IMAGE ICI

// --- 3. CONFIGURATION DES FENÊTRES (A AJUSTER SELON TA PHOTO) ---
const windows = [
    { id: 0, x: 180, y: 150, w: 70, h: 100, active: false }, 
    { id: 1, x: 550, y: 150, w: 70, h: 100, active: false }, 
    { id: 2, x: 180, y: 350, w: 70, h: 100, active: false }, 
    { id: 3, x: 550, y: 350, w: 70, h: 100, active: false }
];

let sequence = [];
let playerStep = 0;
let isWatching = true;

backgroundImage.onload = () => {
    msg.innerText = "Observez la séquence des fenêtres...";
    draw();
    setTimeout(initLevel, 1500);
};

backgroundImage.onerror = () => {
    msg.innerText = "Erreur : 'maison_henriette.png' introuvable.";
    msg.style.color = "red";
};

function initLevel() {
    const nextWin = Math.floor(Math.random() * windows.length);
    sequence.push(nextWin);
    playSequence();
}

async function playSequence() {
    isWatching = true;
    playerStep = 0;
    msg.innerText = "Observez bien...";
    msg.style.color = "#e6d5b8";
    
    for (let id of sequence) {
        await wait(700);
        flashWindow(id);
        await wait(700);
    }
    
    isWatching = false;
    msg.innerText = "À vous ! Cliquez sur les fenêtres dans l'ordre.";
    msg.style.color = "gold";
}

function flashWindow(id) {
    const win = windows.find(w => w.id === id);
    if(win) {
        win.active = true;
        draw();
        setTimeout(() => {
            win.active = false;
            draw();
        }, 500);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    windows.forEach((win) => {
        if(win.active) {
            ctx.save();
            ctx.fillStyle = "rgba(255, 240, 150, 0.4)"; 
            ctx.fillRect(win.x, win.y, win.w, win.h);
            
            ctx.shadowBlur = 20;
            ctx.shadowColor = "white";
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.strokeRect(win.x, win.y, win.w, win.h);
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = playerColor;
            ctx.font = `bold ${win.w/1.5}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(patternChar, win.x + win.w/2, win.y + win.h/2);
            ctx.restore();
        }
    });
}

canvas.addEventListener('mousedown', (e) => {
    if (isWatching) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    windows.forEach((win) => {
        if (mx > win.x && mx < win.x + win.w && my > win.y && my < win.y + win.h) {
            handlePlayerClick(win.id);
        }
    });
});

function handlePlayerClick(id) {
    if (id === sequence[playerStep]) {
        flashWindow(id);
        playerStep++;
        if (playerStep === sequence.length) {
            if (sequence.length >= 4) setTimeout(victory, 800);
            else setTimeout(initLevel, 1000);
        }
    } else {
        msg.innerText = "Erreur ! Henriette recommence la séquence...";
        msg.style.color = "#ff4444";
        sequence = [];
        setTimeout(initLevel, 1500);
    }
}

function victory() {
    isWatching = true;
    document.getElementById('win-overlay').style.display = 'flex';
    
    ctx.globalAlpha = 1;
    ctx.fillStyle = playerColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "50px serif";
    for(let y=50; y<canvas.height; y+=100) {
        for(let x=50; x<canvas.width; x+=100) {
            ctx.fillText(patternChar, x, y);
        }
    }
}

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }