// Company Admin component for Starcomm Training System

class CompanyAdmin {
    constructor() {
        this.companyData = null;
        this.employees = [];
        this.filteredEmployees = [];
        this.searchTerm = '';
        this.departmentFilter = '';
        this.trainingModules = [];
    }

    async showLogin(companyId) {
        try {
            // Check if already authenticated
            if (await auth.checkAuth() && auth.hasRole('company_admin') && auth.getCompanyId() === companyId) {
                router.navigate(`company/${companyId}/dashboard`);
                return;
            }

            document.getElementById('content').innerHTML = `
                <div class="login-container">
                    <div class="login-card">
                        <div class="login-logo">
                            <i class="fas fa-building"></i>
                        </div>
                        <h1 class="login-title">Company Admin</h1>
                        <p class="login-subtitle">Company ID: ${companyId}</p>
                        
                        <form id="companyLoginForm">
                            <div class="form-group">
                                <label class="form-label">Admin Password</label>
                                <input type="password" class="form-input" id="adminPassword" required>
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

            document.getElementById('companyLoginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('adminPassword').value;

                try {
                    showLoading();
                    const result = await auth.companyAdminLogin(companyId, password);
                    if (result.success) {
                        showAlert('Login successful!', 'success');
                        router.navigate(`company/${companyId}/dashboard`);
                    } else {
                        showAlert(result.message || 'Login failed', 'error');
                    }
                } catch (error) {
                    showAlert('Login failed: ' + error.message, 'error');
                } finally {
                    hideLoading();
                }
            });

        } catch (error) {
            showAlert('Failed to load login page: ' + error.message, 'error');
        }
    }

    async showDashboard(companyId) {
        try {
            const dashboardData = await api.getCompanyDashboard(companyId);
            this.companyData = dashboardData.company;

            document.getElementById('content').innerHTML = `
                <div class="main-content">
                    ${this.renderHeader(companyId)}
                    
                    <main class="dashboard">
                        <div class="container">
                            <div class="dashboard-header">
                                <h1 class="dashboard-title">Company Dashboard</h1>
                                <p class="dashboard-subtitle">Welcome to ${escapeHtml(this.companyData.name)}</p>
                            </div>
                            
                            <div class="stats-grid">
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
                                    <div class="stat-number">${dashboardData.assigned_modules}</div>
                                    <div class="stat-label">Assigned Modules</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="stat-number">${dashboardData.completed_trainings}</div>
                                    <div class="stat-label">Completed Trainings</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-percentage"></i>
                                    </div>
                                    <div class="stat-number">${dashboardData.completion_rate}%</div>
                                    <div class="stat-label">Completion Rate</div>
                                </div>
                            </div>
                            
                            <div class="content-card">
                                <div class="card-header">
                                    <h2 class="card-title">Quick Actions</h2>
                                </div>
                                <div class="card-body">
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                        <button class="btn btn-primary" onclick="router.navigate('company/${companyId}/employees')">
                                            <i class="fas fa-users"></i> Manage Employees
                                        </button>
                                        <button class="btn btn-secondary" onclick="router.navigate('company/${companyId}/assign-training')">
                                            <i class="fas fa-tasks"></i> Assign Training
                                        </button>
                                        <button class="btn btn-secondary" onclick="router.navigate('company/${companyId}/reports')">
                                            <i class="fas fa-chart-bar"></i> View Reports
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="content-card">
                                <div class="card-header">
                                    <h2 class="card-title">Recent Activity</h2>
                                </div>
                                <div class="card-body">
                                    ${this.renderRecentActivity(dashboardData.recent_activity)}
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

    async showEmployees(companyId) {
        try {
            const employeesData = await api.getCompanyEmployees(companyId);
            this.employees = employeesData.employees;
            this.filteredEmployees = [...this.employees];

            document.getElementById('content').innerHTML = `
                <div class="main-content">
                    ${this.renderHeader(companyId)}
                    
                    <main class="dashboard">
                        <div class="container">
                            <div class="dashboard-header">
                                <h1 class="dashboard-title">Employee Management</h1>
                                <p class="dashboard-subtitle">Manage your company's employees</p>
                            </div>
                            
                            <div class="content-card">
                                <div class="card-header">
                                    <h2 class="card-title">Employees</h2>
                                    <div style="display: flex; gap: 1rem;">
                                        <button class="btn btn-secondary" onclick="companyAdmin.showBulkImport(${companyId})">
                                            <i class="fas fa-upload"></i> Import CSV
                                        </button>
                                        <button class="btn btn-primary" onclick="companyAdmin.showAddEmployee(${companyId})">
                                            <i class="fas fa-plus"></i> Add Employee
                                        </button>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <div class="search-filters">
                                        <input type="text" class="search-input" id="employeeSearch" 
                                               placeholder="Search employees..." value="${this.searchTerm}">
                                        <select class="filter-select" id="departmentFilter">
                                            <option value="">All Departments</option>
                                            ${this.getDepartmentOptions()}
                                        </select>
                                    </div>
                                    
                                    <div id="employeesTable">
                                        ${this.renderEmployeesTable()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `;

            this.setupEmployeesEventListeners(companyId);

        } catch (error) {
            showAlert('Failed to load employees: ' + error.message, 'error');
        }
    }

    async showReports(companyId) {
        try {
            const reportsData = await api.getCompanyProgressReport(companyId);

            document.getElementById('content').innerHTML = `
                <div class="main-content">
                    ${this.renderHeader(companyId)}
                    
                    <main class="dashboard">
                        <div class="container">
                            <div class="dashboard-header">
                                <h1 class="dashboard-title">Training Reports</h1>
                                <p class="dashboard-subtitle">Monitor training progress and completion</p>
                            </div>
                            
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-percentage"></i>
                                    </div>
                                    <div class="stat-number">${reportsData.overall_completion_rate}%</div>
                                    <div class="stat-label">Overall Completion</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-clock"></i>
                                    </div>
                                    <div class="stat-number">${reportsData.average_completion_time}</div>
                                    <div class="stat-label">Avg. Completion Time</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <div class="stat-number">${reportsData.top_performers}</div>
                                    <div class="stat-label">Top Performers</div>
                                </div>
                            </div>
                            
                            <div class="content-card">
                                <div class="card-header">
                                    <h2 class="card-title">Module Progress</h2>
                                    <button class="btn btn-secondary" onclick="companyAdmin.exportReport(${companyId})">
                                        <i class="fas fa-download"></i> Export Report
                                    </button>
                                </div>
                                <div class="card-body">
                                    ${this.renderModuleProgress(reportsData.module_progress)}
                                </div>
                            </div>
                            
                            <div class="content-card">
                                <div class="card-header">
                                    <h2 class="card-title">Employee Progress</h2>
                                </div>
                                <div class="card-body">
                                    ${this.renderEmployeeProgress(reportsData.employee_progress)}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `;

        } catch (error) {
            showAlert('Failed to load reports: ' + error.message, 'error');
        }
    }

    async showAssignTraining(companyId) {
        try {
            const [employeesData, modulesData] = await Promise.all([
                api.getCompanyEmployees(companyId),
                api.getCompanyTrainingModules(companyId)
            ]);

            this.employees = employeesData.employees;
            this.trainingModules = modulesData.modules;

            document.getElementById('content').innerHTML = `
                <div class="main-content">
                    ${this.renderHeader(companyId)}
                    
                    <main class="dashboard">
                        <div class="container">
                            <div class="dashboard-header">
                                <h1 class="dashboard-title">Assign Training</h1>
                                <p class="dashboard-subtitle">Assign training modules to employees</p>
                            </div>
                            
                            <div class="content-card">
                                <div class="card-header">
                                    <h2 class="card-title">Training Assignment</h2>
                                </div>
                                <div class="card-body">
                                    <form id="assignTrainingForm">
                                        <div class="form-group">
                                            <label class="form-label">Select Employees</label>
                                            <div class="checkbox-group" id="employeeSelection">
                                                <label class="checkbox-label">
                                                    <input type="checkbox" id="selectAllEmployees" onchange="companyAdmin.toggleSelectAllEmployees()">
                                                    <span>Select All Employees</span>
                                                </label>
                                                ${this.renderEmployeeCheckboxes()}
                                            </div>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label">Select Training Modules</label>
                                            <div class="checkbox-group" id="moduleSelection">
                                                <label class="checkbox-label">
                                                    <input type="checkbox" id="selectAllModules" onchange="companyAdmin.toggleSelectAllModules()">
                                                    <span>Select All Modules</span>
                                                </label>
                                                ${this.renderModuleCheckboxes()}
                                            </div>
                                        </div>
                                        
                                        <div class="form-actions">
                                            <button type="button" class="btn btn-secondary" onclick="router.navigate('company/${companyId}/dashboard')">
                                                Cancel
                                            </button>
                                            <button type="submit" class="btn btn-primary">
                                                <i class="fas fa-tasks"></i> Assign Training
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `;

            document.getElementById('assignTrainingForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.assignTraining(companyId);
            });

        } catch (error) {
            showAlert('Failed to load training assignment: ' + error.message, 'error');
        }
    }

    // Helper methods
    renderHeader(companyId) {
        const companyName = this.companyData ? this.companyData.name : 'Company Portal';
        return `
            <header class="header">
                <div class="container">
                    <div class="header-content">
                        <a href="#company/${companyId}/dashboard" class="logo">
                            <i class="fas fa-building"></i>
                            ${escapeHtml(companyName)}
                        </a>
                        <nav class="nav-menu">
                            <a href="#company/${companyId}/dashboard" class="nav-link">Dashboard</a>
                            <a href="#company/${companyId}/employees" class="nav-link">Employees</a>
                            <a href="#company/${companyId}/assign-training" class="nav-link">Assign Training</a>
                            <a href="#company/${companyId}/reports" class="nav-link">Reports</a>
                        </nav>
                        <div class="user-info">
                            <span>Company Admin</span>
                            <button class="logout-btn" onclick="auth.logout()">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    renderRecentActivity(activities) {
        if (!activities || activities.length === 0) {
            return '<p>No recent activity.</p>';
        }

        let html = '<div class="activity-list">';
        activities.forEach(activity => {
            html += `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${escapeHtml(activity.description)}</p>
                        <span class="activity-time">${formatDateTime(activity.timestamp)}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    renderEmployeesTable() {
        if (this.filteredEmployees.length === 0) {
            return '<p class="text-center">No employees found.</p>';
        }

        let tableHtml = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Position</th>
                            <th>Training Progress</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.filteredEmployees.forEach(employee => {
            tableHtml += `
                <tr>
                    <td><strong>${escapeHtml(employee.first_name)} ${escapeHtml(employee.last_name)}</strong></td>
                    <td>${escapeHtml(employee.email)}</td>
                    <td>${escapeHtml(employee.department || 'N/A')}</td>
                    <td>${escapeHtml(employee.position || 'N/A')}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${createProgressBar(employee.training_progress || 0, (employee.training_progress || 0) + '%')}
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="companyAdmin.editEmployee(${employee.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="companyAdmin.deleteEmployee(${employee.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table></div>';
        return tableHtml;
    }

    renderEmployeeCheckboxes() {
        return this.employees.map(employee => `
            <label class="checkbox-label">
                <input type="checkbox" class="employee-checkbox" value="${employee.id}">
                <span>${escapeHtml(employee.first_name)} ${escapeHtml(employee.last_name)} (${escapeHtml(employee.email)})</span>
            </label>
        `).join('');
    }

    renderModuleCheckboxes() {
        return this.trainingModules.map(module => `
            <label class="checkbox-label">
                <input type="checkbox" class="module-checkbox" value="${module.id}">
                <span>${escapeHtml(module.title)} - ${escapeHtml(module.description)}</span>
            </label>
        `).join('');
    }

    renderModuleProgress(moduleProgress) {
        if (!moduleProgress || moduleProgress.length === 0) {
            return '<p>No module progress data available.</p>';
        }

        let html = '<div class="table-container"><table class="table"><thead><tr>';
        html += '<th>Module</th><th>Assigned</th><th>Completed</th><th>Progress</th>';
        html += '</tr></thead><tbody>';

        moduleProgress.forEach(module => {
            html += `
                <tr>
                    <td><strong>${escapeHtml(module.title)}</strong></td>
                    <td>${module.assigned_count}</td>
                    <td>${module.completed_count}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${createProgressBar(module.completion_rate, module.completion_rate + '%')}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        return html;
    }

    renderEmployeeProgress(employeeProgress) {
        if (!employeeProgress || employeeProgress.length === 0) {
            return '<p>No employee progress data available.</p>';
        }

        let html = '<div class="table-container"><table class="table"><thead><tr>';
        html += '<th>Employee</th><th>Assigned Modules</th><th>Completed</th><th>Progress</th><th>Last Activity</th>';
        html += '</tr></thead><tbody>';

        employeeProgress.forEach(employee => {
            html += `
                <tr>
                    <td><strong>${escapeHtml(employee.name)}</strong></td>
                    <td>${employee.assigned_modules}</td>
                    <td>${employee.completed_modules}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${createProgressBar(employee.completion_rate, employee.completion_rate + '%')}
                        </div>
                    </td>
                    <td>${formatDateOnly(employee.last_activity)}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        return html;
    }

    getDepartmentOptions() {
        const departments = [...new Set(this.employees.map(emp => emp.department).filter(dept => dept))];
        return departments.map(dept => 
            `<option value="${escapeHtml(dept)}" ${this.departmentFilter === dept ? 'selected' : ''}>${escapeHtml(dept)}</option>`
        ).join('');
    }

    setupEmployeesEventListeners(companyId) {
        const searchInput = document.getElementById('employeeSearch');
        const departmentFilter = document.getElementById('departmentFilter');

        searchInput.addEventListener('input', debounce(() => {
            this.searchTerm = searchInput.value;
            this.filterEmployees();
        }, 300));

        departmentFilter.addEventListener('change', () => {
            this.departmentFilter = departmentFilter.value;
            this.filterEmployees();
        });
    }

    filterEmployees() {
        this.filteredEmployees = this.employees.filter(employee => {
            const matchesSearch = !this.searchTerm || 
                employee.first_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                employee.last_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                employee.email.toLowerCase().includes(this.searchTerm.toLowerCase());

            const matchesDepartment = !this.departmentFilter || employee.department === this.departmentFilter;

            return matchesSearch && matchesDepartment;
        });

        document.getElementById('employeesTable').innerHTML = this.renderEmployeesTable();
    }

    // Action methods
    async showAddEmployee(companyId) {
        const modal = createModal('Add Employee', `
            <form id="addEmployeeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">First Name *</label>
                        <input type="text" class="form-input" id="firstName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name *</label>
                        <input type="text" class="form-input" id="lastName" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-input" id="email" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Department</label>
                        <input type="text" class="form-input" id="department">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Position</label>
                        <input type="text" class="form-input" id="position">
                    </div>
                </div>
            </form>
        `, [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onclick: () => closeModal(modal)
            },
            {
                text: 'Add Employee',
                class: 'btn-primary',
                onclick: () => this.createEmployee(companyId, modal)
            }
        ]);
    }

    async createEmployee(companyId, modal) {
        const formData = {
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            department: document.getElementById('department').value,
            position: document.getElementById('position').value
        };

        try {
            showLoading();
            const result = await api.createEmployee(companyId, formData);
            
            if (result.success) {
                showAlert('Employee added successfully!', 'success');
                closeModal(modal);
                await this.showEmployees(companyId); // Refresh the list
            } else {
                showAlert('Failed to add employee: ' + result.message, 'error');
            }
        } catch (error) {
            showAlert('Failed to add employee: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    async showBulkImport(companyId) {
        const modal = createModal('Import Employees from CSV', `
            <div class="form-group">
                <label class="form-label">CSV File</label>
                <input type="file" class="form-input" id="csvFile" accept=".csv" required>
                <small class="form-help">CSV should contain columns: first_name, last_name, email, department, position</small>
            </div>
            <div class="alert alert-info">
                <strong>CSV Format:</strong> The first row should contain headers: first_name, last_name, email, department, position
            </div>
        `, [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onclick: () => closeModal(modal)
            },
            {
                text: 'Import',
                class: 'btn-primary',
                onclick: () => this.importEmployees(companyId, modal)
            }
        ]);
    }

    async importEmployees(companyId, modal) {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];

        if (!file) {
            showAlert('Please select a CSV file.', 'warning');
            return;
        }

        try {
            showLoading();
            const result = await api.bulkImportEmployees(companyId, file);
            
            if (result.success) {
                showAlert(`Successfully imported ${result.imported_count} employees!`, 'success');
                closeModal(modal);
                await this.showEmployees(companyId); // Refresh the list
            } else {
                showAlert('Import failed: ' + result.message, 'error');
            }
        } catch (error) {
            showAlert('Import failed: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    async assignTraining(companyId) {
        const selectedEmployees = Array.from(document.querySelectorAll('.employee-checkbox:checked'))
            .map(cb => parseInt(cb.value));
        const selectedModules = Array.from(document.querySelectorAll('.module-checkbox:checked'))
            .map(cb => parseInt(cb.value));

        if (selectedEmployees.length === 0) {
            showAlert('Please select at least one employee.', 'warning');
            return;
        }

        if (selectedModules.length === 0) {
            showAlert('Please select at least one training module.', 'warning');
            return;
        }

        try {
            showLoading();
            const result = await api.assignTraining(companyId, selectedEmployees, selectedModules);
            
            if (result.success) {
                showAlert(`Training assigned successfully to ${selectedEmployees.length} employees!`, 'success');
                router.navigate(`company/${companyId}/dashboard`);
            } else {
                showAlert('Failed to assign training: ' + result.message, 'error');
            }
        } catch (error) {
            showAlert('Failed to assign training: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    toggleSelectAllEmployees() {
        const selectAll = document.getElementById('selectAllEmployees');
        const checkboxes = document.querySelectorAll('.employee-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    }

    toggleSelectAllModules() {
        const selectAll = document.getElementById('selectAllModules');
        const checkboxes = document.querySelectorAll('.module-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    }

    async editEmployee(employeeId) {
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (!employee) return;

        const modal = createModal('Edit Employee', `
            <form id="editEmployeeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-input" id="editFirstName" value="${escapeHtml(employee.first_name)}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-input" id="editLastName" value="${escapeHtml(employee.last_name)}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="editEmail" value="${escapeHtml(employee.email)}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Department</label>
                        <input type="text" class="form-input" id="editDepartment" value="${escapeHtml(employee.department || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Position</label>
                        <input type="text" class="form-input" id="editPosition" value="${escapeHtml(employee.position || '')}">
                    </div>
                </div>
            </form>
        `, [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onclick: () => closeModal(modal)
            },
            {
                text: 'Save Changes',
                class: 'btn-primary',
                onclick: () => this.saveEmployeeChanges(auth.getCompanyId(), employeeId, modal)
            }
        ]);
    }

    async saveEmployeeChanges(companyId, employeeId, modal) {
        const formData = {
            first_name: document.getElementById('editFirstName').value,
            last_name: document.getElementById('editLastName').value,
            email: document.getElementById('editEmail').value,
            department: document.getElementById('editDepartment').value,
            position: document.getElementById('editPosition').value
        };

        try {
            showLoading();
            const result = await api.updateEmployee(companyId, employeeId, formData);
            
            if (result.success) {
                showAlert('Employee updated successfully!', 'success');
                closeModal(modal);
                await this.showEmployees(companyId); // Refresh the list
            } else {
                showAlert('Failed to update employee: ' + result.message, 'error');
            }
        } catch (error) {
            showAlert('Failed to update employee: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    async deleteEmployee(employeeId) {
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (!employee) return;

        confirmDialog(
            `Are you sure you want to delete "${employee.first_name} ${employee.last_name}"? This action cannot be undone.`,
            async () => {
                try {
                    showLoading();
                    const result = await api.deleteEmployee(auth.getCompanyId(), employeeId);
                    
                    if (result.success) {
                        showAlert('Employee deleted successfully!', 'success');
                        await this.showEmployees(auth.getCompanyId()); // Refresh the list
                    } else {
                        showAlert('Failed to delete employee: ' + result.message, 'error');
                    }
                } catch (error) {
                    showAlert('Failed to delete employee: ' + error.message, 'error');
                } finally {
                    hideLoading();
                }
            }
        );
    }

    async exportReport(companyId) {
        try {
            showLoading();
            // This would typically generate and download a report file
            showAlert('Report export functionality will be implemented in Phase 8.', 'info');
        } catch (error) {
            showAlert('Failed to export report: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }
}

// Create global company admin instance
const companyAdmin = new CompanyAdmin();

