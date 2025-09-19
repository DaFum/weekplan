// Array of weekdays in German
export const wochentage = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];

// Array of motivational quotes
export const motivationsSprueche = [
  'Du bist großartig! 🌟',
  'Mach weiter so! 💪',
  'Du schaffst das! 🎯',
  'Heute wird ein super Tag! 🌈',
  'Bleib dran! 🚀',
  'Du bist auf dem richtigen Weg! 🛤️',
  'Kleine Schritte, große Erfolge! 🐢',
  'Du bist ein Star! ⭐',
  'Gib niemals auf! 💎',
  'Du bist unschlagbar! 🦸',
];

// Details for different task categories, including icon and color
export const kategorieDetails = {
  schule: { icon: '📚', color: 'category-badge-schule' },
  pc: { icon: '💻', color: 'category-badge-pc' },
  sonstiges: { icon: '🎉', color: 'category-badge-sonstiges' },
};

export const categoryLabels = {
  schule: 'Schule',
  pc: 'PC-Zeit',
  sonstiges: 'Freizeit',
};

export const achievementsConfig = [
  {
    id: 'first-task',
    label: 'Erste Aufgabe',
    description: 'Erledige deine erste Aufgabe',
    threshold: 1,
    type: 'completedTasks',
    emoji: '🎉',
  },
  {
    id: 'five-tasks',
    label: '5 erledigt',
    description: 'Schließe fünf Aufgaben ab',
    threshold: 5,
    type: 'completedTasks',
    emoji: '💪',
  },
  {
    id: 'streak-3',
    label: '3er Streak',
    description: 'Bleib drei Tage in Folge dran',
    threshold: 3,
    type: 'streak',
    emoji: '🔥',
  },
  {
    id: 'streak-7',
    label: 'Wochenheld',
    description: 'Schaffe einen 7-Tage-Streak',
    threshold: 7,
    type: 'streak',
    emoji: '🏆',
  },
  {
    id: 'pc-master',
    label: 'PC-Profi',
    description: 'Schließe drei PC-Aufgaben ab',
    threshold: 3,
    type: 'pcCompleted',
    emoji: '💻',
  },
];

// Array of quiz questions for the quiz game
export const quizQuestions = [
  {
    question: 'Wie viele Planeten hat unser Sonnensystem?',
    options: ['7', '8', '9', '10'],
    answer: 1,
  },
  {
    question: 'Welches ist das größte Säugetier der Welt?',
    options: ['Elefant', 'Blauwal', 'Giraffe', 'Nilpferd'],
    answer: 1,
  },
  {
    question: 'Wie viele Kontinente gibt es?',
    options: ['5', '6', '7', '8'],
    answer: 2,
  },
  {
    question: 'Welcher Planet ist der Sonne am nächsten?',
    options: ['Venus', 'Mars', 'Merkur', 'Jupiter'],
    answer: 2,
  },
  {
    question: 'Wie viele Knochen hat ein erwachsener Mensch?',
    options: ['206', '250', '300', '180'],
    answer: 0,
  },
];
