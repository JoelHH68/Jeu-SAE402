const LEVELS = {
    facile: { cols: 11, rows: 15 },
    moyen: { cols: 19, rows: 29 },
    difficile: { cols: 31, rows: 43 },
};

const gameData = {
    couleur: '#e63946',
    motif: 'rayures',
};

let COLS, ROWS, CELL;

function choixNiv(level) {
    COLS = LEVELS[level].cols;
    ROWS = LEVELS[level].rows;
    CELL = Math.floor(Math.min(
        (window.innerWidth - 32) / COLS,
        (window.innerHeight - 180 - 32) / ROWS
    ));
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    newMaze();
}


const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');

// Couleurs
const C_WALL = '#3b2b1f';     // bois sombre
const C_PATH = '#f2e8d5';     // toile
const C_VISITED = '#e9dcc3';  // tissu légèrement teint
const C_PLAYER = '#2f3e6b';   // indigo (Henriette)
const C_END = '#8b2e2e';      // zone finale
const C_CURRENT = '#d8c7a0';

// Grille : true = mur, false = passage
let grid, player, generating;

let visited_path = [];

// ── helpers ──────────────────────────────────────────────
function idx(c, r) { return r * COLS + c; }

function collision(c, r) {
    return c >= 0 && c < COLS && r >= 0 && r < ROWS;
}

function drawCell(c, r, color) {
    ctx.fillStyle = color;
    ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
}

