import { getState, updateState } from "./state.js";
import { shuffleArray } from "./utils.js";
import { quizQuestions } from "./config.js";

// --- Coin Management ---

export function addCoins(amount) {
    const { coins } = getState();
    updateState({ coins: coins + amount });
    document.querySelector(".coin")?.classList.add("level-up");
    setTimeout(() => document.querySelector(".coin")?.classList.remove("level-up"), 1000);
}

// --- Game Initialization and Flow ---

export function initGames() {
    document.getElementById("memory-restart")?.addEventListener("click", initMemoryGame);
    document.getElementById("quiz-next")?.addEventListener("click", nextQuizQuestion);
}

export function openGame(gameName) {
    updateState({ currentGame: gameName });
    if (gameName === "memory") {
        document.getElementById("memory-game-modal")?.classList.remove("hidden");
        initMemoryGame();
    } else if (gameName === "quiz") {
        document.getElementById("quiz-game-modal")?.classList.remove("hidden");
        initQuizGame();
    }
}

export function closeGame() {
    const { currentGame } = getState();
    const modalId = currentGame === "memory" ? "memory-game-modal" : "quiz-game-modal";
    document.getElementById(modalId)?.classList.add("hidden");
    updateState({ currentGame: null });
}

// --- Memory Game Logic ---

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

function flipCard(index) {
    const { memory } = getState();
    const { flippedCards, matchedSymbols, cards } = memory;
    const symbol = cards[index];

    if (flippedCards.length === 2 || flippedCards.includes(index) || matchedSymbols.includes(symbol)) {
        return;
    }

    const newFlippedCards = [...flippedCards, index];
    updateState({ memory: { ...memory, flippedCards: newFlippedCards } });
    renderMemoryBoard();

    if (newFlippedCards.length === 2) {
        setTimeout(checkMatch, 800);
    }
}

function checkMatch() {
    let { memory, sounds, coins } = getState();
    let { flippedCards, cards, matchedPairs, score, matchedSymbols } = memory;

    const [index1, index2] = flippedCards;
    const symbol1 = cards[index1];
    const symbol2 = cards[index2];

    if (symbol1 === symbol2) {
        matchedPairs++;
        score += 10;
        const newMatchedSymbols = [...matchedSymbols, symbol1];
        if (matchedPairs === cards.length / 2) {
            coins += 20;
            sounds.confetti?.triggerAttackRelease("C5", "0.5");
        }
        updateState({
            memory: { ...memory, matchedPairs, score, flippedCards: [], matchedSymbols: newMatchedSymbols },
            coins
        });
    } else {
        updateState({ memory: { ...memory, flippedCards: [] } });
    }
    renderMemoryBoard();
}

function renderMemoryBoard() {
    const { memory } = getState();
    const { cards, flippedCards, matchedSymbols, score, matchedPairs } = memory;
    const board = document.getElementById("memory-board");
    if (!board) return;

    board.innerHTML = "";
    cards.forEach((symbol, index) => {
        const card = document.createElement("div");
        card.className = "memory-card bg-indigo-500 rounded-xl flex items-center justify-center text-2xl cursor-pointer transform transition-transform hover:scale-105";
        card.dataset.index = index;

        const isFlipped = flippedCards.includes(index);
        const isMatched = matchedSymbols.includes(symbol);

        if (isFlipped || isMatched) {
            card.innerHTML = symbol;
            card.classList.add("flipped");
            if (isMatched) {
                card.classList.add("matched", "bg-green-500");
                card.style.pointerEvents = "none";
            }
        } else {
            card.innerHTML = "?";
        }

        if (!isMatched) {
            card.addEventListener("click", () => flipCard(index));
        }
        board.appendChild(card);
    });

    document.getElementById("memory-score").textContent = score;
    document.getElementById("memory-pairs").textContent = `${matchedPairs}/${cards.length / 2}`;
    document.getElementById("memory-progress").style.width = `${(matchedPairs / (cards.length / 2)) * 100}%`;
}


// --- Quiz Game Logic ---

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
        addCoins(quiz.score);
        document.getElementById("quiz-question").textContent = `Geschafft! Du hast ${quiz.score} Punkte erreicht!`;
        document.getElementById("quiz-options").innerHTML = "";
        document.getElementById("quiz-next").classList.add("hidden");
    }
}

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

    const totalQuestions = quiz.questions.length;
    document.getElementById("quiz-score").textContent = quiz.score;
    document.getElementById("quiz-progress").textContent = `${quiz.currentQuestion + 1}/${totalQuestions}`;
    document.getElementById("quiz-progress-bar").style.width = `${((quiz.currentQuestion + 1) / totalQuestions) * 100}%`;

    document.getElementById("quiz-next").classList.toggle("hidden", !quiz.showResult);
}
