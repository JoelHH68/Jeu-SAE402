/**
 * CONFIGURATION DU JEU
 */
const CONFIG = {
    playerColor: "#D4213D",
    patternChar: "❁",
    imgSrc: 'maison_henriette.jpg',
    winTarget: 5,
    // Coordonnées relatives (en % de 0 à 1000 pour la précision)
    // A ajuster pour tes fenêtres
    windows: [
        { id: 0, x: 180, y: 150, w: 120, h: 180 },
        { id: 1, x: 700, y: 150, w: 120, h: 180 },
        { id: 2, x: 180, y: 550, w: 120, h: 180 },
        { id: 3, x: 700, y: 550, w: 120, h: 180 }
    ]
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let sequence = [];
let playerInput = [];
let gameState = 'LOADING';
let particles = [];
let patternCanvas;

// Initialisation
const bg = new Image();
bg.src = CONFIG.imgSrc;
bg.onload = () => {
    resize();
    createPattern();
    gameState = 'IDLE';
    startNextLevel();
};

/**
 * Génère un pattern textile en mémoire
 */
function createPattern() {
    patternCanvas = document.createElement('canvas');
    const pCtx = patternCanvas.getContext('2d');
    patternCanvas.width = 60;
    patternCanvas.height = 60;
    
    // Fond couleur gagnée
    pCtx.fillStyle = CONFIG.playerColor;
    pCtx.fillRect(0, 0, 60, 60);
    
    // Motif blanc par dessus
    pCtx.fillStyle = "rgba(255,255,255,0.3)";
    pCtx.font = "30px serif";
    pCtx.textAlign = "center";
    pCtx.textBaseline = "middle";
    pCtx.fillText(CONFIG.patternChar, 30, 30);
}

function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
}

/**
 * Loop de rendu principale
 */
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Fond
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // 2. Rendu des fenêtres avec masquage
    CONFIG.windows.forEach(win => {
        const rx = (win.x / 1000) * canvas.width;
        const ry = (win.y / 1000) * canvas.height;
        const rw = (win.w / 1000) * canvas.width;
        const rh = (win.h / 1000) * canvas.height;

        // DEBUG : Rectangle rouge de placement (à retirer à la fin)
        ctx.strokeStyle = "red"; ctx.strokeRect(rx, ry, rw, rh);

        if (win.active) {
            ctx.save();
            // Création du masque de découpe pour la fenêtre
            ctx.beginPath();
            ctx.rect(rx, ry, rw, rh);
            ctx.clip();

            // Dessin du pattern textile
            const ptrn = ctx.createPattern(patternCanvas, 'repeat');
            ctx.fillStyle = ptrn;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(rx, ry, rw, rh);
            
            // Effet d'éclat (Bloom)
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.fillRect(rx, ry, rw, rh);
            ctx.restore();
        }
    });

    // 3. Système de particules
    updateParticles();

    requestAnimationFrame(animate);
}

function updateParticles() {
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) particles.splice(i, 1);
        
        ctx.fillStyle = CONFIG.playerColor;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function spawnParticles(x, y) {
    for(let i=0; i<15; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: Math.random() * 5 + 2,
            alpha: 1
        });
    }
}

/**
 * LOGIQUE DE JEU (State Machine)
 */
async function startNextLevel() {
    gameState = 'WATCHING';
    document.getElementById('status').innerText = "OBSERVE...";
    sequence.push(Math.floor(Math.random() * CONFIG.windows.length));
    document.getElementById('score').innerText = `Niveau : ${sequence.length}`;

    for (const id of sequence) {
        await new Promise(r => setTimeout(r, 600));
        CONFIG.windows[id].active = true;
        await new Promise(r => setTimeout(r, 400));
        CONFIG.windows[id].active = false;
    }
    
    gameState = 'PLAYING';
    document.getElementById('status').innerText = "À TOI !";
}

canvas.addEventListener('touchstart', (e) => {
    if (gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mx = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const my = (touch.clientY - rect.top) * (canvas.height / rect.height);

    CONFIG.windows.forEach((win, index) => {
        const rx = (win.x / 1000) * canvas.width;
        const ry = (win.y / 1000) * canvas.height;
        const rw = (win.w / 1000) * canvas.width;
        const rh = (win.h / 1000) * canvas.height;

        if (mx > rx && mx < rx + rw && my > ry && my < ry + rh) {
            handleInput(index, mx, my);
        }
    });
});

function handleInput(id, x, y) {
    if (id === sequence[playerInput.length]) {
        playerInput.push(id);
        spawnParticles(x, y);
        flashWindow(id);
        
        if (playerInput.length === sequence.length) {
            playerInput = [];
            if (sequence.length >= CONFIG.winTarget) {
                gameState = 'WIN';
                document.getElementById('status').innerText = "VICTOIRE !";
                // Ici tu peux déclencher ton animation finale
            } else {
                setTimeout(startNextLevel, 1000);
            }
        }
    } else {
        gameState = 'FAIL';
        document.getElementById('status').innerText = "ERREUR !";
        sequence = []; playerInput = [];
        setTimeout(startNextLevel, 1500);
    }
}

function flashWindow(id) {
    CONFIG.windows[id].active = true;
    setTimeout(() => CONFIG.windows[id].active = false, 300);
}

animate();