function drawPlayer() {
    ctx.fillStyle = C_PLAYER;
    ctx.beginPath();
    ctx.arc(player.c * CELL + CELL / 2, player.r * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawEnd() {
    ctx.fillStyle = C_END;
    ctx.fillRect((COLS - 2) * CELL + 4, (ROWS - 2) * CELL + 4, CELL - 8, CELL - 8);
}

// ── génération DFS animée ────────────────────────────────
function newMaze() {
    visited_path = [];
    generating = true;
    document.getElementById('status').textContent = 'Génération en cours...';

    // Tout en murs
    grid = new Array(COLS * ROWS).fill(true);

    // Fond noir
    ctx.fillStyle = C_WALL;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const stack = [];
    const startC = 1, startR = 1;

    function carve(c, r) {
        grid[idx(c, r)] = false;
        drawCell(c, r, C_VISITED);
        stack.push([c, r]);
    }

    carve(startC, startR);

    const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];

    function step() {
        for (let i = 0; i < 3; i++) {
            if (stack.length === 0) {
                // Génération terminée
                generating = false;
                player = { c: 1, r: 1 };
                visited_path.push({ c: 1, r: 1 });
                // Repeindre tout proprement
                redrawAll();
                document.getElementById('status').textContent = 'Utilisez les flèches pour vous déplacer';
                return;
            }

            const [c, r] = stack[stack.length - 1];

            // Voisins non visités (à distance 2)
            const shuffled = dirs.slice().sort(() => Math.random() - 0.5);
            let moved = false;

            for (const [dc, dr] of shuffled) {
                const nc = c + dc, nr = r + dr;
                if (collision(nc, nr) && grid[idx(nc, nr)]) {
                    // Creuse le mur entre les deux
                    grid[idx(c + dc / 2, r + dr / 2)] = false;
                    drawCell(c + dc / 2, r + dr / 2, C_VISITED);
                    carve(nc, nr);
                    // Surligne la cellule courante
                    drawCell(nc, nr, C_CURRENT);
                    moved = true;
                    break;
                }
            }

            if (!moved) stack.pop();
        }

        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

function redrawAll() {

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawCell(c, r, grid[idx(c, r)] ? C_WALL : C_PATH);
        }
    }

    visited_path.forEach(p => {
        ctx.fillStyle = gameData.couleur;
        ctx.fillRect(p.c * CELL, p.r * CELL, CELL, CELL);
    });

    drawEnd();
    drawPlayer();
}

// ── contrôles clavier ────────────────────────────────────
function move(dc, dr) {
    if (generating) return;
    const nc = player.c + dc;
    const nr = player.r + dr;
    if (collision(nc, nr) && !grid[idx(nc, nr)]) {
        player.c = nc;
        player.r = nr;

        if (!visited_path.some(p => p.c === player.c && p.r === player.r))
            visited_path.push({ c: player.c, r: player.r });

        if (player.c === COLS - 2 && player.r === ROWS - 2)
            showEnd();
    }
}

let left = false, right = false, up = false, down = false;

window.addEventListener("keydown", appui);
window.addEventListener("keyup", stopAppui);

function appui(event) {
    switch (event.key) {
        case "ArrowUp": up = true; break;
        case "ArrowLeft": left = true; break;
        case "ArrowRight": right = true; break;
        case "ArrowDown": down = true; break;
    }
}

function stopAppui(event) {
    switch (event.key) {
        case "ArrowUp": up = false; break;
        case "ArrowLeft": left = false; break;
        case "ArrowRight": right = false; break;
        case "ArrowDown": down = false; break;
    }
}

let temps1 = performance.now();
let moveTimer = 0;
const MOVE_DELAY = 100; // ms entre chaque déplacement

function boucle() {
    moteur();
    afficher();
    window.requestAnimationFrame(boucle);
}

function moteur() {
    if (generating) return;

    let temps2 = performance.now();
    let duree = temps2 - temps1;
    temps1 = temps2;

    moveTimer += duree;
    if (moveTimer < MOVE_DELAY) return;
    moveTimer = 0;

    if (up) move(0, -1);
    if (down) move(0, 1);
    if (left) move(-1, 0);
    if (right) move(1, 0);
}

function afficher() {
    if (generating) return;
    redrawAll();
    updateChrono();
}

// Remplace pointerdown/pointerup par touchstart/touchend + mousedown/mouseup
function bindBtn(id, setter) {
    const el = document.getElementById(id);
    const on  = () => setter(true);
    const off = () => setter(false);
    el.addEventListener('mousedown',    on);
    el.addEventListener('mouseup',      off);
    el.addEventListener('mouseleave',   off);
    el.addEventListener('touchstart',   e => { e.preventDefault(); on(); },  { passive: false });
    el.addEventListener('touchend',     e => { e.preventDefault(); off(); }, { passive: false });
    el.addEventListener('touchcancel',  off);
}

bindBtn('btn-up',    v => up    = v);
bindBtn('btn-left',  v => left  = v);
bindBtn('btn-right', v => right = v);
bindBtn('btn-down',  v => down  = v);

document.querySelector('#btn-facile').addEventListener('click', () => choixNiv('facile'));
document.querySelector('#btn-moyen').addEventListener('click', () => choixNiv('moyen'));
document.querySelector('#btn-difficile').addEventListener('click', () => choixNiv('difficile'));


// ── démarrage ────────────────────────────────────────────
choixNiv('moyen');
boucle();



// ── écran de début ───────────────────────────────────────
let selectedLevel = 'moyen';
let startTime = null;

document.querySelectorAll('#niveau-start button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#niveau-start button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedLevel = btn.id.replace('start-', '');
    });
});

// Sélectionne "moyen" par défaut visuellement
document.getElementById('start-moyen').classList.add('selected');

document.getElementById('btn-jouer').addEventListener('click', () => {
    document.getElementById('screen-start').classList.add('hidden');
    choixNiv(selectedLevel);
    startTime = performance.now();
});

// ── écran de fin ─────────────────────────────────────────
function showEnd() {
    const elapsed = Math.floor((performance.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const secondes = elapsed % 60;
    document.getElementById('end-temps').textContent =
        `Temps : ${minutes > 0 ? minutes + 'min ' : ''}${secondes}s`;
    document.getElementById('screen-end').classList.remove('hidden');
}

document.getElementById('btn-rejouer').addEventListener('click', () => {
    document.getElementById('screen-end').classList.add('hidden');
    document.getElementById('screen-start').classList.remove('hidden');
});


function updateChrono() {
    if (!startTime || generating) return;
    const elapsed = Math.floor((performance.now() - startTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secondes = String(elapsed % 60).padStart(2, '0');
    document.getElementById('chrono').textContent = `${minutes}:${secondes}`;
}