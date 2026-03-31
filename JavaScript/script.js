const LEVELS = {
    facile:    { cols: 11, rows: 15 },
    moyen:     { cols: 15, rows: 21 },
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
    CELL = Math.floor(Math.min((window.innerWidth -32) / COLS, (window.innerHeight - 32) / ROWS));
    canvas.width  = COLS * CELL;
    canvas.height = ROWS * CELL;
    newMaze();
}


const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

// Couleurs
const C_WALL = '#222';
const C_PATH = '#fff';
const C_VISITED = '#fff';
const C_PLAYER = '#1D9E75';
const C_END = '#D85A30';
const C_CURRENT = '#fff';

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
    document.getElementById('btn').disabled = true;
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
                document.getElementById('btn').disabled = false;
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
            document.getElementById('status').textContent = '🎉 Bravo, vous avez trouvé la sortie !';
    }
}

let left = false, right = false, up = false, down = false;

window.addEventListener("keydown", appui);
window.addEventListener("keyup", stopAppui);

function appui(event) {
    switch(event.key) {
        case "ArrowUp":    up = true;    break;
        case "ArrowLeft":  left = true;  break;
        case "ArrowRight": right = true; break;
        case "ArrowDown":  down = true;  break;
    }
}

function stopAppui(event) {
    switch(event.key) {
        case "ArrowUp":    up = false;    break;
        case "ArrowLeft":  left = false;  break;
        case "ArrowRight": right = false; break;
        case "ArrowDown":  down = false;  break;
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

    if (up)    move(0, -1);
    if (down)  move(0,  1);
    if (left)  move(-1, 0);
    if (right) move(1,  0);
}

function afficher() {
    if (generating) return;
    redrawAll();
}

document.querySelector('#btn-up').addEventListener('pointerdown', () => up = true);
document.querySelector('#btn-up').addEventListener('pointerup', () => up = false);

document.querySelector('#btn-left').addEventListener('pointerdown', () => left = true);
document.querySelector('#btn-left').addEventListener('pointerup', () => left = false);

document.querySelector('#btn-right').addEventListener('pointerdown', () => right = true);
document.querySelector('#btn-right').addEventListener('pointerup', () => right = false);

document.querySelector('#btn-down').addEventListener('pointerdown', () => down = true);
document.querySelector('#btn-down').addEventListener('pointerup', () => down = false);

document.querySelector('#btn-facile').addEventListener('click', () => choixNiv('facile'));
document.querySelector('#btn-moyen').addEventListener('click', () => choixNiv('moyen'));
document.querySelector('#btn-difficile').addEventListener('click', () => choixNiv('difficile'));
document.querySelector('#btn').addEventListener('click', () => newMaze());

// ── démarrage ────────────────────────────────────────────
choixNiv('moyen');
boucle();