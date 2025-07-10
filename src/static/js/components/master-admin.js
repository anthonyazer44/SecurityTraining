// Master Admin component for Starcomm Training System

class MasterAdmin {
    constructor() {
        this.companies = [];
        this.filteredCompanies = [];
        this.searchTerm = '';
        this.statusFilter = 'all';
    }

    // Show companies management page
    async showCompanies() {
        try {
            const companiesData = await api.getCompanies();
            this.companies = companiesData.companies;
            this.filteredCompanies = [...this.companies];

            document.getElementById('content').innerHTML = `
                <div class="main-content">
                    ${this.renderHeader()}
                    
                    <main class="dashboard">
                        <div class="container">
                            <div class="dashboard-header">
                                <h1 class="dashboard-title">Company Management</h1>
                                <p class="dashboard-subtitle">Manage all registered companies</p>
                            </div>
                            
                            <div class="content-card">
                                <div class="card-header">
                                    <h2 class="card-title">Companies</h2>
                                    <button class="btn btn-primary" onclick="router.navigate('master/create-company')">
                                        <i class="fas fa-plus"></i> Create Company
                                    </button>
                                </div>
                                <div class="card-body">
                                    <div class="search-filters">
                                        <input type="text" class="search-input" id="companySearch" 
                                               placeholder="Search companies..." value="${this.searchTerm}">
                                        <select class="filter-select" id="statusFilter">
                                            <option value="all">All Companies</option>
                                            <option value="active">Active Only</option>
                                            <option value="inactive">Inactive Only</option>
                                        </select>
                                        <button class="btn btn-secondary" onclick="masterAdmin.showBulkActions()">
                                            <i class="fas fa-tasks"></i> Bulk Actions
                                        </button>
                                    </div>
                                    
                                    <div id="companiesTable">
                                        ${this.renderCompaniesTable()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `;

            // Set up event listeners
            this.setupCompaniesEventListeners();

        } catch (error) {
            showAlert('Failed to load companies: ' + error.message, 'error');
        }
    }

