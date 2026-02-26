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

// ============================================================
// INITIALISATION
// ============================================================

/**
 * Remplit `board` avec des zeros (EMPTY) sur 6 lignes x 7 colonnes.
 * TODO
 */
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

/**
 * Genere les div.cell dans #board (6 lignes x 7 colonnes).
 * Chaque cellule doit :
 *   - avoir la classe "cell"
 *   - stocker data-row et data-col
 *   - ecouter le clic -> handleCellClick(col)
 * TODO
 */
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

/**
 * Parcourt toutes les cellules et leur applique la bonne classe
 * ("red", "yellow", ou aucune) selon l'etat du tableau `board`.
 * TODO
 */
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

/**
 * Met a jour le texte et la classe de #turn-indicator
 * selon la valeur de `currentPlayer`.
 * TODO
 */
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

/**
 * Met a jour les compteurs #player-score, #ai-score, #draw-score.
 * TODO
 */
function updateScores() {
    document.getElementById("player-score").textContent = scores.player;
    document.getElementById("ai-score").textContent = scores.ai;
    document.getElementById("draw-score").textContent = scores.draw;
}

// ============================================================
// LOGIQUE DU JEU
// ============================================================

/**
 * Cherche la premiere ligne libre (depuis le bas) dans la colonne `col`.
 * Retourne l'index de ligne, ou -1 si la colonne est pleine.
 * TODO
 */
function getEmptyRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === EMPTY) {
            return row;
        }
    }
    return -1; // Colonne pleine
}

/**
 * Pose un jeton pour `player` dans `col` :
 *   - Trouve la ligne via getEmptyRow
 *   - Met a jour board[row][col]
 *   - Pousse { row, col, player } dans moveHistory
 *   - Retourne true si OK, false si colonne pleine
 * TODO
 */
function makeMove(col, player) {
    const row = getEmptyRow(col);
    if (row === -1) return false; // Colonne pleine
    board[row][col] = player;
    moveHistory.push({ row, col, player });
    return true;
}

/**
 * Appele au clic sur une colonne.
 * Doit :
 *   1. Ignorer si gameOver ou pas le tour de PLAYER1
 *   2. Appeler makeMove + updateBoardDisplay
 *   3. Verifier victoire (checkWin) et egalite (isBoardFull)
 *   4. Passer la main a PLAYER2 / l'IA
 *
 * Pour l'instant mode 1v1 : passe directement a PLAYER2
 * Plus tard : brancher l'IA ici (voir section IA en bas)
 * TODO
 */
function handleCellClick(col) {
    if (gameOver) return;
    const player = currentPlayer;
    if (makeMove(col, player)) {
        updateBoardDisplay();
        if (checkWin(player)) {
            endGame(player === PLAYER1 ? "player" : "ai");
        } else if (isBoardFull()) {
            endGame("draw");
        } else {
            currentPlayer = (player === PLAYER1) ? PLAYER2 : PLAYER1;
            updateTurnIndicator();
        }
    }
}

/**
 * Annule le dernier coup joue.
 * Si le dernier coup etait celui de PLAYER2 (IA), annuler aussi
 * le coup precedent (celui de PLAYER1) pour revenir a son tour.
 * TODO
 */
function undoMove() {
    if (moveHistory.length === 0 || gameOver) return;
    const lastMove = moveHistory.pop();
    board[lastMove.row][lastMove.col] = EMPTY;
    
    // Si le dernier coup etait de l'IA, annuler aussi le coup du joueur
    if (lastMove.player === PLAYER2 && moveHistory.length > 0) {
        const playerMove = moveHistory.pop();
        board[playerMove.row][playerMove.col] = EMPTY;
        currentPlayer = PLAYER1; // Revenir au tour du joueur
    } else {
        currentPlayer = lastMove.player; // Revenir au tour du joueur
    }
    
    updateBoardDisplay();
    updateTurnIndicator();
}

// ============================================================
// VERIFICATION DE VICTOIRE
// ============================================================

/**
 * Retourne true si `player` a 4 jetons alignes.
 * Directions a verifier : horizontale, verticale, diag. desc., diag. mont.
 * TODO
 */
function checkWin(player) {
    // Verifier horizontal
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col <= COLS - 4; col++) {
            if (board[row][col] === player &&
                board[row][col + 1] === player &&
                board[row][col + 2] === player &&
                board[row][col + 3] === player) {
                return true;
            }
        }
    }
    // Verifier vertical
    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row <= ROWS - 4; row++) {
            if (board[row][col] === player &&
                board[row + 1][col] === player &&
                board[row + 2][col] === player &&
                board[row + 3][col] === player) {
                return true;
            }
        }
    }
    // Verifier diag. descendante
    for (let row = 0; row <= ROWS - 4; row++) {
        for (let col = 0; col <= COLS - 4; col++) {
            if (board[row][col] === player &&
                board[row + 1][col + 1] === player &&
                board[row + 2][col + 2] === player &&
                board[row + 3][col + 3] === player) {
                return true;
            }
        }
    }
    // Verifier diag. montante
    for (let row = 3; row < ROWS; row++) {
        for (let col = 0; col <= COLS - 4; col++) {
            if (board[row][col] === player &&
                board[row - 1][col + 1] === player &&
                board[row - 2][col + 2] === player &&
                board[row - 3][col + 3] === player) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Ajoute la classe "winning" sur les 4 cellules gagnantes.
 * Meme logique que checkWin, mais on cible les elements DOM.
 * TODO
 */
function highlightWinningCells(player) {
    // Verifier horizontal
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col <= COLS - 4; col++) {
            if (board[row][col] === player &&
                board[row][col + 1] === player &&
                board[row][col + 2] === player &&
                board[row][col + 3] === player) {
                for (let i = 0; i < 4; i++) {
                    document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`).classList.add("winning");
                }
                return;
            }
        }
    }
    // Verifier vertical
    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row <= ROWS - 4; row++) {
            if (board[row][col] === player &&
                board[row + 1][col] === player &&
                board[row + 2][col] === player &&
                board[row + 3][col] === player) {
                for (let i = 0; i < 4; i++) {
                    document.querySelector(`.cell[data-row="${row + i}"][data-col="${col}"]`).classList.add("winning");
                }
                return;
            }
        }
    }
    // Verifier diag. descendante
    for (let row = 0; row <= ROWS - 4; row++) {
        for (let col = 0; col <= COLS - 4; col++) {
            if (board[row][col] === player &&
                board[row + 1][col + 1] === player &&
                board[row + 2][col + 2] === player &&
                board[row + 3][col + 3] === player) {
                for (let i = 0; i < 4; i++) {
                    document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + i}"]`).classList.add("winning");
                }
                return;
            }
        }
    }
    // Verifier diag. montante
    for (let row = 3; row < ROWS; row++) {
        for (let col = 0; col <= COLS - 4; col++) {
            if (board[row][col] === player &&
                board[row - 1][col + 1] === player &&
                board[row - 2][col + 2] === player &&
                board[row - 3][col + 3] === player) {
                for (let i = 0; i < 4; i++) {
                    document.querySelector(`.cell[data-row="${row - i}"][data-col="${col + i}"]`).classList.add("winning");
                }
                return;
            }
        }
    }
    return false;
}

/**
 * Retourne true si la 1re ligne est entierement remplie (board plein).
 * TODO
 */
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
    initBoard();
    currentPlayer = PLAYER1;
    gameOver = false;
    moveHistory = [];
    updateBoardDisplay();
    updateTurnIndicator();
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
    updateTurnIndicator();
};
