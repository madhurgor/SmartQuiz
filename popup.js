// Quiz data structure
const quizData = {
    general: [
        {
            question: "What is the largest planet in our solar system?",
            options: ["Earth", "Jupiter", "Saturn", "Neptune"],
            correct: 1
        },
        {
            question: "Which element has the chemical symbol 'O'?",
            options: ["Gold", "Oxygen", "Silver", "Iron"],
            correct: 1
        },
        {
            question: "What is the capital of Australia?",
            options: ["Sydney", "Melbourne", "Canberra", "Perth"],
            correct: 2
        },
        {
            question: "In which year did World War II end?",
            options: ["1944", "1945", "1946", "1947"],
            correct: 1
        },
        {
            question: "What is the smallest unit of matter?",
            options: ["Molecule", "Atom", "Electron", "Proton"],
            correct: 1
        }
    ],
    science: [
        {
            question: "What is the speed of light in vacuum?",
            options: ["299,792,458 m/s", "300,000,000 m/s", "299,000,000 m/s", "298,792,458 m/s"],
            correct: 0
        },
        {
            question: "Which scientist developed the theory of relativity?",
            options: ["Newton", "Einstein", "Galileo", "Darwin"],
            correct: 1
        },
        {
            question: "What is the chemical formula for water?",
            options: ["H2O", "CO2", "NaCl", "CH4"],
            correct: 0
        }
    ],
    history: [
        {
            question: "Who was the first person to walk on the moon?",
            options: ["Buzz Aldrin", "Neil Armstrong", "John Glenn", "Alan Shepard"],
            correct: 1
        },
        {
            question: "In which year did the Berlin Wall fall?",
            options: ["1987", "1988", "1989", "1990"],
            correct: 2
        }
    ],
    technology: [
        {
            question: "Who founded Microsoft?",
            options: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Larry Page"],
            correct: 1
        },
        {
            question: "What does 'HTTP' stand for?",
            options: ["HyperText Transfer Protocol", "High Tech Transfer Protocol", "HyperText Transport Protocol", "High Transfer Text Protocol"],
            correct: 0
        }
    ],
    sports: [
        {
            question: "How many players are on a basketball team on the court at one time?",
            options: ["4", "5", "6", "7"],
            correct: 1
        },
        {
            question: "Which country has won the most FIFA World Cups?",
            options: ["Germany", "Argentina", "Brazil", "Italy"],
            correct: 2
        }
    ]
};

class SmartQuiz {
    constructor() {
        this.currentQuiz = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.quizCompleted = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadStats();
    }
    
    initializeElements() {
        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.quizContainer = document.getElementById('quiz-container');
        this.resultsScreen = document.getElementById('results-screen');
        
        // Quiz elements
        this.questionText = document.getElementById('question-text');
        this.optionButtons = [
            document.getElementById('option-a'),
            document.getElementById('option-b'),
            document.getElementById('option-c'),
            document.getElementById('option-d')
        ];
        this.nextBtn = document.getElementById('next-btn');
        this.scoreElement = document.getElementById('score');
        this.totalElement = document.getElementById('total');
        
        // Controls
        this.categorySelect = document.getElementById('category-select');
        this.startQuizBtn = document.getElementById('start-quiz');
        this.createCustomBtn = document.getElementById('create-custom');
        this.restartBtn = document.getElementById('restart-quiz');
        
        // Results
        this.finalScore = document.getElementById('final-score');
        this.finalTotal = document.getElementById('final-total');
        this.performanceText = document.getElementById('performance-text');
        
        // Stats
        this.quizzesTaken = document.getElementById('quizzes-taken');
    }
    
