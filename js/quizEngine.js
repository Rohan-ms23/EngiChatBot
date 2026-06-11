export class QuizEngine {
    constructor(chatBoxElement) {
        this.chatBox = chatBoxElement;
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.quizContainer = null;
    }

    startQuiz(questionsData) {
        if (!questionsData || !questionsData.length) {
            console.error("No quiz data provided.");
            return;
        }

        this.questions = questionsData;
        this.currentIndex = 0;
        this.score = 0;

        if (this.quizContainer) {
            this.quizContainer.remove();
        }

        this.quizContainer = document.createElement('div');
        this.quizContainer.className = 'quiz-container';
        this.chatBox.appendChild(this.quizContainer);

        this.renderQuestion();
    }

    renderQuestion() {
        if (this.currentIndex >= this.questions.length) {
            this.renderFinalScore();
            return;
        }

        const q = this.questions[this.currentIndex];

        if (!q || !q.options || !Array.isArray(q.options)) {
            console.error("Invalid question format:", q);
            return;
        }

        const progress = ((this.currentIndex + 1) / this.questions.length) * 100;

        let optionsHTML = '';
        q.options.forEach(opt => {
            optionsHTML += `
                <button class="quiz-option" data-answer="${opt}">
                    ${opt}
                    <i class="fa-solid"></i>
                </button>`;
        });

        this.quizContainer.innerHTML = `
            <div class="quiz-header">
                <span>Question ${this.currentIndex + 1} of ${this.questions.length}</span>
                <span>Score: ${this.score}</span>
            </div>
            <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width:${progress}%"></div>
            </div>
            <div class="quiz-question">${q.q}</div>
            <div class="quiz-options">
                ${optionsHTML}
            </div>
            <button class="quiz-next-btn" style="display:none;">
                Next Question <i class="fa-solid fa-arrow-right"></i>
            </button>`;
            
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
        this.attachOptionListeners(q.answer);
    }

    attachOptionListeners(correctAnswer) {
        const optionBtns = this.quizContainer.querySelectorAll('.quiz-option');
        const nextBtn = this.quizContainer.querySelector('.quiz-next-btn');

        optionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                optionBtns.forEach(b => { b.disabled = true; });

                const selected = e.currentTarget.getAttribute('data-answer');

                if (selected === correctAnswer) {
                    this.score++;
                    e.currentTarget.classList.add('correct');
                    e.currentTarget.querySelector('i').classList.add('fa-check');
                } else {
                    e.currentTarget.classList.add('wrong');
                    e.currentTarget.querySelector('i').classList.add('fa-xmark');
                    
                    optionBtns.forEach(b => {
                        if (b.getAttribute('data-answer') === correctAnswer) {
                            b.classList.add('correct');
                            b.querySelector('i').classList.add('fa-check');
                        }
                    });
                }

                this.quizContainer.querySelector('.quiz-header span:last-child').innerText = `Score: ${this.score}`;
                nextBtn.style.display = 'block';
            });
        });

        nextBtn.addEventListener('click', () => {
            this.currentIndex++;
            if (this.currentIndex < this.questions.length) {
                this.renderQuestion();
            } else {
                this.renderFinalScore();
            }
        });
    }

    renderFinalScore() {
        const pct = Math.round((this.score / this.questions.length) * 100);
        const feedback = pct >= 80 ? "Excellent work! 🌟" : pct >= 50 ? "Good job! 📚" : "Needs review. Try again! 💡";

        this.quizContainer.innerHTML = `
            <div class="quiz-scorecard">
                <h3>Quiz Completed</h3>
                <h2>${this.score} / ${this.questions.length}</h2>
                <p>${feedback}</p>
                <div class="quiz-progress-bar" style="margin-top:1rem;">
                    <div class="quiz-progress-fill" style="width:100%"></div>
                </div>
            </div>`;
            
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }
}