// ============================================================
// CONFIGURATION
// ============================================================
const ROWS = 6;
const COLS = 7;
const EMPTY   = 0;
const PLAYER1 = 1; // Rouge  (Joueur humain)
const PLAYER2 = 2; // Jaune  (2e joueur ou IA)

// ============================================================
// ETAT DU JEU
// ============================================================
let board = [];           // Tableau 2D [row][col]
let currentPlayer = PLAYER1;
let gameOver = false;
let moveHistory = [];     // { row, col, player } pour l'undo
let scores = { player: 0, ai: 0, draw: 0 };
let pionsjoues = 0; // Compterus pour le nombre de pions joués
// ============================================================
// INITIALISATION
// ============================================================

// Initialise le tableau `board` a un tableau 2D rempli de EMPTY (0).
function initBoard() {
    let newBoard = [];
    for (let i = 0; i < ROWS; i++) {
        let row = [];
        for (let j = 0; j < COLS; j++) {
            row.push(EMPTY);
        }
        newBoard.push(row);
    }
    board = newBoard;
}

// Génération des cellules avec un listener pour detecter les clics
function createBoardHTML() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = ""; // Clear any existing cells
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener("click", () => handleCellClick(col));
            boardDiv.appendChild(cell);
        }
    }
}

// ============================================================
// INTERFACE
// ============================================================

// Syncronise l'affichage du plateau avec le tableau `board`.
function updateBoardDisplay() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        cell.className = "cell";
        if (board[row][col] === PLAYER1) {
            cell.classList.add("red");
        } else if (board[row][col] === PLAYER2) {
            cell.classList.add("yellow");
        }
    });
}

// Mise a jour du texte et du style de l'indicateur de tour
function updateTurnIndicator() {
    const indicator = document.getElementById("turn-indicator");
    if (currentPlayer === PLAYER1) {
        indicator.textContent = "Tour du Joueur 1 (Rouge)";
        indicator.classList.remove("player2");
    } else {
        indicator.textContent = "Tour du Joueur 2 (Jaune)";
        indicator.classList.add("player2");
    }
}

// Mise a jour des scores
function updateScores() {
    document.getElementById("player-score").textContent = scores.player;
    document.getElementById("ai-score").textContent = scores.ai;
    document.getElementById("draw-score").textContent = scores.draw;
}

// Mise a jour des stats
function updateStats() {
    document.getElementById("pions-joues").textContent = pionsjoues;
    if (pionsjoues > 0 ){
        document.getElementById("Changecouleur").style.display = "none";
        document.getElementById("undoMove").style.display = "block";
    }
}

// Permet de changer la couleur du joueur au début de la partie, avant que les pions soient joués.
function changeColor() {
    if (currentPlayer === PLAYER1) {
        currentPlayer = PLAYER2;
    } else {
        currentPlayer = PLAYER1;
    }
    updateTurnIndicator();
}

// ============================================================
// LOGIQUE DU JEU
// ============================================================

// Retourne la ligne la plus basse disponible dans `col`, ou -1 si la colonne est pleine.
function getEmptyRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === EMPTY) {
            return row;
        }
    }
    return -1; // Colonne pleine
}

// Permet au joueur de choisir aléatoirement
function RandomMove() {
    if (gameOver) return;
    const validColumns = getValidColumns();
    if (validColumns.length === 0) return;
    
    const randomColumn = validColumns[Math.floor(Math.random() * validColumns.length)];
    handleCellClick(randomColumn);
}

// Place un jeton pour `player` dans la colonne `col` si possible.
function makeMove(col, player) {
    const row = getEmptyRow(col);
    if (row === -1) return false; // Colonne pleine
    board[row][col] = player;
    moveHistory.push({ row, col, player });
    pionsjoues++;
    updateStats();
    return true;
}

// Gere le clic sur une colonne : tente de jouer, puis verifie victoire ou match nul, et change de joueur.
function handleCellClick(col) {
    // Si la partie est finie, ne rien faire
    if (gameOver) return;
    const player = currentPlayer;
    // Si le coup est valide, mettre a jour l'affichage et verifier la fin de partie
    if (makeMove(col, player)) {
        updateBoardDisplay();
        if (checkWin(player)) {
            setTimeout(() => endGame(player === PLAYER1 ? "player" : "ai"), 400);
        } else if (isBoardFull()) {
            endGame("draw");
        } else {
            currentPlayer = (player === PLAYER1) ? PLAYER2 : PLAYER1;
            updateTurnIndicator();
        }
    }
}