    attachEventListeners() {
        this.startQuizBtn.addEventListener('click', () => this.startQuiz());
        this.createCustomBtn.addEventListener('click', () => this.createCustomQuiz());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.restartBtn.addEventListener('click', () => this.restartQuiz());
        
        this.optionButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => this.selectAnswer(index));
        });
    }
    
    async loadStats() {
        try {
            const result = await chrome.storage.local.get(['quizzesTaken']);
            const stats = result.quizzesTaken || 0;
            this.quizzesTaken.textContent = stats;
        } catch (error) {
            console.log('Storage not available in this context');
            this.quizzesTaken.textContent = '0';
        }
    }
    
    async updateStats() {
        try {
            const result = await chrome.storage.local.get(['quizzesTaken']);
            const currentCount = result.quizzesTaken || 0;
            const newCount = currentCount + 1;
            await chrome.storage.local.set({ quizzesTaken: newCount });
            this.quizzesTaken.textContent = newCount;
        } catch (error) {
            console.log('Storage not available in this context');
        }
    }
    
    startQuiz() {
        const category = this.categorySelect.value;
        this.currentQuiz = [...quizData[category]];
        this.shuffleArray(this.currentQuiz);
        
        this.currentQuestion = 0;
        this.score = 0;
        this.quizCompleted = false;
        
        this.scoreElement.textContent = this.score;
        this.totalElement.textContent = this.currentQuiz.length;
        
        this.showScreen('quiz');
        this.loadQuestion();
    }
    
    createCustomQuiz() {
        // For now, show an alert. In a full implementation, this would open a form
        alert('Custom quiz creation feature coming soon!');
    }
    
    loadQuestion() {
        if (this.currentQuestion >= this.currentQuiz.length) {
            this.showResults();
            return;
        }
        
        const question = this.currentQuiz[this.currentQuestion];
        this.questionText.textContent = question.question;
        
        this.optionButtons.forEach((btn, index) => {
            if (index < question.options.length) {
                btn.textContent = question.options[index];
                btn.style.display = 'block';
                btn.disabled = false;
                btn.className = 'option-btn';
            } else {
                btn.style.display = 'none';
            }
        });
        
        this.selectedAnswer = null;
        this.nextBtn.disabled = true;
        this.nextBtn.textContent = this.currentQuestion === this.currentQuiz.length - 1 ? 'Finish Quiz' : 'Next Question';
    }
    
    selectAnswer(answerIndex) {
        if (this.selectedAnswer !== null) return; // Already answered
        
        this.selectedAnswer = answerIndex;
        const question = this.currentQuiz[this.currentQuestion];
        const correctAnswer = question.correct;
        
        // Show correct/incorrect answers
        this.optionButtons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === correctAnswer) {
                btn.classList.add('correct');
            } else if (index === answerIndex && index !== correctAnswer) {
                btn.classList.add('incorrect');
            } else if (index === answerIndex) {
                btn.classList.add('selected');
            }
        });
        
        // Update score
        if (answerIndex === correctAnswer) {
            this.score++;
            this.scoreElement.textContent = this.score;
        }
        
        this.nextBtn.disabled = false;
    }
    
    nextQuestion() {
        this.currentQuestion++;
        this.loadQuestion();
    }
    
    showResults() {
        this.updateStats();
        
        this.finalScore.textContent = this.score;
        this.finalTotal.textContent = this.currentQuiz.length;
        
        const percentage = (this.score / this.currentQuiz.length) * 100;
        let performance;
        
        if (percentage >= 90) {
            performance = "Excellent! 🎉";
        } else if (percentage >= 75) {
            performance = "Great job! 👏";
        } else if (percentage >= 60) {
            performance = "Good work! 👍";
        } else if (percentage >= 40) {
            performance = "Keep practicing! 📚";
        } else {
            performance = "Don't give up! 💪";
        }
        
        this.performanceText.textContent = performance;
        this.showScreen('results');
    }
    
    restartQuiz() {
        this.showScreen('start');
    }
    
    showScreen(screen) {
        this.startScreen.classList.add('hidden');
        this.quizContainer.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
        
        switch (screen) {
            case 'start':
                this.startScreen.classList.remove('hidden');
                break;
            case 'quiz':
                this.quizContainer.classList.remove('hidden');
                break;
            case 'results':
                this.resultsScreen.classList.remove('hidden');
                break;
        }
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Initialize the quiz when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new SmartQuiz();
});