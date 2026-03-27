const canvas = document.getElementById('memoryCanvas');
const ctx = canvas.getContext('2d');
const msg = document.getElementById('msg');

const playerColor = "#D4213D"; 
const patternChar = "❁"; 

const backgroundImage = new Image();
backgroundImage.src = 'Img/maison_henriette.png';

// --- COORDONNÉES ADAPTÉES (Ratio 400x500 pour mobile) ---
// Tu devras peut-être les ré-ajuster légèrement pour ton image mobile
const windows = [
    { id: 0, x: 80, y: 100, w: 70, h: 90, active: false }, 
    { id: 1, x: 250, y: 100, w: 70, h: 90, active: false }, 
    { id: 2, x: 80, y: 280, w: 70, h: 90, active: false }, 
    { id: 3, x: 250, y: 280, w: 70, h: 90, active: false }
];

let sequence = [];
let playerStep = 0;
let isWatching = true;

backgroundImage.onload = () => {
    msg.innerText = "Observez les fenêtres...";
    draw();
    setTimeout(initLevel, 1000);
};

function initLevel() {
    sequence.push(Math.floor(Math.random() * windows.length));
    playSequence();
}

async function playSequence() {
    isWatching = true;
    playerStep = 0;
    msg.innerText = "Observez...";
    
    for (let id of sequence) {
        await wait(600);
        flashWindow(id);
        await wait(600);
    }
    
    isWatching = false;
    msg.innerText = "À vous ! Touchez les fenêtres.";
}

function flashWindow(id) {
    const win = windows.find(w => w.id === id);
    if(win) {
        win.active = true;
        draw();
        setTimeout(() => { win.active = false; draw(); }, 400);
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
            ctx.fillStyle = "rgba(255, 240, 150, 0.5)"; 
            ctx.fillRect(win.x, win.y, win.w, win.h);
            ctx.fillStyle = playerColor;
            ctx.font = "bold 40px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(patternChar, win.x + win.w/2, win.y + win.h/2);
            ctx.restore();
        }
    });
}

// --- GESTION DU TOUCHER (MOBILE) ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Empêche le comportement par défaut
    if (isWatching) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Calcul de la position réelle sur le canvas (gestion du scale CSS)
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
        msg.innerText = "Raté ! On recommence...";
        sequence = [];
        setTimeout(initLevel, 1000);
    }
}

function victory() {
    document.getElementById('win-overlay').style.display = 'flex';
    ctx.fillStyle = playerColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "40px serif";
    for(let y=40; y<canvas.height; y+=80) {
        for(let x=40; x<canvas.width; x+=80) {
            ctx.fillText(patternChar, x, y);
        }
    }
}

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }