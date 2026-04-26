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
let aiThinking = false;

// ============================================================
// SAUVEGARDE ET CHARGEMENT
// ============================================================
function updateLoadButtonState() {
    const btnLoad = document.getElementById("btn-load-game");
    if (!btnLoad) return;
    if (localStorage.getItem("puissance4_save")) {
        btnLoad.classList.add("has-save");
        btnLoad.textContent = "Charger (Dispo)";
    } else {
        btnLoad.classList.remove("has-save");
        btnLoad.textContent = "Charger";
    }
}

function saveGame() {
    const gameState = {
        board, currentPlayer, gameOver, moveHistory, scores, pionsjoues
    };
    localStorage.setItem("puissance4_save", JSON.stringify(gameState));
    updateLoadButtonState();
    alert("Partie sauvegardée !");
}

function loadGame() {
    const saved = localStorage.getItem("puissance4_save");
    if (saved) {
        const gameState = JSON.parse(saved);
        board = gameState.board;
        currentPlayer = gameState.currentPlayer;
        gameOver = gameState.gameOver;
        moveHistory = gameState.moveHistory;
        scores = gameState.scores;
        pionsjoues = gameState.pionsjoues;
        updateBoardDisplay();
        updateTurnIndicator();
        updateScores();
        updateStats();
        
        const opponentType = document.getElementById("opponent-type") ? document.getElementById("opponent-type").value : "humain";
        if (opponentType === "ia" && currentPlayer === PLAYER2 && !gameOver) {
            triggerAI();
        }
        alert("Partie chargée !");
    } else {
        alert("Aucune sauvegarde trouvée.");
    }
}

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

function updatePossibleMovesDisplay() {
    document.querySelectorAll('.cell.possible-move').forEach(c => c.classList.remove('possible-move'));
    if (gameOver || aiThinking) return;
    const opponentType = document.getElementById("opponent-type") ? document.getElementById("opponent-type").value : "humain";
    if (opponentType === "ia" && currentPlayer === PLAYER2) return; 

    for (let c = 0; c < COLS; c++) {
        let r = getEmptyRow(c);
        if (r !== -1) {
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell) cell.classList.add('possible-move');
        }
    }
}

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
    updatePossibleMovesDisplay();
}