    // Render companies table
    renderCompaniesTable() {
        if (this.filteredCompanies.length === 0) {
            return '<p class="text-center">No companies found.</p>';
        }

        let tableHtml = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="selectAll" onchange="masterAdmin.toggleSelectAll()"></th>
                            <th>Company Name</th>
                            <th>Contact Email</th>
                            <th>Industry</th>
                            <th>Employees</th>
                            <th>Created Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.filteredCompanies.forEach(company => {
            const statusBadge = company.is_active 
                ? '<span class="badge badge-success">Active</span>'
                : '<span class="badge badge-danger">Inactive</span>';

            tableHtml += `
                <tr>
                    <td><input type="checkbox" class="company-checkbox" value="${company.id}"></td>
                    <td><strong>${escapeHtml(company.name)}</strong></td>
                    <td>${escapeHtml(company.contact_email)}</td>
                    <td>${escapeHtml(company.industry || 'N/A')}</td>
                    <td>${company.actual_employee_count || 0}</td>
                    <td>${formatDateOnly(company.created_date)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="masterAdmin.editCompany(${company.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="masterAdmin.loginAsAdmin(${company.id})">
                            <i class="fas fa-sign-in-alt"></i> Login
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="masterAdmin.deleteCompany(${company.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table></div>';
        return tableHtml;
    }

    // Set up event listeners for companies page
    setupCompaniesEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('companySearch');
        const statusFilter = document.getElementById('statusFilter');

        searchInput.addEventListener('input', debounce(() => {
            this.searchTerm = searchInput.value;
            this.filterCompanies();
        }, 300));

        statusFilter.addEventListener('change', () => {
            this.statusFilter = statusFilter.value;
            this.filterCompanies();
        });

        // Set current filter value
        statusFilter.value = this.statusFilter;
    }

    // Filter companies based on search and status
    filterCompanies() {
        this.filteredCompanies = this.companies.filter(company => {
            const matchesSearch = !this.searchTerm || 
                company.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                company.contact_email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (company.industry && company.industry.toLowerCase().includes(this.searchTerm.toLowerCase()));

            const matchesStatus = this.statusFilter === 'all' ||
                (this.statusFilter === 'active' && company.is_active) ||
                (this.statusFilter === 'inactive' && !company.is_active);

            return matchesSearch && matchesStatus;
        });

        document.getElementById('companiesTable').innerHTML = this.renderCompaniesTable();
    }

    // Toggle select all checkboxes
    toggleSelectAll() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.company-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    }

    // Show bulk actions modal
    showBulkActions() {
        const selectedIds = Array.from(document.querySelectorAll('.company-checkbox:checked'))
            .map(cb => parseInt(cb.value));

        if (selectedIds.length === 0) {
            showAlert('Please select at least one company.', 'warning');
            return;
        }

        const modal = createModal('Bulk Actions', `
            <p>Selected ${selectedIds.length} companies</p>
            <div class="form-group">
                <label class="form-label">Action</label>
                <select class="form-input" id="bulkAction">
                    <option value="">Select action...</option>
                    <option value="activate">Activate Companies</option>
                    <option value="deactivate">Deactivate Companies</option>
                </select>
            </div>
        `, [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onclick: () => closeModal(modal)
            },
            {
                text: 'Execute',
                class: 'btn-primary',
                onclick: () => this.executeBulkAction(selectedIds, modal)
            }
        ]);
    }

    // Execute bulk action
    async executeBulkAction(companyIds, modal) {
        const action = document.getElementById('bulkAction').value;
        
        if (!action) {
            showAlert('Please select an action.', 'warning');
            return;
        }

        try {
            showLoading();
            const result = await api.bulkCompanyAction(companyIds, action);
            
            if (result.success) {
                showAlert(`${result.message} (${result.affected_count} companies)`, 'success');
                closeModal(modal);
                await this.showCompanies(); // Refresh the list
            } else {
                showAlert('Bulk action failed: ' + result.message, 'error');
            }
        } catch (error) {
            showAlert('Bulk action failed: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    // Show create company form
    async showCreateCompany() {
        document.getElementById('content').innerHTML = `
            <div class="main-content">
                ${this.renderHeader()}
                
                <main class="dashboard">
                    <div class="container">
                        <div class="dashboard-header">
                            <h1 class="dashboard-title">Create New Company</h1>
                            <p class="dashboard-subtitle">Add a new company to the training system</p>
                        </div>
                        
                        <div class="content-card">
                            <div class="card-header">
                                <h2 class="card-title">Company Information</h2>
                            </div>
                            <div class="card-body">
                                <form id="createCompanyForm">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Company Name *</label>
                                            <input type="text" class="form-input" id="companyName" required>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Contact Email *</label>
                                            <input type="email" class="form-input" id="contactEmail" required>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Industry *</label>
                                            <select class="form-input" id="industry" required>
                                                <option value="">Select industry...</option>
                                                <option value="Technology">Technology</option>
                                                <option value="Healthcare">Healthcare</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Education">Education</option>
                                                <option value="Manufacturing">Manufacturing</option>
                                                <option value="Retail">Retail</option>
                                                <option value="Government">Government</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Expected Employee Count</label>
                                            <input type="number" class="form-input" id="employeeCount" min="1">
                                        </div>
                                    </div>
                                    
                                    <div class="form-actions">
                                        <button type="button" class="btn btn-secondary" onclick="router.navigate('master/companies')">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-plus"></i> Create Company
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;

        // Handle form submission
        document.getElementById('createCompanyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createCompany();
        });
    }

    // Create company
    async createCompany() {
        const formData = {
            name: document.getElementById('companyName').value,
            contact_email: document.getElementById('contactEmail').value,
            industry: document.getElementById('industry').value,
            employee_count: parseInt(document.getElementById('employeeCount').value) || 0
        };

        try {
            showLoading();
            const result = await api.createCompany(formData);
            
            if (result.success) {
                showAlert('Company created successfully!', 'success');
                
                // Show company details with password
                this.showCompanyCreatedModal(result.company);
            } else {
                showAlert('Failed to create company: ' + result.message, 'error');
            }
        } catch (error) {
            showAlert('Failed to create company: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    // Show company created modal with login details
    showCompanyCreatedModal(company) {
        const modal = createModal('Company Created Successfully', `
            <div class="alert alert-success">
                <strong>Company "${escapeHtml(company.name)}" has been created successfully!</strong>
            </div>
            
            <h4>Admin Login Details:</h4>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <p><strong>Company ID:</strong> ${company.id}</p>
                <p><strong>Admin Password:</strong> <code>${company.admin_password_plain}</code></p>
                <p><strong>Login URL:</strong> <code>#company/${company.id}/login</code></p>
            </div>
            
            <div class="alert alert-warning">
                <strong>Important:</strong> Please save these details securely. The password will not be shown again.
            </div>
        `, [
            {
                text: 'Copy Details',
                class: 'btn-secondary',
                onclick: () => {
                    const details = `Company: ${company.name}\nCompany ID: ${company.id}\nAdmin Password: ${company.admin_password_plain}\nLogin URL: #company/${company.id}/login`;
                    copyToClipboard(details);
                }
            },
            {
                text: 'Continue',
                class: 'btn-primary',
                onclick: () => {
                    closeModal(modal);
                    router.navigate('master/companies');
                }
            }
        ]);
    }

    // Edit company
    async editCompany(companyId) {
        const company = this.companies.find(c => c.id === companyId);
        if (!company) return;

        const modal = createModal('Edit Company', `
            <form id="editCompanyForm">
                <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input type="text" class="form-input" id="editCompanyName" value="${escapeHtml(company.name)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Contact Email</label>
                    <input type="email" class="form-input" id="editContactEmail" value="${escapeHtml(company.contact_email)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Industry</label>
                    <select class="form-input" id="editIndustry" required>
                        <option value="Technology" ${company.industry === 'Technology' ? 'selected' : ''}>Technology</option>
                        <option value="Healthcare" ${company.industry === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
                        <option value="Finance" ${company.industry === 'Finance' ? 'selected' : ''}>Finance</option>
                        <option value="Education" ${company.industry === 'Education' ? 'selected' : ''}>Education</option>
                        <option value="Manufacturing" ${company.industry === 'Manufacturing' ? 'selected' : ''}>Manufacturing</option>
                        <option value="Retail" ${company.industry === 'Retail' ? 'selected' : ''}>Retail</option>
                        <option value="Government" ${company.industry === 'Government' ? 'selected' : ''}>Government</option>
                        <option value="Other" ${company.industry === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Employee Count</label>
                    <input type="number" class="form-input" id="editEmployeeCount" value="${company.employee_count || ''}" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-input" id="editStatus">
                        <option value="true" ${company.is_active ? 'selected' : ''}>Active</option>
                        <option value="false" ${!company.is_active ? 'selected' : ''}>Inactive</option>
                    </select>
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
                onclick: () => this.saveCompanyChanges(companyId, modal)
            }
        ]);
    }

    // Save company changes
    async saveCompanyChanges(companyId, modal) {
        const formData = {
            name: document.getElementById('editCompanyName').value,
            contact_email: document.getElementById('editContactEmail').value,
            industry: document.getElementById('editIndustry').value,
            employee_count: parseInt(document.getElementById('editEmployeeCount').value) || 0,
            is_active: document.getElementById('editStatus').value === 'true'
        };

        try {
            showLoading();
            const result = await api.updateCompany(companyId, formData);
            
            if (result.success) {
                showAlert('Company updated successfully!', 'success');
                closeModal(modal);
                await this.showCompanies(); // Refresh the list
            } else {
                showAlert('Failed to update company: ' + result.message, 'error');
            }
        } catch (error) {
            showAlert('Failed to update company: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    // Delete company
    async deleteCompany(companyId) {
        const company = this.companies.find(c => c.id === companyId);
        if (!company) return;

        confirmDialog(
            `Are you sure you want to deactivate "${company.name}"? This will prevent the company from accessing the system.`,
            async () => {
                try {
                    showLoading();
                    const result = await api.deleteCompany(companyId);
                    
                    if (result.success) {
                        showAlert('Company deactivated successfully!', 'success');
                        await this.showCompanies(); // Refresh the list
                    } else {
                        showAlert('Failed to deactivate company: ' + result.message, 'error');
                    }
                } catch (error) {
                    showAlert('Failed to deactivate company: ' + error.message, 'error');
                } finally {
                    hideLoading();
                }
            }
        );
    }

    // Login as company admin
    loginAsAdmin(companyId) {
        router.navigate(`company/${companyId}/login`);
    }

    // Show reports
    async showReports() {
        try {
            const reportsData = await api.getMasterAdminReports();

            document.getElementById('content').innerHTML = `
                <div class="main-content">
                    ${this.renderHeader()}
                    
                    <main class="dashboard">
                        <div class="container">
                            <div class="dashboard-header">
                                <h1 class="dashboard-title">System Reports</h1>
                                <p class="dashboard-subtitle">Overview of training progress and system metrics</p>
                            </div>
                            
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-percentage"></i>
                                    </div>
                                    <div class="stat-number">${reportsData.overall_completion_rate}%</div>
                                    <div class="stat-label">Overall Completion Rate</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-tasks"></i>
                                    </div>
                                    <div class="stat-number">${reportsData.total_progress_records}</div>
                                    <div class="stat-label">Total Training Records</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="stat-number">${reportsData.completed_records}</div>
                                    <div class="stat-label">Completed Trainings</div>
                                </div>
                            </div>
                            
                            <div class="content-card">
                                <div class="card-header">
                                    <h2 class="card-title">Module Performance</h2>
                                </div>
                                <div class="card-body">
                                    ${this.renderModuleStats(reportsData.module_stats)}
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

    // Render module statistics
    renderModuleStats(moduleStats) {
        if (!moduleStats || moduleStats.length === 0) {
            return '<p>No module statistics available.</p>';
        }

        let html = '<div class="table-container"><table class="table"><thead><tr>';
        html += '<th>Module Name</th><th>Total Attempts</th><th>Completed</th><th>Completion Rate</th>';
        html += '</tr></thead><tbody>';

        moduleStats.forEach(stat => {
            html += `
                <tr>
                    <td><strong>${escapeHtml(stat.module_name)}</strong></td>
                    <td>${stat.total_attempts}</td>
                    <td>${stat.completed_attempts}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${createProgressBar(stat.completion_rate, stat.completion_rate + '%')}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        return html;
    }

    // Render header for all master admin pages
    renderHeader() {
        return `
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
        `;
    }
}

// Create global master admin instance
const masterAdmin = new MasterAdmin();

