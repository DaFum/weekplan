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

/**
 * Fügt dem globalen Münzstand einen Betrag hinzu und startet kurz die Level-up-Animation der Münzanzeige.
 *
 * Aktualisiert den globalen State (coins) um `amount` und fügt dem DOM-Element mit der Klasse `.coin`
 * temporär die CSS-Klasse `level-up` hinzu (entfernt sie nach 1s).
 *
 * @param {number} amount - Anzahl der hinzuzufügenden Münzen (kann positiv oder negativ sein).
 */
export function addCoins(amount) {
    const { coins } = getState();
    updateState({ coins: coins + amount });
    document.querySelector('.coin').classList.add('level-up');
    setTimeout(() => document.querySelector('.coin').classList.remove('level-up'), 1000);
}

/**
 * Initialisiert die Spiel-UI-Handler.
 *
 * Hängt die Klick-Event-Listener für den Memory-Neustart-Button ('memory-restart') und den Quiz-Weiter-Button ('quiz-next') an, sodass die entsprechenden Spielfunktionen ausgelöst werden.
 */
export function initGames() {
    document.getElementById('memory-restart').addEventListener('click', initMemoryGame);
    document.getElementById('quiz-next').addEventListener('click', nextQuizQuestion);
}

/**
 * Öffnet ein Spiel-Modal und startet das zugehörige Spiel.
 *
 * Setzt `currentGame` im globalen Zustand auf `gameName`, zeigt das passende Modal
 * ('memory-game-modal' oder 'quiz-game-modal') und initialisiert das Spiel.
 *
 * @param {string} gameName - Name des zu öffnenden Spiels; unterstützte Werte: `'memory'` oder `'quiz'`.
 */
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

/**
 * Schließt das aktuell geöffnete Spielmodal und setzt den Spielzustand zurück.
 *
 * Versteckt das passende Modal für das in der globalen State-Variable `currentGame`
 * gespeicherte Spiel ('memory' oder 'quiz') und setzt `currentGame` anschließend auf `null`.
 */
export function closeGame() {
    const { currentGame } = getState();
    if (currentGame === 'memory') {
        document.getElementById('memory-game-modal').classList.add('hidden');
    } else if (currentGame === 'quiz') {
        document.getElementById('quiz-game-modal').classList.add('hidden');
    }
    updateState({ currentGame: null });
}

/**
 * Initialisiert das Memory-Spiel: setzt Spielzustand zurück und baut das Kartenbrett auf.
 *
 * Setzt lokale Spielvariablen zurück (geöffnete Karten, gefundene Paare, Punktestand), aktualisiert die
 * Anzeige für Punktestand, Paare und Fortschrittsbalken, erzeugt ein 12-Karten-Deck aus sechs Symbolpaaren,
 * mischt die Karten und rendert für jede Karte ein DOM-Element mit zugehörigem Klick-Handler.
 *
 * Nebenwirkungen:
 * - Manipuliert DOM-Elemente mit den IDs `memory-board`, `memory-score`, `memory-pairs` und `memory-progress`.
 * - Setzt die Module-Variablen `memoryCards`, `memoryFlippedCards`, `memoryMatchedPairs` und `memoryScore`.
 */
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

/**
 * Behandelt einen Klick auf eine Memory-Karte: zeigt das Kartensymbol an und verwaltet den Zustand der umgedrehten Karten.
 *
 * Fügt der Karte die Klasse "flipped" hinzu, setzt ihren sichtbaren Inhalt auf das in `data-symbol` gespeicherte Symbol
 * und fügt das Karten-Element zu `memoryFlippedCards` hinzu. Ignoriert Aufrufe, wenn bereits zwei Karten umgedreht sind
 * oder die angeklickte Karte bereits den Zustand "flipped" hat. Sobald zwei Karten umgedreht sind, wird nach 500 ms
 * `checkMatch` aufgerufen, um auf Übereinstimmung zu prüfen.
 */
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

/**
 * Vergleicht die beiden aktuell umgedrehten Memory-Karten und verarbeitet Treffer oder Fehlversuch.
 *
 * Wenn die Symbole übereinstimmen, erhöht die Funktion die Anzahl gefundener Paare und den Spielpunktestand,
 * aktualisiert die UI (Punktestand, Paarzähler, Fortschrittsbalken), deaktiviert weitere Klicks auf die
 * beiden Karten und markiert sie als gematcht. Beim Finden aller 6 Paare werden zusätzlich 20 Münzen
 * gutgeschrieben und der Konfetti-Sound ausgelöst.
 *
 * Bei Nichtübereinstimmung werden die beiden Karten nach einer kurzen Verzögerung wieder umgedreht und
 * ihr sichtbarer Inhalt zurück auf '?' gesetzt.
 *
 * Seiteneffekte:
 * - Verändert die Modul- bzw. Dateiliste: memoryMatchedPairs, memoryScore und memoryFlippedCards.
 * - Manipuliert DOM-Elemente: #memory-score, #memory-pairs, #memory-progress sowie die beiden Karten-Elemente.
 * - Entfernt Event-Listener von gematchten Karten oder spielt einen Sound und ruft addCoins auf.
 */
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

/**
 * Initialisiert das Quiz: setzt Frage- und Punktezähler zurück, aktualisiert die Anzeige und zeigt die erste Frage.
 *
 * Setzt `currentQuizQuestion` und `quizScore` auf 0, aktualisiert die Elemente `quiz-score`, `quiz-progress`
 * und `quiz-progress-bar` auf den Anfangszustand (erste von fünf Fragen, 20% Fortschritt) und ruft `showQuizQuestion()` auf.
 */
function initQuizGame() {
    currentQuizQuestion = 0;
    quizScore = 0;
    document.getElementById('quiz-score').textContent = quizScore;
    document.getElementById('quiz-progress').textContent = `${currentQuizQuestion + 1}/5`;
    document.getElementById('quiz-progress-bar').style.width = '20%';
    showQuizQuestion();
}

/**
 * Rendert die aktuell ausgewählte Quizfrage und ihre Antwortoptionen in der UI.
 *
 * Lädt die Frage aus `quizQuestions[currentQuizQuestion]`, setzt den Fragetext in das Element
 * mit ID `quiz-question`, baut die Antwort-Buttons im Container `quiz-options` neu auf (jedes
 * Button-Element erhält das Datenattribut `data-index`) und blendet die Schaltfläche `quiz-next` aus.
 * Diese Funktion verändert ausschließlich den DOM-Zustand und gibt nichts zurück.
 */
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

/**
 * Überprüft die gewählte Antwort für die aktuelle Quizfrage, aktualisiert Punktestand und UI.
 *
 * Markiert die richtige Antwort grün und die falsch gewählte Antwort rot (falls zutreffend),
 * erhöht bei richtiger Auswahl den `quizScore` um 20, aktualisiert die Punktezählanzeige,
 * spielt den Abschluss-Sound und zeigt die "Weiter"-Schaltfläche an.
 *
 * @param {number} selectedIndex - Index der vom Spieler gewählten Antwortoption (0-basiert).
 */
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

/**
 * Geht zur nächsten Quizfrage oder schließt das Quiz ab.
 *
 * Erhöht den internen Frageindex, aktualisiert Fortschrittstext und Fortschrittsbalken,
 * zeigt die nächste Frage (showQuizQuestion) oder — wenn keine Fragen mehr verbleiben —
 * schreibt eine Abschlussnachricht, leert die Antwortoptionen, blendet den "Weiter"-Button aus
 * und vergibt die gesammelten Quiz-Punkte als Münzen (addCoins).
 */
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