// Mise a jour du texte et du style de l'indicateur de tour
function updateTurnIndicator() {
    const indicator = document.getElementById("turn-indicator");
    if (currentPlayer === PLAYER1) {
        indicator.textContent = "Tour du Joueur 1 (Rouge)";
        indicator.classList.remove("player2");
    } else {
        indicator.textContent = aiThinking ? "Tour du Joueur 2 (Jaune) - Réflexion..." : "Tour du Joueur 2 (Jaune)";
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
function handleCellClick(col, fromAI = false) {
    if (gameOver || aiThinking) return;
    const opponentType = document.getElementById("opponent-type") ? document.getElementById("opponent-type").value : "humain";
    if (opponentType === "ia" && currentPlayer === PLAYER2 && !fromAI) return;
    
    const player = currentPlayer;
    if (makeMove(col, player)) {
        updateBoardDisplay();
        if (checkWin(player)) {
            setTimeout(() => endGame(player === PLAYER1 ? "player" : "ai"), 400);
        } else if (isBoardFull()) {
            endGame("draw");
        } else {
            currentPlayer = (player === PLAYER1) ? PLAYER2 : PLAYER1;
            updateTurnIndicator();
            updatePossibleMovesDisplay();
            
            if (opponentType === "ia" && currentPlayer === PLAYER2) {
                triggerAI();
            }
        }
    }
}

// Permet de revenir en arriere sur le dernier coup joue (pour le joueur humain uniquement).
function undoMove() {
    if (moveHistory.length === 0 || gameOver || aiThinking) return;
    const lastMove = moveHistory.pop();
    board[lastMove.row][lastMove.col] = EMPTY;
    currentPlayer = lastMove.player;
    pionsjoues--;
    updateBoardDisplay();
    updateTurnIndicator();
    updateStats();
    updatePossibleMovesDisplay();
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
    aiThinking = false;
    updateBoardDisplay();
    updateTurnIndicator();
    updateStats();
    
    const opponentType = document.getElementById("opponent-type") ? document.getElementById("opponent-type").value : "humain";
    if (opponentType === "ia" && currentPlayer === PLAYER2) {
        triggerAI();
    }
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
// IA - MINIMAX
// ============================================================

// Vérifie une victoire sur un plateau donné SANS toucher au DOM
function checkWinPure(b, player) {
    const directions = [
        (r, c, i) => [r,     c + i],
        (r, c, i) => [r + i, c    ],
        (r, c, i) => [r + i, c + i],
        (r, c, i) => [r - i, c + i],
    ];
    const starts = [
        () => { const s = []; for (let r = 0; r < ROWS; r++)    for (let c = 0; c <= COLS-4; c++) s.push([r,c]); return s; },
        () => { const s = []; for (let c = 0; c < COLS; c++)    for (let r = 0; r <= ROWS-4; r++) s.push([r,c]); return s; },
        () => { const s = []; for (let r = 0; r <= ROWS-4; r++) for (let c = 0; c <= COLS-4; c++) s.push([r,c]); return s; },
        () => { const s = []; for (let r = 3; r < ROWS; r++)    for (let c = 0; c <= COLS-4; c++) s.push([r,c]); return s; },
    ];

    for (let d = 0; d < 4; d++) {
        for (const [r, c] of starts[d]()) {
            const cells = [0,1,2,3].map(i => directions[d](r, c, i));
            if (cells.every(([row, col]) => b[row][col] === player)) return true;
        }
    }
    return false;
}

// ============================================================
// IA - MINIMAX & ALPHABETA
// ============================================================

function evaluateWindow(window, player) {
    let score = 0;
    const opp = player === PLAYER1 ? PLAYER2 : PLAYER1;
    let countPlayer = 0;
    let countOpp = 0;
    let countEmpty = 0;

    for (let i = 0; i < 4; i++) {
        if (window[i] === player) countPlayer++;
        else if (window[i] === opp) countOpp++;
        else countEmpty++;
    }

    if (countPlayer === 4) score += 1000;
    else if (countPlayer === 3 && countEmpty === 1) score += 5;
    else if (countPlayer === 2 && countEmpty === 2) score += 2;

    if (countOpp === 4) score -= 1000;
    else if (countOpp === 3 && countEmpty === 1) score -= 50; 
    else if (countOpp === 2 && countEmpty === 2) score -= 4; 

    return score;
}

function evaluateBoard(b, player) {
    let score = 0;
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
        if (b[r][3] === player) centerCount++;
    }
    score += centerCount * 3;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            score += evaluateWindow([b[r][c], b[r][c+1], b[r][c+2], b[r][c+3]], player);
        }
    }
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            score += evaluateWindow([b[r][c], b[r+1][c], b[r+2][c], b[r+3][c]], player);
        }
    }
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            score += evaluateWindow([b[r][c], b[r+1][c+1], b[r+2][c+2], b[r+3][c+3]], player);
        }
    }
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            score += evaluateWindow([b[r+3][c], b[r+2][c+1], b[r+1][c+2], b[r][c+3]], player);
        }
    }
    return score;
}

function isTerminalNode(b) {
    return checkWinPure(b, PLAYER1) || checkWinPure(b, PLAYER2) || getValidColumnsBoard(b).length === 0;
}

function getValidColumnsBoard(b) {
    const valid = [];
    for (let c = 0; c < COLS; c++) {
        if (b[0][c] === EMPTY) valid.push(c);
    }
    return valid;
}

function getNextOpenRow(b, c) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (b[r][c] === EMPTY) return r;
    }
    return -1;
}

