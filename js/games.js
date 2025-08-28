// Import necessary functions and data from other modules
import { getState, updateState } from "./state.js";
import { shuffleArray } from "./utils.js";
import { quizQuestions } from "./config.js";

// --- Coin Management ---

/**
 * Adds a specified amount of coins to the user's total.
 * @param {number} amount - The number of coins to add.
 */
export function addCoins(amount) {
    const { coins } = getState();
    updateState({ coins: coins + amount });
    // Animate the coin icon
    const coinElement = document.querySelector(".coin");
    if (coinElement) {
        coinElement.classList.add("level-up");
        const timeoutId = setTimeout(() => {
            // Re-query in case DOM changed
            document.querySelector(".coin")?.classList.remove("level-up");
        }, 1000);
        // Store timeout for potential cleanup
        coinElement.dataset.animationTimeout = timeoutId;
    }
}

// --- Game Initialization and Flow ---

/**
 * Initializes the games by adding event listeners to the restart and next buttons.
 */
export function initGames() {
    document.getElementById("memory-restart")?.addEventListener("click", initMemoryGame);
    document.getElementById("quiz-next")?.addEventListener("click", nextQuizQuestion);
}

/**
 * Opens a specified game.
 * @param {string} gameName - The name of the game to open ("memory" or "quiz").
 */
export function openGame(gameName) {
    updateState({ currentGame: gameName });
    document.body.classList.add("modal-open");
    if (gameName === "memory") {
        document.getElementById("memory-game-modal")?.classList.remove("hidden");
        initMemoryGame();
    } else if (gameName === "quiz") {
        document.getElementById("quiz-game-modal")?.classList.remove("hidden");
        initQuizGame();
    }
}

/**
 * Closes the currently active game.
 */
export function closeGame() {
    const { currentGame, memory } = getState();
    if (currentGame === "memory" && memory.checkMatchTimeoutId) {
        clearTimeout(memory.checkMatchTimeoutId);
    }

    const modalId = currentGame === "memory" ? "memory-game-modal" : "quiz-game-modal";
    document.getElementById(modalId)?.classList.add("hidden");
    updateState({ currentGame: null });
    // Nur entfernen, wenn keine anderen Modals offen sind
    const hasOtherOpen =
        !document.getElementById("task-modal")?.classList.contains("hidden") ||
        !document.getElementById("prompt-modal")?.classList.contains("hidden");
    if (!hasOtherOpen) document.body.classList.remove("modal-open");
}

// --- Memory Game Logic ---

/**
 * Initializes the memory game by shuffling cards and resetting the game state.
 */
function initMemoryGame() {
    const symbols = ["🎮", "🎯", "🏆", "⭐", "🚀", "🌈"];
    const cards = shuffleArray([...symbols, ...symbols]);
    updateState({
        memory: {
            cards: cards,
            flippedCards: [],
            matchedPairs: 0,
            score: 0,
            matchedSymbols: []
        }
    });
    renderMemoryBoard();
}

/**
 * Flips a card in the memory game.
 * @param {number} index - The index of the card to flip.
 */
function flipCard(index) {
    const { memory } = getState();
    const { flippedCards, matchedSymbols, cards } = memory;
    const symbol = cards[index];

    // Prevent flipping more than two cards, or flipping an already flipped or matched card
    if (flippedCards.length === 2 || flippedCards.includes(index) || matchedSymbols.includes(symbol)) {
        return;
    }

    const newFlippedCards = [...flippedCards, index];
    updateState({ memory: { ...memory, flippedCards: newFlippedCards } });
    renderMemoryBoard();

    // If two cards are flipped, check for a match
    if (newFlippedCards.length === 2) {
        const { memory } = getState();
        if (memory.checkMatchTimeoutId) clearTimeout(memory.checkMatchTimeoutId);

        const timeoutId = setTimeout(() => {
            checkMatch();
            updateState({ memory: { ...getState().memory, checkMatchTimeoutId: null } });
        }, 800);

        updateState({ memory: { ...memory, checkMatchTimeoutId: timeoutId } });
    }
}

/**
 * Checks if the two flipped cards match.
 */
function checkMatch() {
    let { memory, sounds } = getState();
    let { flippedCards, cards, matchedPairs, score, matchedSymbols } = memory;

    const [index1, index2] = flippedCards;
    const symbol1 = cards[index1];
    const symbol2 = cards[index2];

    if (symbol1 === symbol2) {
        // If the cards match, update the score and matched pairs
        matchedPairs++;
        score += 10;
        const newMatchedSymbols = [...matchedSymbols, symbol1];
        if (matchedPairs === cards.length / 2) {
            // If all pairs are matched, award bonus coins and play a sound
            addCoins(20);
            sounds.confetti?.triggerAttackRelease("C5", "0.5");
        }
        updateState({
            memory: { ...memory, matchedPairs, score, flippedCards: [], matchedSymbols: newMatchedSymbols }
        });
    } else {
        // If the cards don't match, flip them back over
        updateState({ memory: { ...memory, flippedCards: [] } });
    }
    renderMemoryBoard();
}

/**
 * Renders the memory game board.
 */
