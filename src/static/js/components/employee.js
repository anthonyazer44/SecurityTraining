// Employee component for Starcomm Training System
class Employee {
    constructor() {
        this.currentEmployee = null;
        this.currentModule = null;
        this.modules = [];
        this.progress = [];
        this.currentVideoTime = 0;
        this.notes = {};
    }

    // Initialize employee portal
    async init() {
        try {
            await this.loadEmployeeData();
            await this.loadTrainingModules();
            await this.loadProgress();
            this.render();
        } catch (error) {
            console.error('Failed to initialize employee portal:', error);
            showAlert('Failed to load employee portal', 'error');
        }
    }

    // Load employee data
    async loadEmployeeData() {
        const employeeId = router.getCurrentParams().employeeId;
        if (!employeeId) {
            throw new Error('Employee ID not found');
        }

        try {
            const response = await api.getEmployeeProfile(employeeId);
            this.currentEmployee = response.employee;
        } catch (error) {
            console.error('Failed to load employee data:', error);
            throw error;
        }
    }

    // Load training modules
    async loadTrainingModules() {
        try {
            const response = await api.getTrainingModules();
            this.modules = response.modules || [];
        } catch (error) {
            console.error('Failed to load training modules:', error);
            this.modules = [];
        }
    }

    // Load employee progress
    async loadProgress() {
        try {
            const response = await api.getEmployeeProgress(this.currentEmployee.id);
            this.progress = response.progress || [];
        } catch (error) {
            console.error('Failed to load progress:', error);
            this.progress = [];
        }
    }

    // Render employee portal
    render() {
        const currentPage = router.getCurrentPage();
        
        switch (currentPage) {
            case 'login':
                this.renderLogin();
                break;
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'training':
                this.renderTraining();
                break;
            case 'progress':
                this.renderProgress();
                break;
            case 'certificates':
                this.renderCertificates();
                break;
            default:
                this.renderDashboard();
        }
    }