function minimax(b, depth, isMaximizing) {
    const isTerminal = isTerminalNode(b);
    if (depth === 0 || isTerminal) {
        if (isTerminal) {
            if (checkWinPure(b, PLAYER2)) return 10000000 - (10 - depth);
            else if (checkWinPure(b, PLAYER1)) return -10000000 + (10 - depth);
            else return 0;
        } else {
            return evaluateBoard(b, PLAYER2);
        }
    }

    const validCols = getValidColumnsBoard(b);
    if (isMaximizing) {
        let value = -Infinity;
        for (const col of validCols) {
            const row = getNextOpenRow(b, col);
            let bCopy = b.map(r => [...r]);
            bCopy[row][col] = PLAYER2;
            const newScore = minimax(bCopy, depth - 1, false);
            if (newScore > value) value = newScore;
        }
        return value;
    } else {
        let value = Infinity;
        for (const col of validCols) {
            const row = getNextOpenRow(b, col);
            let bCopy = b.map(r => [...r]);
            bCopy[row][col] = PLAYER1;
            const newScore = minimax(bCopy, depth - 1, true);
            if (newScore < value) value = newScore;
        }
        return value;
    }
}

function alphabeta(b, depth, alpha, beta, isMaximizing) {
    const isTerminal = isTerminalNode(b);
    if (depth === 0 || isTerminal) {
        if (isTerminal) {
            if (checkWinPure(b, PLAYER2)) return 10000000 - (10 - depth);
            else if (checkWinPure(b, PLAYER1)) return -10000000 + (10 - depth);
            else return 0;
        } else {
            return evaluateBoard(b, PLAYER2);
        }
    }

    const validCols = getValidColumnsBoard(b);
    const centerPreference = [3, 2, 4, 1, 5, 0, 6];
    validCols.sort((a, b) => centerPreference.indexOf(a) - centerPreference.indexOf(b));

    if (isMaximizing) {
        let value = -Infinity;
        for (const col of validCols) {
            const row = getNextOpenRow(b, col);
            let bCopy = b.map(r => [...r]);
            bCopy[row][col] = PLAYER2;
            const newScore = alphabeta(bCopy, depth - 1, alpha, beta, false);
            if (newScore > value) value = newScore;
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        return value;
    } else {
        let value = Infinity;
        for (const col of validCols) {
            const row = getNextOpenRow(b, col);
            let bCopy = b.map(r => [...r]);
            bCopy[row][col] = PLAYER1;
            const newScore = alphabeta(bCopy, depth - 1, alpha, beta, true);
            if (newScore < value) value = newScore;
            beta = Math.min(beta, value);
            if (alpha >= beta) break;
        }
        return value;
    }
}

function bestMove(depth) {
    const validCols = getValidColumnsBoard(board);
    if (validCols.length === 0) return -1;

    const algo = document.getElementById("ai-algo") ? document.getElementById("ai-algo").value : "minimax";
    let bestScore = -Infinity;
    
    const centerPreference = [3, 2, 4, 1, 5, 0, 6];
    validCols.sort((a, b) => centerPreference.indexOf(a) - centerPreference.indexOf(b));
    let bestCol = validCols[0];
    
    for (const col of validCols) {
        const row = getNextOpenRow(board, col);
        let bCopy = board.map(r => [...r]);
        bCopy[row][col] = PLAYER2;
        
        let score;
        if (algo === "alphabeta") {
            score = alphabeta(bCopy, depth - 1, -Infinity, Infinity, false);
        } else {
            score = minimax(bCopy, depth - 1, false);
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestCol = col;
        }
    }
    return bestCol;
}

function triggerAI() {
    if (gameOver || currentPlayer !== PLAYER2) return;
    const opponentType = document.getElementById("opponent-type") ? document.getElementById("opponent-type").value : "humain";
    if (opponentType !== "ia") return;

    aiThinking = true;
    updateTurnIndicator();
    
    setTimeout(() => {
        const startTime = performance.now();
        const difficulty = parseInt(document.getElementById("ai-difficulty").value);
        const col = bestMove(difficulty);
        const endTime = performance.now();
        
        const delay = Math.max(0, 500 - (endTime - startTime));
        
        setTimeout(() => {
            aiThinking = false;
            if (col !== -1) {
                handleCellClick(col, true);
            }
        }, delay);
    }, 50);
}

// Retourne une copie du plateau courant (0=vide, 1=J1, 2=J2).
function getBoard() {
    return board.map(row => [...row]);
}

// Retourne la liste des colonnes encore jouables.
function getValidColumns() {
    return getValidColumnsBoard(board);
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
    updatePossibleMovesDisplay();
    updateLoadButtonState();
};
