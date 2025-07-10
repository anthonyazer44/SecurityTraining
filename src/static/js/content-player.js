// Content Player for Starcomm Training System

class ContentPlayer {
    constructor() {
        this.currentModule = null;
        this.currentPosition = 0;
        this.totalDuration = 0;
        this.progressTimer = null;
        this.employeeId = null;
        this.notes = '';
    }

    // Initialize content player
    async initPlayer(employeeId, moduleId) {
        try {
            this.employeeId = employeeId;
            
            // Get module data
            const response = await api.getTrainingModule(employeeId, moduleId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to load training module');
            }

            this.currentModule = response.module;
            
            // Load saved progress
            await this.loadProgress();
            
            // Load saved notes
            await this.loadNotes();

            return this.currentModule;
        } catch (error) {
            console.error('Content player initialization failed:', error);
            throw error;
        }
    }

    // Render content player interface
    renderPlayer() {
        if (!this.currentModule) {
            return `
                <div class="content-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Module Not Found</h3>
                    <p>The requested training module could not be loaded.</p>
                </div>
            `;
        }

        return `
            <div class="content-player-container">
                <div class="content-header">
                    <div class="module-info">
                        <h1 class="module-title">${this.currentModule.title}</h1>
                        <p class="module-description">${this.currentModule.description}</p>
                        <div class="module-meta">
                            <span class="module-duration">
                                <i class="fas fa-clock"></i> ${this.currentModule.duration_minutes} minutes
                            </span>
                            <span class="module-category">
                                <i class="fas fa-tag"></i> ${this.currentModule.category}
                            </span>
                        </div>
                    </div>
                    <div class="progress-info">
                        <div class="progress-circle">
                            <div class="progress-text">${Math.round(this.getProgressPercentage())}%</div>
                        </div>
                    </div>
                </div>

                <div class="content-main">
                    <div class="content-area">
                        ${this.renderContentArea()}
                    </div>
                    
                    <div class="content-sidebar">
                        ${this.renderSidebar()}
                    </div>
                </div>

                <div class="content-controls">
                    ${this.renderControls()}
                </div>
            </div>
        `;
    }

    // Render content area (video/text content)
    renderContentArea() {
        const content = this.currentModule.content || '';
        
        // Check if content contains video URL
        if (this.currentModule.video_url) {
            return `
                <div class="video-container">
                    <video id="training-video" 
                           controls 
                           preload="metadata"
                           onloadedmetadata="contentPlayer.onVideoLoaded()"
                           ontimeupdate="contentPlayer.onTimeUpdate()"
                           onended="contentPlayer.onVideoEnded()">
                        <source src="${this.currentModule.video_url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-overlay" id="video-overlay" style="display: none;">
                        <div class="video-controls">
                            <button class="play-btn" onclick="contentPlayer.togglePlay()">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="content-text">
                    <div class="content-body">
                        ${this.formatContent(content)}
                    </div>
                </div>
            `;
        } else {
            // Text-only content
            return `
                <div class="content-text">
                    <div class="content-body">
                        ${this.formatContent(content)}
                    </div>
                </div>
                
                <div class="reading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.getProgressPercentage()}%"></div>
                    </div>
                    <p class="progress-text">Reading Progress: ${Math.round(this.getProgressPercentage())}%</p>
                </div>
            `;
        }
    }

