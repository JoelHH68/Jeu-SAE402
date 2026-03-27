const canvas = document.getElementById('memoryCanvas');
const ctx = canvas.getContext('2d');
const msg = document.getElementById('msg');

const playerColor = "#D4213D"; 
const patternChar = "❁"; 

const backgroundImage = new Image();
backgroundImage.src = 'Img/maison_henriette.png';

// --- COORDONNÉES AGRANDIES (Basées sur 600x800) ---
// J'ai augmenté la taille des fenêtres (w:120, h:150) pour faciliter le toucher
const windows = [
    { id: 0, x: 100, y: 150, w: 150, h: 200, active: false }, 
    { id: 1, x: 350, y: 150, w: 150, h: 200, active: false }, 
    { id: 2, x: 100, y: 450, w: 150, h: 200, active: false }, 
    { id: 3, x: 350, y: 450, w: 150, h: 200, active: false }
];

let sequence = [];
let playerStep = 0;
let isWatching = true;

backgroundImage.onload = () => {
    msg.innerText = "Observez bien...";
    draw();
    setTimeout(initLevel, 1500);
};

function initLevel() {
    sequence.push(Math.floor(Math.random() * windows.length));
    playSequence();
}

async function playSequence() {
    isWatching = true;
    playerStep = 0;
    msg.innerText = "Séquence en cours...";
    msg.style.color = "#e6d5b8";
    
    for (let id of sequence) {
        await wait(600);
        flashWindow(id);
        await wait(600);
    }
    
    isWatching = false;
    msg.innerText = "À vous ! Touchez les fenêtres.";
    msg.style.color = "gold";
}

function flashWindow(id) {
    const win = windows.find(w => w.id === id);
    if(win) {
        win.active = true;
        draw();
        setTimeout(() => { win.active = false; draw(); }, 500);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (backgroundImage.complete) {
        // Dessine l'image pour qu'elle remplisse le canvas
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    windows.forEach((win) => {
        if(win.active) {
            ctx.save();
            // Halo de lumière plus intense pour mobile
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; 
            ctx.fillRect(win.x, win.y, win.w, win.h);
            
            ctx.shadowBlur = 30;
            ctx.shadowColor = "white";
            ctx.strokeStyle = "gold";
            ctx.lineWidth = 5;
            ctx.strokeRect(win.x, win.y, win.w, win.h);
            
            // Motif plus gros
            ctx.fillStyle = playerColor;
            ctx.shadowBlur = 0;
            ctx.font = "bold 80px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(patternChar, win.x + win.w/2, win.y + win.h/2);
            ctx.restore();
        }
    });
}

// GESTION TOUCHER MOBILE AVEC CALCUL DE RATIO
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isWatching) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    // On calcule où l'utilisateur a touché relativement au dessin interne (600x800)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (touch.clientX - rect.left) * scaleX;
    const my = (touch.clientY - rect.top) * scaleY;
    
    windows.forEach((win) => {
        if (mx > win.x && mx < win.x + win.w && my > win.y && my < win.y + win.h) {
            handlePlayerClick(win.id);
        }
    });
}, { passive: false });

function handlePlayerClick(id) {
    if (id === sequence[playerStep]) {
        flashWindow(id);
        playerStep++;
        if (playerStep === sequence.length) {
            if (sequence.length >= 4) setTimeout(victory, 600);
            else setTimeout(initLevel, 800);
        }
    } else {
        msg.innerText = "Erreur ! Henriette recommence...";
        msg.style.color = "#ff4d4d";
        sequence = [];
        setTimeout(initLevel, 1200);
    }
}

function victory() {
    document.getElementById('win-overlay').style.display = 'flex';
    ctx.globalAlpha = 1;
    ctx.fillStyle = playerColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    ctx.font = "60px serif";
    for(let y=60; y<canvas.height; y+=120) {
        for(let x=60; x<canvas.width; x+=120) {
            ctx.fillText(patternChar, x, y);
        }
    }
}

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }