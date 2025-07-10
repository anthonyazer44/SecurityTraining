// API handling for Starcomm Training System

class API {
    constructor() {
        this.baseURL = '';  // Relative URLs since frontend and backend are served together
    }

    // Generic request method
    async request(method, url, data = null, options = {}) {
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'same-origin',  // Include cookies for session management
            ...options
        };

        if (data && method !== 'GET') {
            if (data instanceof FormData) {
                // Remove Content-Type header for FormData (browser will set it with boundary)
                delete config.headers['Content-Type'];
                config.body = data;
            } else {
                config.body = JSON.stringify(data);
            }
        }

        try {
            const response = await fetch(this.baseURL + url, config);
            
            // Handle different response types
            const contentType = response.headers.get('content-type');
            let responseData;
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || `HTTP ${response.status}`);
            }

            return responseData;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // GET request
    async get(url, options = {}) {
        return this.request('GET', url, null, options);
    }

    // POST request
    async post(url, data, options = {}) {
        return this.request('POST', url, data, options);
    }

    // PUT request
    async put(url, data, options = {}) {
        return this.request('PUT', url, data, options);
    }

    // DELETE request
    async delete(url, options = {}) {
        return this.request('DELETE', url, null, options);
    }

    // Master Admin API methods
    async masterAdminLogin(username, password) {
        return this.post('/api/master/login', { username, password });
    }

    async masterAdminLogout() {
        return this.post('/api/master/logout');
    }

    async getMasterAdminDashboard() {
        return this.get('/api/master/dashboard');
    }

    async getCompanies(search = '', status = 'all') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status !== 'all') params.append('status', status);
        
        const url = '/api/master/companies' + (params.toString() ? '?' + params.toString() : '');
        return this.get(url);
    }

    async createCompany(companyData) {
        return this.post('/api/master/companies', companyData);
    }

    async updateCompany(companyId, companyData) {
        return this.put(`/api/master/companies/${companyId}`, companyData);
    }

    async deleteCompany(companyId) {
        return this.delete(`/api/master/companies/${companyId}`);
    }

    async bulkCompanyAction(companyIds, action) {
        return this.post('/api/master/companies/bulk-action', { company_ids: companyIds, action });
    }

    async getTrainingModules() {
        return this.get('/api/master/training-modules');
    }

    async getMasterAdminReports() {
        return this.get('/api/master/reports/overview');
    }

    async checkMasterAdminAuth() {
        return this.get('/api/master/check-auth');
    }

    // Company Admin API methods
    async companyAdminLogin(companyId, password) {
        return this.post(`/api/company/${companyId}/login`, { password });
    }

    async companyAdminLogout(companyId) {
        return this.post(`/api/company/${companyId}/logout`);
    }

    async getCompanyDashboard(companyId) {
        return this.get(`/api/company/${companyId}/dashboard`);
    }

    async getCompanyEmployees(companyId, search = '', department = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (department) params.append('department', department);
        
        const url = `/api/company/${companyId}/employees` + (params.toString() ? '?' + params.toString() : '');
        return this.get(url);
    }

    async createEmployee(companyId, employeeData) {
        return this.post(`/api/company/${companyId}/employees`, employeeData);
    }

    async updateEmployee(companyId, employeeId, employeeData) {
        return this.put(`/api/company/${companyId}/employees/${employeeId}`, employeeData);
    }

    async deleteEmployee(companyId, employeeId) {
        return this.delete(`/api/company/${companyId}/employees/${employeeId}`);
    }

    // Employee API endpoints
    async employeeLogin(employeeId, password) {
        return this.post(`/api/employee/${employeeId}/login`, { password });
    }

    async employeeLogout(employeeId) {
        return this.post(`/api/employee/${employeeId}/logout`, {});
    }

    async getEmployeeProfile(employeeId) {
        return this.get(`/api/employee/${employeeId}/profile`);
    }

    async getEmployeeProgress(employeeId) {
        return this.get(`/api/employee/${employeeId}/progress`);
    }

    async updateEmployeeProgress(employeeId, moduleId, progressData) {
        return this.put(`/api/employee/${employeeId}/progress/${moduleId}`, progressData);
    }

    async saveEmployeeNotes(employeeId, moduleId, notes) {
        return this.post(`/api/employee/${employeeId}/notes/${moduleId}`, { notes });
    }

    async getEmployeeNotes(employeeId, moduleId) {
        return this.get(`/api/employee/${employeeId}/notes/${moduleId}`);
    }

    async getTrainingModules() {
        return this.get('/api/training/modules');
    }

    async getTrainingModule(employeeId, moduleId) {
        return this.get(`/api/employee/${employeeId}/modules/${moduleId}`);
    }

    async submitQuiz(employeeId, moduleId, answers) {
        return this.post(`/api/employee/${employeeId}/quiz/${moduleId}`, { answers });
    }

    async getEmployeeCertificates(employeeId) {
        return this.get(`/api/employee/${employeeId}/certificates`);
    }

    async downloadCertificate(employeeId, moduleId) {
        return this.get(`/api/employee/${employeeId}/certificate/${moduleId}`);
    }

    async getEmployeeDashboard(employeeId) {
        return this.get(`/api/employee/${employeeId}/dashboard`);
    }

    async downloadEmployeeProgress(employeeId) {
        return this.get(`/api/employee/${employeeId}/progress/download`);
    }

    async bulkImportEmployees(companyId, csvFile) {
        const formData = new FormData();
        formData.append('file', csvFile);
        return this.post(`/api/company/${companyId}/employees/bulk-import`, formData);
    }

    async getCompanyTrainingModules(companyId) {
        return this.get(`/api/company/${companyId}/training-modules`);
    }

    async assignTraining(companyId, employeeIds, moduleIds) {
        return this.post(`/api/company/${companyId}/assign-training`, { 
            employee_ids: employeeIds, 
            module_ids: moduleIds 
        });
    }

    async getCompanyProgressReport(companyId) {
        return this.get(`/api/company/${companyId}/reports/progress`);
    }

    async checkCompanyAdminAuth(companyId) {
        return this.get(`/api/company/${companyId}/check-auth`);
    }

    // Employee API methods
    async employeeLogin(companyId, email, password) {
        return this.post(`/api/training/${companyId}/login`, { email, password });
    }

    async employeeLogout(companyId) {
        return this.post(`/api/training/${companyId}/logout`);
    }

    async getEmployeeDashboard(companyId) {
        return this.get(`/api/training/${companyId}/dashboard`);
    }

    async getTrainingModule(companyId, moduleId) {
        return this.get(`/api/training/${companyId}/module/${moduleId}`);
    }

    async startTrainingModule(companyId, moduleId) {
        return this.post(`/api/training/${companyId}/module/${moduleId}/start`);
    }

    async updateTrainingProgress(companyId, moduleId, progressData) {
        return this.post(`/api/training/${companyId}/module/${moduleId}/progress`, progressData);
    }

    async submitQuiz(companyId, moduleId, answers) {
        return this.post(`/api/training/${companyId}/module/${moduleId}/quiz`, { answers });
    }

    async getEmployeeProgress(companyId) {
        return this.get(`/api/training/${companyId}/progress`);
    }

    async getCertificate(companyId, moduleId) {
        return this.get(`/api/training/${companyId}/certificate/${moduleId}`);
    }

    async checkEmployeeAuth(companyId) {
        return this.get(`/api/training/${companyId}/check-auth`);
    }
}

// Create global API instance
const api = new API();