    // Format content with proper HTML
    formatContent(content) {
        if (!content) return '<p>No content available for this module.</p>';
        
        // Convert line breaks to paragraphs
        return content
            .split('\n\n')
            .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    // Render sidebar with notes and navigation
    renderSidebar() {
        return `
            <div class="sidebar-section">
                <h3 class="sidebar-title">
                    <i class="fas fa-sticky-note"></i> Notes
                </h3>
                <div class="notes-area">
                    <textarea id="module-notes" 
                              placeholder="Take notes while learning..."
                              onchange="contentPlayer.saveNotes()">${this.notes}</textarea>
                    <button class="btn btn-sm btn-primary" onclick="contentPlayer.saveNotes()">
                        <i class="fas fa-save"></i> Save Notes
                    </button>
                </div>
            </div>

            <div class="sidebar-section">
                <h3 class="sidebar-title">
                    <i class="fas fa-list"></i> Module Outline
                </h3>
                <div class="module-outline">
                    ${this.renderModuleOutline()}
                </div>
            </div>

            <div class="sidebar-section">
                <h3 class="sidebar-title">
                    <i class="fas fa-question-circle"></i> Quick Help
                </h3>
                <div class="help-content">
                    <ul>
                        <li>Use the notes section to jot down important points</li>
                        <li>Your progress is automatically saved</li>
                        <li>Complete the quiz after finishing the content</li>
                        <li>You can resume from where you left off</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Render module outline
    renderModuleOutline() {
        // Simple outline based on content sections
        const sections = [
            'Introduction',
            'Key Concepts',
            'Best Practices',
            'Common Scenarios',
            'Summary'
        ];

        return `
            <ul class="outline-list">
                ${sections.map((section, index) => `
                    <li class="outline-item ${index <= this.getCurrentSection() ? 'completed' : ''}">
                        <i class="fas ${index <= this.getCurrentSection() ? 'fa-check-circle' : 'fa-circle'}"></i>
                        ${section}
                    </li>
                `).join('')}
            </ul>
        `;
    }

    // Get current section based on progress
    getCurrentSection() {
        const progress = this.getProgressPercentage();
        if (progress >= 80) return 4;
        if (progress >= 60) return 3;
        if (progress >= 40) return 2;
        if (progress >= 20) return 1;
        return 0;
    }

    // Render control buttons
    renderControls() {
        const hasQuiz = this.currentModule.quiz_questions && 
                       JSON.parse(this.currentModule.quiz_questions).length > 0;
        
        return `
            <div class="controls-left">
                <button class="btn btn-secondary" onclick="router.navigate('training/${this.employeeId}/dashboard')">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            
            <div class="controls-center">
                <div class="progress-display">
                    <span class="progress-label">Progress:</span>
                    <div class="progress-bar-small">
                        <div class="progress-fill" style="width: ${this.getProgressPercentage()}%"></div>
                    </div>
                    <span class="progress-percentage">${Math.round(this.getProgressPercentage())}%</span>
                </div>
            </div>
            
            <div class="controls-right">
                <button class="btn btn-outline" onclick="contentPlayer.markAsComplete()">
                    <i class="fas fa-check"></i> Mark Complete
                </button>
                ${hasQuiz ? `
                    <button class="btn btn-primary" onclick="contentPlayer.startQuiz()">
                        <i class="fas fa-question-circle"></i> Take Quiz
                    </button>
                ` : ''}
            </div>
        `;
    }

    // Video event handlers
    onVideoLoaded() {
        const video = document.getElementById('training-video');
        if (video) {
            this.totalDuration = video.duration;
            
            // Resume from saved position
            if (this.currentPosition > 0) {
                video.currentTime = this.currentPosition;
            }
            
            this.startProgressTracking();
        }
    }

    onTimeUpdate() {
        const video = document.getElementById('training-video');
        if (video) {
            this.currentPosition = video.currentTime;
            this.saveProgress();
        }
    }

    onVideoEnded() {
        this.markAsComplete();
    }

    // Toggle video play/pause
    togglePlay() {
        const video = document.getElementById('training-video');
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    }

    // Start progress tracking
    startProgressTracking() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
        }

        this.progressTimer = setInterval(() => {
            this.saveProgress();
        }, 30000); // Save progress every 30 seconds
    }

    // Stop progress tracking
    stopProgressTracking() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
    }

    // Get progress percentage
    getProgressPercentage() {
        if (this.currentModule.video_url && this.totalDuration > 0) {
            return (this.currentPosition / this.totalDuration) * 100;
        } else {
            // For text content, use scroll position or manual completion
            return this.currentPosition; // This would be set manually for text content
        }
    }

    // Load saved progress
    async loadProgress() {
        try {
            const response = await api.getEmployeeProgress(this.employeeId);
            if (response.success) {
                const moduleProgress = response.progress.find(p => p.module_id === this.currentModule.id);
                if (moduleProgress) {
                    this.currentPosition = moduleProgress.last_position || 0;
                }
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }

    // Save progress
    async saveProgress() {
        try {
            const progressData = {
                progress: this.getProgressPercentage(),
                last_position: this.currentPosition,
                last_accessed: new Date().toISOString()
            };

            await api.updateEmployeeProgress(
                this.employeeId,
                this.currentModule.id,
                progressData
            );
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }

    // Load saved notes
    async loadNotes() {
        try {
            const response = await api.getEmployeeNotes(this.employeeId, this.currentModule.id);
            if (response.success) {
                this.notes = response.notes || '';
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }

    // Save notes
    async saveNotes() {
        try {
            const notesTextarea = document.getElementById('module-notes');
            if (notesTextarea) {
                this.notes = notesTextarea.value;
                
                await api.saveEmployeeNotes(this.employeeId, this.currentModule.id, this.notes);
                showAlert('Notes saved successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to save notes:', error);
            showAlert('Failed to save notes', 'error');
        }
    }

    // Mark module as complete
    async markAsComplete() {
        try {
            const progressData = {
                progress: 100,
                completed: true,
                completed_at: new Date().toISOString()
            };

            const response = await api.updateEmployeeProgress(
                this.employeeId,
                this.currentModule.id,
                progressData
            );

            if (response.success) {
                showAlert('Module marked as complete!', 'success');
                
                // Check if there's a quiz
                const hasQuiz = this.currentModule.quiz_questions && 
                               JSON.parse(this.currentModule.quiz_questions).length > 0;
                
                if (hasQuiz) {
                    const takeQuiz = confirm('Would you like to take the quiz now?');
                    if (takeQuiz) {
                        this.startQuiz();
                    }
                }
            }
        } catch (error) {
            console.error('Failed to mark as complete:', error);
            showAlert('Failed to mark module as complete', 'error');
        }
    }

    // Start quiz
    startQuiz() {
        this.stopProgressTracking();
        router.navigate(`training/${this.employeeId}/quiz/${this.currentModule.id}`);
    }

    // Handle text content scrolling for progress tracking
    handleTextProgress() {
        const contentArea = document.querySelector('.content-text');
        if (contentArea) {
            contentArea.addEventListener('scroll', () => {
                const scrollTop = contentArea.scrollTop;
                const scrollHeight = contentArea.scrollHeight - contentArea.clientHeight;
                const scrollPercentage = (scrollTop / scrollHeight) * 100;
                
                this.currentPosition = Math.max(this.currentPosition, scrollPercentage);
                this.saveProgress();
            });
        }
    }

    // Cleanup when leaving the page
    cleanup() {
        this.stopProgressTracking();
        this.saveProgress();
        this.saveNotes();
    }
}

// Create global content player instance
const contentPlayer = new ContentPlayer();