function renderMemoryBoard() {
    const { memory } = getState();
    const { cards, flippedCards, matchedSymbols, score, matchedPairs } = memory;
    const board = document.getElementById("memory-board");
    if (!board) return;

    // Remove any existing event listener
    board.removeEventListener("click", handleCardClick);

    board.innerHTML = "";
    cards.forEach((symbol, index) => {
        const card = document.createElement("div");
        card.className = "memory-card bg-indigo-500 rounded-xl flex items-center justify-center text-2xl cursor-pointer transform transition-transform hover:scale-105";
        card.dataset.index = index;

        const isFlipped = flippedCards.includes(index);
        const isMatched = matchedSymbols.includes(symbol);

        if (isFlipped || isMatched) {
            card.textContent = symbol;
            card.classList.add("flipped");
            if (isMatched) {
                card.classList.add("matched", "bg-green-500");
                card.style.pointerEvents = "none";
            }
        } else {
            card.textContent = "?";
        }
        board.appendChild(card);
    });

    // Add a single delegated event listener
    board.addEventListener("click", handleCardClick);

    // Update score, pairs, and progress bar
    const scoreEl = document.getElementById("memory-score");
    const pairsEl = document.getElementById("memory-pairs");
    const progressEl = document.getElementById("memory-progress");
    
    if (scoreEl) scoreEl.textContent = score;
    if (pairsEl) pairsEl.textContent = `${matchedPairs}/${cards.length / 2}`;
    if (progressEl) progressEl.style.width = `${(matchedPairs / (cards.length / 2)) * 100}%`;
}

function handleCardClick(event) {
    const card = event.target.closest(".memory-card");
    if (card && !card.classList.contains("matched")) {
        const index = parseInt(card.dataset.index, 10);
        flipCard(index);
    }
}


// --- Quiz Game Logic ---

/**
 * Initializes the quiz game by shuffling questions and resetting the game state.
 */
function initQuizGame() {
    updateState({
        quiz: {
            questions: shuffleArray(quizQuestions).slice(0, 5),
            currentQuestion: 0,
            score: 0,
            showResult: false
        }
    });
    renderQuiz();
}

/**
 * Checks the selected answer in the quiz game.
 * @param {number} selectedIndex - The index of the selected answer.
 */
export function checkQuizAnswer(selectedIndex) {
    const { quiz, sounds } = getState();
    const question = quiz.questions[quiz.currentQuestion];
    const isCorrect = selectedIndex === question.answer;

    if (isCorrect) {
        sounds.complete?.triggerAttackRelease("C5", "0.2");
    }

    updateState({
        quiz: {
            ...quiz,
            score: isCorrect ? quiz.score + 20 : quiz.score,
            showResult: true
        }
    });
    renderQuiz(selectedIndex);
}

/**
 * Moves to the next question in the quiz game.
 */
function nextQuizQuestion() {
    let { quiz } = getState();
    const totalQuestions = quiz.questions.length;

    if (quiz.currentQuestion < totalQuestions - 1) {
        updateState({
            quiz: {
                ...quiz,
                currentQuestion: quiz.currentQuestion + 1,
                showResult: false
            }
        });
        renderQuiz();
    } else {
        // If it's the last question, end the game and award coins
        addCoins(quiz.score);
        const questionEl = document.getElementById("quiz-question");
        const optionsEl = document.getElementById("quiz-options");
        if (questionEl) questionEl.textContent = `Geschafft! Du hast ${quiz.score} Punkte erreicht!`;
        if (optionsEl) {
            while (optionsEl.firstChild) {
                optionsEl.removeChild(optionsEl.firstChild);
            }
        }
        document.getElementById("quiz-next")?.classList.add("hidden");
    }
}

/**
 * Renders the quiz game.
 * @param {number|null} selectedIndex - The index of the selected answer, used to show correct/incorrect feedback.
 */
function renderQuiz(selectedIndex = null) {
    const { quiz } = getState();
    if (!quiz.questions || quiz.questions.length === 0) return;

    const question = quiz.questions[quiz.currentQuestion];
    document.getElementById("quiz-question").textContent = question.question;

    const optionsContainer = document.getElementById("quiz-options");
    optionsContainer.innerHTML = "";

    question.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "quiz-option w-full text-left p-3 bg-accent rounded-lg hover:bg-indigo-200 transition";
        button.textContent = option;
        button.dataset.index = index;

        if (quiz.showResult) {
            button.disabled = true;
            if (index === question.answer) {
                button.classList.add("bg-green-200", "text-black");
            } else if (index === selectedIndex) {
                button.classList.add("bg-red-200", "text-black");
            }
        } else {
            button.addEventListener("click", () => checkQuizAnswer(index));
        }

        optionsContainer.appendChild(button);
    });

    // Update score, progress, and progress bar
    const totalQuestions = quiz.questions.length;
    document.getElementById("quiz-score").textContent = quiz.score;
    document.getElementById("quiz-progress").textContent = `${quiz.currentQuestion + 1}/${totalQuestions}`;
    document.getElementById("quiz-progress-bar").style.width = `${((quiz.currentQuestion + 1) / totalQuestions) * 100}%`;

    // Show/hide the "Next Question" button
    document.getElementById("quiz-next").classList.toggle("hidden", !quiz.showResult);
}
