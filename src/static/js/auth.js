// Authentication module for Starcomm Training System

class Auth {
    constructor() {
        this.currentUser = null;
        this.userType = null;
        this.companyId = null;
        this.employeeId = null;
    }

    // Check authentication status
    async checkAuth() {
        try {
            // Try to determine user type from URL
            const path = window.location.pathname;
            const hash = window.location.hash;
            
            if (path.includes('/master') || hash.includes('master')) {
                const result = await api.checkMasterAdminAuth();
                if (result.authenticated) {
                    this.userType = 'master_admin';
                    return true;
                }
            } else if (path.includes('/company') || hash.includes('company')) {
                const companyId = this.extractCompanyIdFromUrl();
                if (companyId) {
                    const result = await api.checkCompanyAdminAuth(companyId);
                    if (result.authenticated) {
                        this.userType = 'company_admin';
                        this.companyId = companyId;
                        return true;
                    }
                }
            } else if (path.includes('/training') || hash.includes('training')) {
                const companyId = this.extractCompanyIdFromUrl();
                if (companyId) {
                    const result = await api.checkEmployeeAuth(companyId);
                    if (result.authenticated) {
                        this.userType = 'employee';
                        this.companyId = companyId;
                        this.employeeId = result.employee_id;
                        return true;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    // Extract company ID from URL
    extractCompanyIdFromUrl() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        // Try to extract from hash first
        const hashMatch = hash.match(/company\/(\d+)|training\/(\d+)/);
        if (hashMatch) {
            return parseInt(hashMatch[1] || hashMatch[2]);
        }
        
        // Try to extract from path
        const pathMatch = path.match(/company\/(\d+)|training\/(\d+)/);
        if (pathMatch) {
            return parseInt(pathMatch[1] || pathMatch[2]);
        }
        
        return null;
    }

    // Master Admin login
    async masterAdminLogin(username, password) {
        try {
            const result = await api.masterAdminLogin(username, password);
            if (result.success) {
                this.userType = 'master_admin';
                this.currentUser = { username };
                return { success: true };
            }
            return { success: false, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Company Admin login
    async companyAdminLogin(companyId, password) {
        try {
            const result = await api.companyAdminLogin(companyId, password);
            if (result.success) {
                this.userType = 'company_admin';
                this.companyId = companyId;
                this.currentUser = result.company;
                return { success: true, company: result.company };
            }
            return { success: false, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Employee login
    async employeeLogin(employeeId, password) {
        try {
            const result = await api.employeeLogin(employeeId, password);
            if (result.success) {
                this.userType = 'employee';
                this.employeeId = employeeId;
                this.currentUser = result.employee;
                return { success: true, employee: result.employee };
            }
            return { success: false, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            if (this.userType === 'master_admin') {
                await api.masterAdminLogout();
            } else if (this.userType === 'company_admin' && this.companyId) {
                await api.companyAdminLogout(this.companyId);
            } else if (this.userType === 'employee' && this.employeeId) {
                await api.employeeLogout(this.employeeId);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local state
            this.currentUser = null;
            this.userType = null;
            this.companyId = null;
            this.employeeId = null;
            
            // Redirect to home
            window.location.hash = '';
            window.location.reload();
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.userType !== null;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.userType === role;
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user type
    getUserType() {
        return this.userType;
    }

    // Get company ID
    getCompanyId() {
        return this.companyId;
    }

    // Get employee ID
    getEmployeeId() {
        return this.employeeId;
    }

    // Require authentication
    requireAuth(allowedRoles = []) {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(this.userType)) {
            showAlert('Access denied. Insufficient permissions.', 'error');
            return false;
        }

        return true;
    }

    // Redirect to appropriate login page
    redirectToLogin() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        if (path.includes('/master') || hash.includes('master')) {
            window.location.hash = '#master/login';
        } else if (path.includes('/company') || hash.includes('company')) {
            const companyId = this.extractCompanyIdFromUrl();
            if (companyId) {
                window.location.hash = `#company/${companyId}/login`;
            } else {
                window.location.hash = '';
            }
        } else if (path.includes('/training') || hash.includes('training')) {
            const companyId = this.extractCompanyIdFromUrl();
            if (companyId) {
                window.location.hash = `#training/${companyId}/login`;
            } else {
                window.location.hash = '';
            }
        } else {
            window.location.hash = '';
        }
    }

    // Auto-logout after inactivity
    setupAutoLogout(timeoutMinutes = 30) {
        let timeoutId;
        
        const resetTimeout = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                showAlert('Session expired due to inactivity. Please log in again.', 'warning');
                this.logout();
            }, timeoutMinutes * 60 * 1000);
        };

        // Reset timeout on user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetTimeout, true);
        });

        // Initial timeout
        resetTimeout();
    }
}

// Create global auth instance
const auth = new Auth();

