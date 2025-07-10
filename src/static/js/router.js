// Router module for Starcomm Training System

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    // Initialize router
    init() {
        // Define routes
        this.addRoute('', this.showHome);
        this.addRoute('master/login', this.showMasterLogin);
        this.addRoute('master/dashboard', this.showMasterDashboard);
        this.addRoute('master/companies', this.showMasterCompanies);
        this.addRoute('master/create-company', this.showMasterCreateCompany);
        this.addRoute('master/reports', this.showMasterReports);
        
        this.addRoute('company/:id/login', this.showCompanyLogin);
        this.addRoute('company/:id/dashboard', this.showCompanyDashboard);
        this.addRoute('company/:id/employees', this.showCompanyEmployees);
        this.addRoute('company/:id/reports', this.showCompanyReports);
        this.addRoute('company/:id/assign-training', this.showAssignTraining);
        
        this.addRoute('training/:id/login', this.showEmployeeLogin);
        this.addRoute('training/:id/dashboard', this.showEmployeeDashboard);
        this.addRoute('training/:id/training/:moduleId', this.showTrainingModule);
        this.addRoute('training/:id/quiz/:moduleId', this.showQuiz);
        this.addRoute('training/:id/progress', this.showEmployeeProgress);
        this.addRoute('training/:id/certificates', this.showEmployeeCertificates);

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    // Add route
    addRoute(path, handler) {
        this.routes[path] = handler.bind(this);
    }

    // Handle route change
    async handleRoute() {
        const hash = window.location.hash.slice(1) || '';
        this.currentRoute = hash;

        // Find matching route
        const route = this.findRoute(hash);
        if (route) {
            try {
                showLoading();
                await route.handler(route.params);
            } catch (error) {
                console.error('Route handler error:', error);
                showAlert('An error occurred while loading the page.', 'error');
            } finally {
                hideLoading();
            }
        } else {
            this.showNotFound();
        }
    }

    // Find matching route
    findRoute(path) {
        // Try exact match first
        if (this.routes[path]) {
            return { handler: this.routes[path], params: {} };
        }

        // Try pattern matching
        for (const routePath in this.routes) {
            const params = this.matchRoute(routePath, path);
            if (params !== null) {
                return { handler: this.routes[routePath], params };
            }
        }

        return null;
    }

    // Match route with parameters
    matchRoute(routePath, actualPath) {
        const routeParts = routePath.split('/');
        const actualParts = actualPath.split('/');

        if (routeParts.length !== actualParts.length) {
            return null;
        }

        const params = {};
        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const actualPart = actualParts[i];

            if (routePart.startsWith(':')) {
                // Parameter
                const paramName = routePart.slice(1);
                params[paramName] = actualPart;
            } else if (routePart !== actualPart) {
                // Literal doesn't match
                return null;
            }
        }

        return params;
    }

    // Navigate to route
    navigate(path) {
        window.location.hash = path;
    }

    // Route handlers
    async showHome() {
        document.getElementById('content').innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h1 class="login-title">Starcomm Training System</h1>
                    <p class="login-subtitle">Security Awareness Training Platform</p>
                    
                    <div class="form-group">
                        <h3>Select Portal</h3>
                        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="router.navigate('master/login')">
                                <i class="fas fa-user-shield"></i> Master Admin Portal
                            </button>
                            <button class="btn btn-secondary" onclick="showCompanySelector()">
                                <i class="fas fa-building"></i> Company Admin Portal
                            </button>
                            <button class="btn btn-secondary" onclick="showEmployeeSelector()">
                                <i class="fas fa-users"></i> Employee Training Portal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async showMasterLogin() {
        if (await auth.checkAuth() && auth.hasRole('master_admin')) {
            this.navigate('master/dashboard');
            return;
        }

        document.getElementById('content').innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h1 class="login-title">Master Admin</h1>
                    <p class="login-subtitle">Starcomm Training System</p>
                    
                    <form id="masterLoginForm">
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" class="form-input" id="username" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-input" id="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-sign-in-alt"></i> Login
                        </button>
                    </form>
                    
                    <div style="margin-top: 1rem;">
                        <a href="#" onclick="router.navigate('')" class="nav-link">← Back to Home</a>
                    </div>
                </div>
            </div>
        `;

        // Handle form submission
        document.getElementById('masterLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                showLoading();
                const result = await auth.masterAdminLogin(username, password);
                if (result.success) {
                    showAlert('Login successful!', 'success');
                    this.navigate('master/dashboard');
                } else {
                    showAlert(result.message || 'Login failed', 'error');
                }
            } catch (error) {
                showAlert('Login failed: ' + error.message, 'error');
            } finally {
                hideLoading();
            }
        });
    }

    async showMasterDashboard() {
        if (!auth.requireAuth(['master_admin'])) return;

        try {
            const dashboardData = await api.getMasterAdminDashboard();
            
            document.getElementById('content').innerHTML = `
                <div class="main-content">
                    <header class="header">
                        <div class="container">
                            <div class="header-content">
                                <a href="#master/dashboard" class="logo">
                                    <i class="fas fa-shield-alt"></i>
                                    Starcomm Training System
                                </a>
                                <nav class="nav-menu">
                                    <a href="#master/dashboard" class="nav-link">Dashboard</a>
                                    <a href="#master/companies" class="nav-link">Companies</a>
                                    <a href="#master/create-company" class="nav-link">Create Company</a>
                                    <a href="#master/reports" class="nav-link">Reports</a>
                                </nav>
                                <div class="user-info">
                                    <span>Master Admin</span>
                                    <button class="logout-btn" onclick="auth.logout()">
                                        <i class="fas fa-sign-out-alt"></i> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <main class="dashboard">
                        <div class="container">
                            <div class="dashboard-header">
                                <h1 class="dashboard-title">Master Admin Dashboard</h1>
                                <p class="dashboard-subtitle">Manage companies and monitor training progress</p>
                            </div>
                            
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-building"></i>
                                    </div>
                                    <div class="stat-number">${dashboardData.total_companies}</div>
                                    <div class="stat-label">Total Companies</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <div class="stat-number">${dashboardData.total_employees}</div>
                                    <div class="stat-label">Total Employees</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-graduation-cap"></i>
                                    </div>
                                    <div class="stat-number">${dashboardData.active_modules}</div>
                                    <div class="stat-label">Active Modules</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="stat-number">${dashboardData.active_companies}</div>
                                    <div class="stat-label">Active Companies</div>
                                </div>
                            </div>
                            
                            <div class="content-card">
                                <div class="card-header">
                                    <h2 class="card-title">Quick Actions</h2>
                                </div>
                                <div class="card-body">
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                        <button class="btn btn-primary" onclick="router.navigate('master/create-company')">
                                            <i class="fas fa-plus"></i> Create New Company
                                        </button>
                                        <button class="btn btn-secondary" onclick="router.navigate('master/companies')">
                                            <i class="fas fa-list"></i> Manage Companies
                                        </button>
                                        <button class="btn btn-secondary" onclick="router.navigate('master/reports')">
                                            <i class="fas fa-chart-bar"></i> View Reports
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `;
        } catch (error) {
            showAlert('Failed to load dashboard: ' + error.message, 'error');
        }
    }

    async showMasterCompanies() {
        if (!auth.requireAuth(['master_admin'])) return;
        
        // Load and display companies list
        await masterAdmin.showCompanies();
    }

    async showMasterCreateCompany() {
        if (!auth.requireAuth(['master_admin'])) return;
        
        // Load and display create company form
        await masterAdmin.showCreateCompany();
    }

    async showMasterReports() {
        if (!auth.requireAuth(['master_admin'])) return;
        
        // Load and display reports
        await masterAdmin.showReports();
    }

    async showCompanyLogin(params) {
        const companyId = parseInt(params.id);
        
        if (await auth.checkAuth() && auth.hasRole('company_admin') && auth.getCompanyId() === companyId) {
            this.navigate(`company/${companyId}/dashboard`);
            return;
        }

        // Load and display company login
        await companyAdmin.showLogin(companyId);
    }

    async showCompanyDashboard(params) {
        const companyId = parseInt(params.id);
        
        if (!auth.requireAuth(['company_admin']) || auth.getCompanyId() !== companyId) {
            this.navigate(`company/${companyId}/login`);
            return;
        }
        
        // Load and display company dashboard
        await companyAdmin.showDashboard(companyId);
    }

    async showCompanyEmployees(params) {
        const companyId = parseInt(params.id);
        
        if (!auth.requireAuth(['company_admin']) || auth.getCompanyId() !== companyId) {
            this.navigate(`company/${companyId}/login`);
            return;
        }
        
        // Load and display employees management
        await companyAdmin.showEmployees(companyId);
    }

    async showCompanyReports(params) {
        const companyId = parseInt(params.id);
        
        if (!auth.requireAuth(['company_admin']) || auth.getCompanyId() !== companyId) {
            this.navigate(`company/${companyId}/login`);
            return;
        }
        
        // Load and display company reports
        await companyAdmin.showReports(companyId);
    }

    async showAssignTraining(params) {
        const companyId = parseInt(params.id);
        
        if (!auth.requireAuth(['company_admin']) || auth.getCompanyId() !== companyId) {
            this.navigate(`company/${companyId}/login`);
            return;
        }
        
        // Load and display training assignment
        await companyAdmin.showAssignTraining(companyId);
    }

    async showEmployeeLogin(params) {
        const companyId = parseInt(params.id);
        
        if (await auth.checkAuth() && auth.hasRole('employee') && auth.getCompanyId() === companyId) {
            this.navigate(`training/${companyId}/dashboard`);
            return;
        }

        // Load and display employee login
        await employee.showLogin(companyId);
    }

    async showEmployeeDashboard(params) {
        const companyId = parseInt(params.id);
        
        if (!auth.requireAuth(['employee']) || auth.getCompanyId() !== companyId) {
            this.navigate(`training/${companyId}/login`);
            return;
        }
        
        // Load and display employee dashboard
        await employee.showDashboard(companyId);
    }

    async showTrainingModule(params) {
        const companyId = parseInt(params.id);
        const moduleId = parseInt(params.moduleId);
        
        if (!auth.requireAuth(['employee']) || auth.getCompanyId() !== companyId) {
            this.navigate(`training/${companyId}/login`);
            return;
        }
        
        // Load and display training module
        await employee.showTrainingModule(companyId, moduleId);
    }

    async showQuiz(params) {
        const employeeId = parseInt(params.id);
        const moduleId = parseInt(params.moduleId);
        
        if (!auth.requireAuth(['employee'])) {
            this.navigate(`training/${employeeId}/login`);
            return;
        }
        
        try {
            showLoading('Loading quiz...');
            
            // Initialize quiz
            await quizEngine.initQuiz(moduleId, employeeId);
            
            // Render quiz interface
            document.getElementById('content').innerHTML = quizEngine.renderQuiz();
            
            // Start timer
            quizEngine.startTimer();
            
            hideLoading();
        } catch (error) {
            hideLoading();
            console.error('Failed to load quiz:', error);
            showAlert('Failed to load quiz. Please try again.', 'error');
        }
    }

    async showEmployeeProgress(params) {
        const companyId = parseInt(params.id);
        
        if (!auth.requireAuth(['employee']) || auth.getCompanyId() !== companyId) {
            this.navigate(`training/${companyId}/login`);
            return;
        }
        
        // Load and display employee progress
        await employee.showProgress(companyId);
    }

    async showEmployeeCertificates(params) {
        const employeeId = parseInt(params.id);
        
        if (!auth.requireAuth(['employee'])) {
            this.navigate(`training/${employeeId}/login`);
            return;
        }
        
        // Load and display employee certificates
        await employee.showCertificates(employeeId);
    }

    showNotFound() {
        document.getElementById('content').innerHTML = `
            <div class="login-container">
                <div class="login-card text-center">
                    <div class="login-logo">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h1 class="login-title">Page Not Found</h1>
                    <p class="login-subtitle">The page you're looking for doesn't exist.</p>
                    <button class="btn btn-primary" onclick="router.navigate('')">
                        <i class="fas fa-home"></i> Go Home
                    </button>
                </div>
            </div>
        `;
    }
}

// Global functions for selectors
function showCompanySelector() {
    const modal = createModal('Select Company', `
        <div class="form-group">
            <label class="form-label">Enter Company ID</label>
            <input type="number" class="form-input" id="companyIdInput" placeholder="Company ID" min="1">
        </div>
    `, [
        {
            text: 'Cancel',
            class: 'btn-secondary',
            onclick: () => closeModal(modal)
        },
        {
            text: 'Continue',
            class: 'btn-primary',
            onclick: () => {
                const companyId = document.getElementById('companyIdInput').value;
                if (companyId) {
                    closeModal(modal);
                    router.navigate(`company/${companyId}/login`);
                } else {
                    showAlert('Please enter a valid Company ID', 'error');
                }
            }
        }
    ]);
}

function showEmployeeSelector() {
    const modal = createModal('Select Company', `
        <div class="form-group">
            <label class="form-label">Enter Company ID</label>
            <input type="number" class="form-input" id="employeeCompanyIdInput" placeholder="Company ID" min="1">
        </div>
    `, [
        {
            text: 'Cancel',
            class: 'btn-secondary',
            onclick: () => closeModal(modal)
        },
        {
            text: 'Continue',
            class: 'btn-primary',
            onclick: () => {
                const companyId = document.getElementById('employeeCompanyIdInput').value;
                if (companyId) {
                    closeModal(modal);
                    router.navigate(`training/${companyId}/login`);
                } else {
                    showAlert('Please enter a valid Company ID', 'error');
                }
            }
        }
    ]);
}

// Create global router instance
const router = new Router();

