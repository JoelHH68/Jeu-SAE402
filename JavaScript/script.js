const LEVELS = {
    facile: { cols: 15, rows: 21, cell: 28 },
    moyen: { cols: 21, rows: 29, cell: 20 },
    difficile: { cols: 41, rows: 57, cell: 10 },
};

let COLS, ROWS, CELL;

function choixNiv(level) {
    COLS = LEVELS[level].cols;
    ROWS = LEVELS[level].rows;
    CELL = LEVELS[level].cell;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    newMaze();
}

let checkpoints, currentCheckpoint;

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
                placeCheckpoints();
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
    drawEnd();
    drawCheckpoints();
    drawPlayer();
}

function placeCheckpoints() {
    checkpoints = [];
    // On cherche des cases qui sont des passages (false) et pas le départ ni l'arrivée
    let candidates = [];
    for (let r = 1; r < ROWS - 1; r++)
        for (let c = 1; c < COLS - 1; c++)
            if (!grid[idx(c, r)] && !(c === 1 && r === 1) && !(c === COLS - 2 && r === ROWS - 2))
                candidates.push([c, r]);

    // On en choisit 2 espacés dans la liste pour qu'ils soient pas collés
    const a = candidates[Math.floor(candidates.length * 0.3)];
    const b = candidates[Math.floor(candidates.length * 0.7)];
    checkpoints = [a, b];
    currentCheckpoint = 0;
}

function drawCheckpoints() {
    checkpoints.forEach((cp, i) => {
        if (i < currentCheckpoint) return; // déjà collecté
        ctx.fillStyle = i === currentCheckpoint ? '#f7c948' : '#aaa';
        ctx.beginPath();
        ctx.arc(cp[0] * CELL + CELL / 2, cp[1] * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        // Numéro
        ctx.fillStyle = '#000';
        ctx.font = `bold ${CELL / 2}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i + 1, cp[0] * CELL + CELL / 2, cp[1] * CELL + CELL / 2);
    });
}

// ── contrôles clavier ────────────────────────────────────
function move(dc, dr) {
  if (generating) return;
  const nc = player.c + dc;
  const nr = player.r + dr;
  if (collision(nc, nr) && !grid[idx(nc, nr)]) {
    player.c = nc;
    player.r = nr;

    const cp = checkpoints[currentCheckpoint];
    if (cp && player.c === cp[0] && player.r === cp[1]) {
      currentCheckpoint++;
      document.getElementById('status').textContent =
        currentCheckpoint < checkpoints.length ? `Checkpoint ${currentCheckpoint}/2 ✓` : 'Plus qu\'un pas vers la sortie !';
    }

    if (player.c === COLS-2 && player.r === ROWS-2 && currentCheckpoint >= checkpoints.length) {
      document.getElementById('status').textContent = '🎉 Bravo, vous avez trouvé la sortie !';
    }

    redrawAll();
  }
}

document.addEventListener('keydown', e => {
  const moves = {
    ArrowUp:    [0, -1],
    ArrowDown:  [0,  1],
    ArrowLeft:  [-1, 0],
    ArrowRight: [1,  0],
  };
  const m = moves[e.key];
  if (!m) return;
  e.preventDefault();
  move(m[0], m[1]);
});

// ── démarrage ────────────────────────────────────────────
choixNiv('moyen');