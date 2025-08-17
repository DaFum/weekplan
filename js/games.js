import { getState, updateState } from './state.js';
import { updateCoinsDisplay } from './ui.js';
import { shuffleArray } from './utils.js';
import { quizQuestions } from './config.js';

let memoryCards = [];
let memoryFlippedCards = [];
let memoryMatchedPairs = 0;
let memoryScore = 0;
let currentQuizQuestion = 0;
let quizScore = 0;

export function addCoins(amount) {
    const { coins } = getState();
    updateState({ coins: coins + amount });
    document.querySelector('.coin').classList.add('level-up');
    setTimeout(() => document.querySelector('.coin').classList.remove('level-up'), 1000);
}

export function initGames() {
    document.getElementById('memory-restart').addEventListener('click', initMemoryGame);
    document.getElementById('quiz-next').addEventListener('click', nextQuizQuestion);
}

export function openGame(gameName) {
    updateState({ currentGame: gameName });
    if (gameName === 'memory') {
        document.getElementById('memory-game-modal').classList.remove('hidden');
        initMemoryGame();
    } else if (gameName === 'quiz') {
        document.getElementById('quiz-game-modal').classList.remove('hidden');
        initQuizGame();
    }
}

export function closeGame() {
    const { currentGame } = getState();
    if (currentGame === 'memory') {
        document.getElementById('memory-game-modal').classList.add('hidden');
    } else if (currentGame === 'quiz') {
        document.getElementById('quiz-game-modal').classList.add('hidden');
    }
    updateState({ currentGame: null });
}

function initMemoryGame() {
    const board = document.getElementById('memory-board');
    board.innerHTML = '';
    memoryFlippedCards = [];
    memoryMatchedPairs = 0;
    memoryScore = 0;
    document.getElementById('memory-score').textContent = memoryScore;
    document.getElementById('memory-pairs').textContent = '0/6';
    document.getElementById('memory-progress').style.width = '0%';

    const symbols = ['🎮', '🎯', '🏆', '⭐', '🚀', '🌈'];
    memoryCards = [...symbols, ...symbols];
    shuffleArray(memoryCards);

    memoryCards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card bg-indigo-500 rounded-xl flex items-center justify-center text-2xl cursor-pointer transform transition-transform hover:scale-105 relative overflow-hidden';
        card.dataset.index = index;
        card.dataset.symbol = symbol;
        card.innerHTML = '?';
        card.addEventListener('click', flipCard);
        board.appendChild(card);
    });
}

function flipCard() {
    if (memoryFlippedCards.length === 2) return;
    if (this.classList.contains('flipped')) return;

    this.classList.add('flipped');
    this.innerHTML = this.dataset.symbol;
    memoryFlippedCards.push(this);

    if (memoryFlippedCards.length === 2) {
        setTimeout(checkMatch, 500);
    }
}

function checkMatch() {
    const [card1, card2] = memoryFlippedCards;
    if (card1.dataset.symbol === card2.dataset.symbol) {
        memoryMatchedPairs++;
        memoryScore += 10;
        document.getElementById('memory-score').textContent = memoryScore;
        document.getElementById('memory-pairs').textContent = `${memoryMatchedPairs}/6`;
        document.getElementById('memory-progress').style.width = `${(memoryMatchedPairs / 6) * 100}%`;

        card1.removeEventListener('click', flipCard);
        card2.removeEventListener('click', flipCard);
        card1.classList.add('matched');
        card2.classList.add('matched');

        if (memoryMatchedPairs === 6) {
            addCoins(20);
            const { sounds } = getState();
            sounds.confetti.triggerAttackRelease("C5", "0.5");
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.innerHTML = '?';
            card2.innerHTML = '?';
        }, 500);
    }
    memoryFlippedCards = [];
}

function initQuizGame() {
    currentQuizQuestion = 0;
    quizScore = 0;
    document.getElementById('quiz-score').textContent = quizScore;
    document.getElementById('quiz-progress').textContent = `${currentQuizQuestion + 1}/5`;
    document.getElementById('quiz-progress-bar').style.width = '20%';
    showQuizQuestion();
}

function showQuizQuestion() {
    const question = quizQuestions[currentQuizQuestion];
    document.getElementById('quiz-question').textContent = question.question;
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'quiz-option w-full text-left p-3 bg-accent rounded-lg hover:bg-indigo-200 transition relative overflow-hidden';
        button.textContent = option;
        button.dataset.index = index;
        optionsContainer.appendChild(button);
    });

    document.getElementById('quiz-next').classList.add('hidden');
}

export function checkQuizAnswer(selectedIndex) {
    const question = quizQuestions[currentQuizQuestion];
    const options = document.querySelectorAll('#quiz-options button');

    options[question.answer].classList.add('bg-green-200');
    if (selectedIndex !== question.answer) {
        options[selectedIndex].classList.add('bg-red-200');
    }

    if (selectedIndex === question.answer) {
        quizScore += 20;
        document.getElementById('quiz-score').textContent = quizScore;
        const { sounds } = getState();
        sounds.complete.triggerAttackRelease("C5", "0.2");
    }

    document.getElementById('quiz-next').classList.remove('hidden');
}

function nextQuizQuestion() {
    currentQuizQuestion++;
    if (currentQuizQuestion < quizQuestions.length) {
        document.getElementById('quiz-progress').textContent = `${currentQuizQuestion + 1}/5`;
        document.getElementById('quiz-progress-bar').style.width = `${((currentQuizQuestion + 1) / quizQuestions.length) * 100}%`;
        showQuizQuestion();
    } else {
        addCoins(quizScore);
        document.getElementById('quiz-question').textContent = `Geschafft! Du hast ${quizScore} Punkte erreicht!`;
        document.getElementById('quiz-options').innerHTML = '';
        document.getElementById('quiz-next').classList.add('hidden');
    }
}
