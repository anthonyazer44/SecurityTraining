// Quiz Engine for Starcomm Training System

class QuizEngine {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.timeStarted = null;
        this.timeLimit = null; // in minutes
        this.timer = null;
    }

    // Initialize quiz
    async initQuiz(moduleId, employeeId) {
        try {
            // Get module data with quiz questions
            const response = await api.getTrainingModule(employeeId, moduleId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to load quiz');
            }

            this.currentQuiz = {
                moduleId: moduleId,
                employeeId: employeeId,
                module: response.module,
                questions: response.module.quiz_questions ? JSON.parse(response.module.quiz_questions) : [],
                passingScore: response.module.passing_score || 80
            };

            this.currentQuestionIndex = 0;
            this.answers = {};
            this.timeStarted = new Date();
            this.timeLimit = 30; // 30 minutes default

            return this.currentQuiz;
        } catch (error) {
            console.error('Quiz initialization failed:', error);
            throw error;
        }
    }

    // Start quiz timer
    startTimer() {
        if (this.timeLimit && this.timeLimit > 0) {
            const endTime = new Date(this.timeStarted.getTime() + (this.timeLimit * 60 * 1000));
            
            this.timer = setInterval(() => {
                const now = new Date();
                const timeLeft = endTime - now;
                
                if (timeLeft <= 0) {
                    this.submitQuiz(true); // Auto-submit when time runs out
                } else {
                    this.updateTimerDisplay(timeLeft);
                }
            }, 1000);
        }
    }

    // Update timer display
    updateTimerDisplay(timeLeft) {
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        const timerElement = document.getElementById('quiz-timer');
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Add warning class when less than 5 minutes left
            if (minutes < 5) {
                timerElement.classList.add('timer-warning');
            }
        }
    }

    // Stop timer
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    // Render quiz interface
    renderQuiz() {
        if (!this.currentQuiz || !this.currentQuiz.questions.length) {
            return `
                <div class="quiz-container">
                    <div class="quiz-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>No Quiz Available</h3>
                        <p>This training module does not have a quiz.</p>
                        <button class="btn btn-primary" onclick="router.navigate('training/${this.currentQuiz?.employeeId}/dashboard')">
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            `;
        }

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const progress = ((this.currentQuestionIndex + 1) / this.currentQuiz.questions.length) * 100;

        return `
            <div class="quiz-container">
                <div class="quiz-header">
                    <div class="quiz-info">
                        <h2 class="quiz-title">${this.currentQuiz.module.title} - Quiz</h2>
                        <div class="quiz-meta">
                            <span class="quiz-question-count">
                                Question ${this.currentQuestionIndex + 1} of ${this.currentQuiz.questions.length}
                            </span>
                            ${this.timeLimit ? `<span class="quiz-timer" id="quiz-timer">30:00</span>` : ''}
                        </div>
                    </div>
                    <div class="quiz-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>

                <div class="quiz-content">
                    <div class="question-card">
                        <div class="question-text">
                            <h3>${question.question}</h3>
                        </div>
                        
                        <div class="question-options">
                            ${question.options.map((option, index) => `
                                <label class="option-label">
                                    <input type="radio" 
                                           name="question_${question.id}" 
                                           value="${index}" 
                                           ${this.answers[question.id] == index ? 'checked' : ''}
                                           onchange="quizEngine.selectAnswer(${question.id}, ${index})">
                                    <span class="option-text">${option}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="quiz-navigation">
                    <button class="btn btn-secondary" 
                            onclick="quizEngine.previousQuestion()" 
                            ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-left"></i> Previous
                    </button>
                    
                    <div class="quiz-actions">
                        <button class="btn btn-outline" onclick="quizEngine.saveProgress()">
                            <i class="fas fa-save"></i> Save Progress
                        </button>
                        
                        ${this.currentQuestionIndex === this.currentQuiz.questions.length - 1 ? `
                            <button class="btn btn-success" onclick="quizEngine.submitQuiz()">
                                <i class="fas fa-check"></i> Submit Quiz
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="quizEngine.nextQuestion()">
                                Next <i class="fas fa-arrow-right"></i>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Select answer for current question
    selectAnswer(questionId, answerIndex) {
        this.answers[questionId] = answerIndex;
        this.saveProgress();
    }

    // Navigate to next question
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.currentQuestionIndex++;
            this.updateQuizDisplay();
        }
    }

    // Navigate to previous question
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.updateQuizDisplay();
        }
    }

    // Update quiz display
    updateQuizDisplay() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = this.renderQuiz();
            this.startTimer(); // Restart timer for new question
        }
    }

    // Save quiz progress
    async saveProgress() {
        try {
            const progressData = {
                quiz_answers: this.answers,
                current_question: this.currentQuestionIndex,
                time_started: this.timeStarted.toISOString(),
                last_accessed: new Date().toISOString()
            };

            await api.updateEmployeeProgress(
                this.currentQuiz.employeeId, 
                this.currentQuiz.moduleId, 
                progressData
            );
        } catch (error) {
            console.error('Failed to save quiz progress:', error);
        }
    }

    // Submit quiz
    async submitQuiz(autoSubmit = false) {
        try {
            this.stopTimer();

            // Check if all questions are answered
            const unansweredQuestions = this.currentQuiz.questions.filter(q => 
                this.answers[q.id] === undefined || this.answers[q.id] === null
            );

            if (unansweredQuestions.length > 0 && !autoSubmit) {
                const proceed = confirm(
                    `You have ${unansweredQuestions.length} unanswered questions. ` +
                    'Are you sure you want to submit the quiz?'
                );
                if (!proceed) {
                    this.startTimer(); // Restart timer if user cancels
                    return;
                }
            }

            showLoading('Submitting quiz...');

            // Submit quiz answers
            const result = await api.submitQuiz(
                this.currentQuiz.employeeId,
                this.currentQuiz.moduleId,
                this.answers
            );

            hideLoading();

            if (result.success) {
                this.showQuizResults(result);
            } else {
                showAlert('Failed to submit quiz: ' + result.error, 'error');
            }

        } catch (error) {
            hideLoading();
            console.error('Quiz submission failed:', error);
            showAlert('Failed to submit quiz. Please try again.', 'error');
        }
    }

    // Show quiz results
    showQuizResults(result) {
        const passed = result.passed;
        const score = Math.round(result.score);

        document.getElementById('content').innerHTML = `
            <div class="quiz-results-container">
                <div class="quiz-results-card">
                    <div class="results-header ${passed ? 'success' : 'failure'}">
                        <div class="results-icon">
                            <i class="fas ${passed ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        </div>
                        <h2 class="results-title">
                            ${passed ? 'Congratulations!' : 'Quiz Not Passed'}
                        </h2>
                        <p class="results-subtitle">
                            ${passed ? 'You have successfully completed the quiz.' : 'You need to retake the quiz to pass.'}
                        </p>
                    </div>

                    <div class="results-details">
                        <div class="score-display">
                            <div class="score-circle ${passed ? 'success' : 'failure'}">
                                <span class="score-number">${score}%</span>
                            </div>
                            <div class="score-info">
                                <p>Your Score</p>
                                <p class="passing-score">Passing Score: ${this.currentQuiz.passingScore}%</p>
                            </div>
                        </div>

                        <div class="results-stats">
                            <div class="stat-item">
                                <span class="stat-label">Correct Answers</span>
                                <span class="stat-value">${result.correct_answers} / ${result.total_questions}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Time Taken</span>
                                <span class="stat-value">${this.getTimeTaken()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Attempts</span>
                                <span class="stat-value">${result.attempts || 1}</span>
                            </div>
                        </div>
                    </div>

                    <div class="results-actions">
                        ${passed ? `
                            <button class="btn btn-success" onclick="quizEngine.downloadCertificate()">
                                <i class="fas fa-download"></i> Download Certificate
                            </button>
                            <button class="btn btn-primary" onclick="router.navigate('training/${this.currentQuiz.employeeId}/dashboard')">
                                <i class="fas fa-home"></i> Back to Dashboard
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="quizEngine.retakeQuiz()">
                                <i class="fas fa-redo"></i> Retake Quiz
                            </button>
                            <button class="btn btn-secondary" onclick="router.navigate('training/${this.currentQuiz.employeeId}/dashboard')">
                                <i class="fas fa-home"></i> Back to Dashboard
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Get time taken for quiz
    getTimeTaken() {
        if (!this.timeStarted) return 'Unknown';
        
        const timeTaken = new Date() - this.timeStarted;
        const minutes = Math.floor(timeTaken / (1000 * 60));
        const seconds = Math.floor((timeTaken % (1000 * 60)) / 1000);
        
        return `${minutes}m ${seconds}s`;
    }

    // Retake quiz
    retakeQuiz() {
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.timeStarted = new Date();
        this.updateQuizDisplay();
    }

    // Download certificate
    async downloadCertificate() {
        try {
            showLoading('Generating certificate...');
            
            const result = await api.downloadCertificate(
                this.currentQuiz.employeeId,
                this.currentQuiz.moduleId
            );
            
            hideLoading();
            
            if (result.success) {
                // Create and download certificate
                this.generateCertificatePDF(result.certificate);
            } else {
                showAlert('Failed to generate certificate', 'error');
            }
        } catch (error) {
            hideLoading();
            console.error('Certificate download failed:', error);
            showAlert('Failed to download certificate', 'error');
        }
    }

    // Generate certificate PDF (simplified)
    generateCertificatePDF(certificateData) {
        // Create a simple certificate HTML for download
        const certificateHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h1 style="color: #2c5aa0; margin-bottom: 30px;">Certificate of Completion</h1>
                <p style="font-size: 18px; margin-bottom: 20px;">This is to certify that</p>
                <h2 style="color: #333; margin-bottom: 20px;">${certificateData.employee_name}</h2>
                <p style="font-size: 18px; margin-bottom: 20px;">has successfully completed the training module</p>
                <h3 style="color: #2c5aa0; margin-bottom: 30px;">${certificateData.module_title}</h3>
                <p style="margin-bottom: 10px;">Score: ${certificateData.score}%</p>
                <p style="margin-bottom: 10px;">Completed on: ${new Date(certificateData.completed_at).toLocaleDateString()}</p>
                <p style="margin-bottom: 30px;">Certificate ID: ${certificateData.certificate_id}</p>
                <p style="font-style: italic;">Starcomm Training System</p>
            </div>
        `;

        // Create a new window and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Certificate - ${certificateData.module_title}</title>
                    <style>
                        body { margin: 0; padding: 20px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    ${certificateHTML}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    // Load saved quiz progress
    async loadSavedProgress(employeeId, moduleId) {
        try {
            const progress = await api.getEmployeeProgress(employeeId);
            const moduleProgress = progress.progress.find(p => p.module_id === moduleId);
            
            if (moduleProgress && moduleProgress.quiz_answers) {
                this.answers = JSON.parse(moduleProgress.quiz_answers);
                this.currentQuestionIndex = moduleProgress.current_question || 0;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to load saved progress:', error);
            return false;
        }
    }
}

// Create global quiz engine instance
const quizEngine = new QuizEngine();