    // Render employee login page
    renderLogin() {
        const employeeId = router.getCurrentParams().employeeId;
        
        document.getElementById('app').innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <div class="login-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h2>Employee Training Portal</h2>
                        <p class="employee-id">Employee ID: ${employeeId}</p>
                    </div>
                    
                    <form id="employeeLoginForm" class="login-form">
                        <div class="form-group">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" id="password" class="form-input" required>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-full">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10,17 15,12 10,7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            Login
                        </button>
                    </form>
                    
                    <div class="login-footer">
                        <a href="#" class="back-link">← Back to Home</a>
                    </div>
                </div>
            </div>
        `;

        // Add form submission handler
        document.getElementById('employeeLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    // Handle employee login
    async handleLogin() {
        const employeeId = router.getCurrentParams().employeeId;
        const password = document.getElementById('password').value;

        try {
            showLoading();
            const result = await api.employeeLogin(employeeId, password);
            
            if (result.success) {
                showAlert('Login successful!', 'success');
                router.navigate(`training/${employeeId}/dashboard`);
            } else {
                showAlert('Invalid password', 'error');
            }
        } catch (error) {
            showAlert('Login failed: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    // Render employee dashboard
    renderDashboard() {
        const completedModules = this.progress.filter(p => p.completed).length;
        const totalModules = this.modules.length;
        const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        
        const inProgressModule = this.progress.find(p => !p.completed && p.progress > 0);
        const nextModule = this.modules.find(m => !this.progress.some(p => p.module_id === m.id));

        document.getElementById('app').innerHTML = `
            <div class="employee-portal">
                ${this.renderHeader()}
                
                <div class="dashboard-container">
                    <div class="dashboard-header">
                        <h1>Training Dashboard</h1>
                        <p>Welcome back, ${escapeHtml(this.currentEmployee.name)}!</p>
                    </div>
                    
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22,4 12,14.01 9,11.01"></polyline>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <h3>${completedModules}</h3>
                                <p>Completed Modules</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <h3>${totalModules - completedModules}</h3>
                                <p>Remaining Modules</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 12l2 2 4-4"></path>
                                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <h3>${overallProgress}%</h3>
                                <p>Overall Progress</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-content">
                        <div class="dashboard-main">
                            ${inProgressModule ? this.renderContinueTraining(inProgressModule) : ''}
                            ${nextModule ? this.renderNextModule(nextModule) : ''}
                            ${this.renderRecentModules()}
                        </div>
                        
                        <div class="dashboard-sidebar">
                            ${this.renderProgressOverview()}
                            ${this.renderQuickActions()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachDashboardEventListeners();
    }

    // Render continue training section
    renderContinueTraining(progressData) {
        const module = this.modules.find(m => m.id === progressData.module_id);
        if (!module) return '';

        return `
            <div class="continue-training">
                <h2>Continue Training</h2>
                <div class="training-card featured">
                    <div class="training-card-content">
                        <h3>${escapeHtml(module.title)}</h3>
                        <p>${escapeHtml(module.description)}</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressData.progress}%"></div>
                        </div>
                        <p class="progress-text">${progressData.progress}% Complete</p>
                    </div>
                    <div class="training-card-actions">
                        <button class="btn btn-primary" onclick="employee.startModule(${module.id})">
                            Continue Training
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Render next module section
    renderNextModule(module) {
        return `
            <div class="next-module">
                <h2>Start Next Module</h2>
                <div class="training-card">
                    <div class="training-card-content">
                        <h3>${escapeHtml(module.title)}</h3>
                        <p>${escapeHtml(module.description)}</p>
                        <div class="module-meta">
                            <span class="duration">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                                ${module.duration || '30'} minutes
                            </span>
                        </div>
                    </div>
                    <div class="training-card-actions">
                        <button class="btn btn-primary" onclick="employee.startModule(${module.id})">
                            Start Module
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Render recent modules
    renderRecentModules() {
        const recentProgress = this.progress
            .filter(p => p.last_accessed)
            .sort((a, b) => new Date(b.last_accessed) - new Date(a.last_accessed))
            .slice(0, 3);

        if (recentProgress.length === 0) return '';

        return `
            <div class="recent-modules">
                <h2>Recent Activity</h2>
                <div class="module-list">
                    ${recentProgress.map(progress => {
                        const module = this.modules.find(m => m.id === progress.module_id);
                        if (!module) return '';
                        
                        return `
                            <div class="module-item">
                                <div class="module-info">
                                    <h4>${escapeHtml(module.title)}</h4>
                                    <p>Last accessed: ${formatDate(progress.last_accessed)}</p>
                                </div>
                                <div class="module-progress">
                                    <div class="progress-circle" data-progress="${progress.progress}">
                                        <span>${progress.progress}%</span>
                                    </div>
                                </div>
                                <div class="module-actions">
                                    <button class="btn btn-secondary btn-sm" onclick="employee.startModule(${module.id})">
                                        ${progress.completed ? 'Review' : 'Continue'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Render progress overview
    renderProgressOverview() {
        const completedModules = this.progress.filter(p => p.completed).length;
        const totalModules = this.modules.length;

        return `
            <div class="progress-overview">
                <h3>Progress Overview</h3>
                <div class="progress-chart">
                    <div class="progress-circle-large" data-progress="${totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0}">
                        <span>${completedModules}/${totalModules}</span>
                    </div>
                </div>
                <div class="progress-details">
                    <div class="progress-item">
                        <span class="progress-label">Completed</span>
                        <span class="progress-value">${completedModules}</span>
                    </div>
                    <div class="progress-item">
                        <span class="progress-label">In Progress</span>
                        <span class="progress-value">${this.progress.filter(p => !p.completed && p.progress > 0).length}</span>
                    </div>
                    <div class="progress-item">
                        <span class="progress-label">Not Started</span>
                        <span class="progress-value">${totalModules - this.progress.length}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Render quick actions
    renderQuickActions() {
        return `
            <div class="quick-actions">
                <h3>Quick Actions</h3>
                <div class="action-buttons">
                    <button class="btn btn-outline" onclick="router.navigate('training/${this.currentEmployee.id}/progress')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"></path>
                            <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                        </svg>
                        View Progress
                    </button>
                    <button class="btn btn-outline" onclick="router.navigate('training/${this.currentEmployee.id}/certificates')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10,9 9,9 8,9"></polyline>
                        </svg>
                        Certificates
                    </button>
                    <button class="btn btn-outline" onclick="employee.downloadProgress()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download Report
                    </button>
                </div>
            </div>
        `;
    }

    // Render training module page
    renderTraining() {
        const moduleId = parseInt(router.getCurrentParams().moduleId);
        const module = this.modules.find(m => m.id === moduleId);
        
        if (!module) {
            showAlert('Training module not found', 'error');
            router.navigate(`training/${this.currentEmployee.id}/dashboard`);
            return;
        }

        const progress = this.progress.find(p => p.module_id === moduleId) || { progress: 0, completed: false };

        document.getElementById('app').innerHTML = `
            <div class="employee-portal">
                ${this.renderHeader()}
                
                <div class="training-container">
                    <div class="training-header">
                        <button class="btn btn-secondary" onclick="router.navigate('training/${this.currentEmployee.id}/dashboard')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15,18 9,12 15,6"></polyline>
                            </svg>
                            Back to Dashboard
                        </button>
                        <div class="training-info">
                            <h1>${escapeHtml(module.title)}</h1>
                            <p>${escapeHtml(module.description)}</p>
                        </div>
                        <div class="training-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress.progress}%"></div>
                            </div>
                            <span>${progress.progress}% Complete</span>
                        </div>
                    </div>
                    
                    <div class="training-content">
                        <div class="training-main">
                            ${this.renderVideoPlayer(module)}
                            ${this.renderModuleContent(module)}
                        </div>
                        
                        <div class="training-sidebar">
                            ${this.renderNotes(moduleId)}
                            ${this.renderModuleNavigation(module)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachTrainingEventListeners(moduleId);
    }

    // Render video player
    renderVideoPlayer(module) {
        return `
            <div class="video-player">
                <div class="video-container">
                    <video id="trainingVideo" controls>
                        <source src="${module.video_url || '/static/videos/sample-training.mp4'}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div class="video-controls">
                    <button id="playPauseBtn" class="btn btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                        Play
                    </button>
                    <div class="video-progress">
                        <input type="range" id="videoProgress" min="0" max="100" value="0">
                    </div>
                    <span id="videoTime">0:00 / 0:00</span>
                </div>
            </div>
        `;
    }

    // Render module content
    renderModuleContent(module) {
        const content = module.content || this.getDefaultModuleContent(module.title);
        
        return `
            <div class="module-content">
                <div class="content-section">
                    <h2>Learning Objectives</h2>
                    <ul>
                        ${module.objectives ? module.objectives.map(obj => `<li>${escapeHtml(obj)}</li>`).join('') : '<li>Complete the training module</li><li>Pass the assessment quiz</li>'}
                    </ul>
                </div>
                
                <div class="content-section">
                    <h2>Module Content</h2>
                    <div class="content-text">
                        ${content}
                    </div>
                </div>
                
                <div class="content-section">
                    <h2>Assessment</h2>
                    <p>After completing the video and reading the content, you'll need to pass a quiz to complete this module.</p>
                    <button class="btn btn-primary" onclick="employee.startQuiz(${module.id})">
                        Start Assessment
                    </button>
                </div>
            </div>
        `;
    }

    // Render notes section
    renderNotes(moduleId) {
        const notes = this.notes[moduleId] || '';
        
        return `
            <div class="notes-section">
                <h3>My Notes</h3>
                <textarea id="moduleNotes" placeholder="Take notes while watching the training..." rows="8">${escapeHtml(notes)}</textarea>
                <button class="btn btn-secondary btn-sm" onclick="employee.saveNotes(${moduleId})">
                    Save Notes
                </button>
            </div>
        `;
    }

    // Render module navigation
    renderModuleNavigation(currentModule) {
        const currentIndex = this.modules.findIndex(m => m.id === currentModule.id);
        const prevModule = currentIndex > 0 ? this.modules[currentIndex - 1] : null;
        const nextModule = currentIndex < this.modules.length - 1 ? this.modules[currentIndex + 1] : null;

        return `
            <div class="module-navigation">
                <h3>Module Navigation</h3>
                <div class="nav-buttons">
                    ${prevModule ? `
                        <button class="btn btn-outline" onclick="employee.startModule(${prevModule.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15,18 9,12 15,6"></polyline>
                            </svg>
                            Previous Module
                        </button>
                    ` : ''}
                    
                    ${nextModule ? `
                        <button class="btn btn-primary" onclick="employee.startModule(${nextModule.id})">
                            Next Module
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                
                <div class="module-list">
                    <h4>All Modules</h4>
                    ${this.modules.map(module => {
                        const progress = this.progress.find(p => p.module_id === module.id);
                        const isCompleted = progress && progress.completed;
                        const isInProgress = progress && progress.progress > 0 && !progress.completed;
                        const isCurrent = module.id === currentModule.id;
                        
                        return `
                            <div class="module-nav-item ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}">
                                <button onclick="employee.startModule(${module.id})">
                                    <span class="module-status">
                                        ${isCompleted ? '✓' : isInProgress ? '◐' : '○'}
                                    </span>
                                    <span class="module-title">${escapeHtml(module.title)}</span>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Render header
    renderHeader() {
        return `
            <header class="employee-header">
                <div class="header-content">
                    <div class="header-left">
                        <h1 class="logo">Starcomm Training</h1>
                        <nav class="header-nav">
                            <a href="#training/${this.currentEmployee.id}/dashboard" class="nav-link">Dashboard</a>
                            <a href="#training/${this.currentEmployee.id}/progress" class="nav-link">Progress</a>
                            <a href="#training/${this.currentEmployee.id}/certificates" class="nav-link">Certificates</a>
                        </nav>
                    </div>
                    <div class="header-right">
                        <div class="user-info">
                            <span class="user-name">${escapeHtml(this.currentEmployee.name)}</span>
                            <span class="user-role">Employee</span>
                        </div>
                        <button class="btn btn-secondary" onclick="employee.logout()">
                            Logout
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    // Start training module
    async startModule(moduleId) {
        try {
            // Update last accessed time
            await api.updateEmployeeProgress(this.currentEmployee.id, moduleId, { last_accessed: new Date().toISOString() });
            
            // Navigate to training page
            router.navigate(`training/${this.currentEmployee.id}/training/${moduleId}`);
        } catch (error) {
            console.error('Failed to start module:', error);
            showAlert('Failed to start module', 'error');
        }
    }

    // Start quiz
    async startQuiz(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module || !module.quiz_questions) {
            showAlert('Quiz not available for this module', 'error');
            return;
        }

        // Implement quiz functionality
        this.renderQuiz(module);
    }

    // Save notes
    async saveNotes(moduleId) {
        const notes = document.getElementById('moduleNotes').value;
        this.notes[moduleId] = notes;
        
        try {
            await api.saveEmployeeNotes(this.currentEmployee.id, moduleId, notes);
            showAlert('Notes saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save notes:', error);
            showAlert('Failed to save notes', 'error');
        }
    }

    // Logout
    async logout() {
        try {
            await api.employeeLogout(this.currentEmployee.id);
            router.navigate('');
        } catch (error) {
            console.error('Logout failed:', error);
            router.navigate('');
        }
    }

    // Get default module content
    getDefaultModuleContent(title) {
        const defaultContent = {
            'Password Security': `
                <p>Strong passwords are your first line of defense against cyber attacks. In this module, you'll learn:</p>
                <ul>
                    <li>How to create strong, unique passwords</li>
                    <li>The importance of password managers</li>
                    <li>Two-factor authentication best practices</li>
                    <li>Common password attacks and how to avoid them</li>
                </ul>
            `,
            'Phishing Awareness': `
                <p>Phishing attacks are one of the most common cyber threats. This module covers:</p>
                <ul>
                    <li>Identifying suspicious emails and messages</li>
                    <li>Common phishing techniques</li>
                    <li>How to verify sender authenticity</li>
                    <li>Reporting phishing attempts</li>
                </ul>
            `,
            'Social Engineering': `
                <p>Social engineering attacks target human psychology rather than technology. Learn about:</p>
                <ul>
                    <li>Common social engineering tactics</li>
                    <li>How to verify requests for sensitive information</li>
                    <li>Building a security-conscious mindset</li>
                    <li>Protecting personal and company information</li>
                </ul>
            `,
            'Data Protection': `
                <p>Protecting sensitive data is crucial for business security. This module includes:</p>
                <ul>
                    <li>Data classification and handling procedures</li>
                    <li>Secure file sharing practices</li>
                    <li>Privacy regulations and compliance</li>
                    <li>Incident reporting procedures</li>
                </ul>
            `,
            'Mobile Security': `
                <p>Mobile devices present unique security challenges. Topics covered:</p>
                <ul>
                    <li>Securing mobile devices and applications</li>
                    <li>Safe browsing on mobile networks</li>
                    <li>App permissions and privacy settings</li>
                    <li>Remote work security considerations</li>
                </ul>
            `
        };

        return defaultContent[title] || '<p>Training content for this module.</p>';
    }

    // Attach dashboard event listeners
    attachDashboardEventListeners() {
        // Initialize progress circles
        this.initializeProgressCircles();
    }

    // Attach training event listeners
    attachTrainingEventListeners(moduleId) {
        const video = document.getElementById('trainingVideo');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const progressBar = document.getElementById('videoProgress');
        const timeDisplay = document.getElementById('videoTime');

        if (video && playPauseBtn) {
            // Play/pause functionality
            playPauseBtn.addEventListener('click', () => {
                if (video.paused) {
                    video.play();
                    playPauseBtn.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                        Pause
                    `;
                } else {
                    video.pause();
                    playPauseBtn.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                        Play
                    `;
                }
            });

            // Progress tracking
            video.addEventListener('timeupdate', () => {
                if (video.duration) {
                    const progress = (video.currentTime / video.duration) * 100;
                    progressBar.value = progress;
                    
                    // Update time display
                    const currentTime = this.formatTime(video.currentTime);
                    const totalTime = this.formatTime(video.duration);
                    timeDisplay.textContent = `${currentTime} / ${totalTime}`;
                    
                    // Save progress
                    this.updateVideoProgress(moduleId, progress);
                }
            });

            // Seek functionality
            progressBar.addEventListener('input', () => {
                if (video.duration) {
                    const time = (progressBar.value / 100) * video.duration;
                    video.currentTime = time;
                }
            });
        }
    }

    // Initialize progress circles
    initializeProgressCircles() {
        const circles = document.querySelectorAll('.progress-circle, .progress-circle-large');
        circles.forEach(circle => {
            const progress = parseInt(circle.dataset.progress);
            // Add CSS animation for progress circles
            circle.style.setProperty('--progress', progress);
        });
    }

    // Update video progress
    async updateVideoProgress(moduleId, progress) {
        try {
            await api.updateEmployeeProgress(this.currentEmployee.id, moduleId, { 
                progress: Math.round(progress),
                last_accessed: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    }

    // Format time for video player
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Download progress report
    async downloadProgress() {
        try {
            const response = await api.downloadEmployeeProgress(this.currentEmployee.id);
            // Create download link
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `training-progress-${this.currentEmployee.name}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download progress:', error);
            showAlert('Failed to download progress report', 'error');
        }
    }
}

// Create global employee instance
const employee = new Employee();