// Permet de revenir en arriere sur le dernier coup joue (pour le joueur humain uniquement).
function undoMove() {
    if (moveHistory.length === 0 || gameOver) return;
    const lastMove = moveHistory.pop();
    board[lastMove.row][lastMove.col] = EMPTY;
    currentPlayer = lastMove.player;
    pionsjoues--;
    updateBoardDisplay();
    updateTurnIndicator();
    updateStats();
}

// ============================================================
// VERIFICATION DE VICTOIRE
// ============================================================

// Vérifie si `player` a gagné.
// Si oui, surligne les 4 cellules gagnantes et retourne true.
function checkWin(player) {
    const directions = [
        (r, c, i) => [r,     c + i], // horizontal
        (r, c, i) => [r + i, c    ], // vertical
        (r, c, i) => [r + i, c + i], // diag. descendante
        (r, c, i) => [r - i, c + i], // diag. montante
    ];
    const starts = [
        () => { const s = []; for (let r = 0; r < ROWS; r++)     for (let c = 0; c <= COLS-4; c++) s.push([r,c]); return s; },
        () => { const s = []; for (let c = 0; c < COLS; c++)     for (let r = 0; r <= ROWS-4; r++) s.push([r,c]); return s; },
        () => { const s = []; for (let r = 0; r <= ROWS-4; r++)  for (let c = 0; c <= COLS-4; c++) s.push([r,c]); return s; },
        () => { const s = []; for (let r = 3; r < ROWS; r++)     for (let c = 0; c <= COLS-4; c++) s.push([r,c]); return s; },
    ];

    for (let d = 0; d < 4; d++) {
        for (const [r, c] of starts[d]()) {
            const cells = [0,1,2,3].map(i => directions[d](r, c, i));
            if (cells.every(([row, col]) => board[row][col] === player)) {
                cells.forEach(([row, col]) =>
                    document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`).classList.add("winning")
                );
                return true;
            }
        }
    }
    return false;
}

// Vérifie si le plateau est plein (match nul).
function isBoardFull() {
    for (let col = 0; col < COLS; col++) {
        if (board[0][col] === EMPTY) {
            return false; // Il y a au moins une colonne avec de la place
        }
    }
    return true; // Toutes les colonnes sont pleines
}

// ============================================================
// FIN DE PARTIE
// ============================================================

/**
 * Gere la fin de partie :
 *   - Met gameOver a true
 *   - Incremente le bon compteur dans `scores`
 *   - Remplit et affiche le modal #game-modal
 * @param {string} result - "player", "ai", ou "draw"
 * TODO
 */
function endGame(result) {
    gameOver = true;
    const title   = document.getElementById("modal-title");
    const message = document.getElementById("modal-message");
    if (result === "player") {
        scores.player++;
        title.textContent   = "Victoire !";
        message.textContent = "Le Joueur 1 (Rouge) a gagné !";
    } else if (result === "ai") {
        scores.ai++;
        title.textContent   = "Défaite";
        message.textContent = "Le Joueur 2 (Jaune) a gagné !";
    } else {
        scores.draw++;
        title.textContent   = "Égalité";
        message.textContent = "Match nul !";
    }
    updateScores();
    document.getElementById("game-modal").classList.add("visible");
}

/**
 * Remet le jeu a zero (board, currentPlayer, gameOver, moveHistory)
 * sans toucher aux scores.
 * TODO
 */
function resetGame() {
    document.getElementById("Changecouleur").style.display = "block";
    initBoard();
    currentPlayer = PLAYER1;
    gameOver = false;
    moveHistory = [];
    pionsjoues = 0;
    updateBoardDisplay();
    updateTurnIndicator();
    updateStats();
}

/**
 * Ferme le modal puis appelle resetGame().
 * TODO
 */
function closeModalAndReset() {
    document.getElementById("game-modal").classList.remove("visible");
    resetGame();
}

// ============================================================
// API POUR L'IA  (a brancher dans handleCellClick plus tard)
// ============================================================

/** Retourne une copie du plateau courant (0=vide, 1=J1, 2=J2). */
function getBoard() {
    return board.map(row => [...row]);
}

/** Retourne la liste des colonnes encore jouables. */
function getValidColumns() {
    const cols = [];
    for (let col = 0; col < COLS; col++) {
        if (getEmptyRow(col) !== -1) cols.push(col);
    }
    return cols;
}

/**
 * Quand l'IA aura calcule son coup, appeler cette fonction
 * avec la colonne choisie.
 * TODO (a completer quand l'IA sera implementee)
 */
function playAIMove(col) {
    // TODO
}

// ============================================================
// LANCEMENT AU CHARGEMENT DE LA PAGE
// ============================================================
window.onload = function () {
    initBoard();
    createBoardHTML();
    updateScores();
    updateStats();
    updateTurnIndicator();
};
