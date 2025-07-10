// Main application initialization for Starcomm Training System

class App {
    constructor() {
        this.initialized = false;
    }

    // Initialize the application
    async init() {
        if (this.initialized) return;

        try {
            // Show loading initially
            showLoading();

            // Check authentication status
            await auth.checkAuth();

            // Set up auto-logout (30 minutes of inactivity)
            auth.setupAutoLogout(30);

            // Initialize router
            // Router is already initialized in router.js

            // Hide loading
            hideLoading();

            this.initialized = true;

            console.log('Starcomm Training System initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            hideLoading();
            showAlert('Failed to initialize application. Please refresh the page.', 'error');
        }
    }

    // Handle global errors
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            showAlert('An unexpected error occurred. Please refresh the page.', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            showAlert('An unexpected error occurred. Please refresh the page.', 'error');
        });
    }

    // Handle network status
    setupNetworkHandling() {
        window.addEventListener('online', () => {
            showAlert('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            showAlert('Connection lost. Some features may not work.', 'warning');
        });
    }

    // Set up keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + K for search (if on a page with search)
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    event.preventDefault();
                    searchInput.focus();
                }
            }

            // Escape to close modals
            if (event.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    closeModal(modal);
                }
            }
        });
    }

    // Set up responsive behavior
    setupResponsive() {
        // Handle mobile menu toggle if needed
        const handleResize = () => {
            // Add any responsive behavior here
            if (window.innerWidth < 768) {
                document.body.classList.add('mobile');
            } else {
                document.body.classList.remove('mobile');
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call
    }

    // Set up accessibility features
    setupAccessibility() {
        // Focus management for modals
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal-overlay')) {
                const modal = event.target.querySelector('.modal');
                if (modal) {
                    const firstFocusable = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                }
            }
        });

        // Skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 10000;
        `;
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Performance monitoring
    setupPerformanceMonitoring() {
        // Monitor page load time
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`Page loaded in ${Math.round(loadTime)}ms`);
            
            // Log slow loads
            if (loadTime > 3000) {
                console.warn('Slow page load detected:', loadTime);
            }
        });

        // Monitor API response times
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const start = performance.now();
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - start;
                
                if (duration > 2000) {
                    console.warn(`Slow API request: ${args[0]} took ${Math.round(duration)}ms`);
                }
                
                return response;
            } catch (error) {
                const duration = performance.now() - start;
                console.error(`API request failed: ${args[0]} after ${Math.round(duration)}ms`, error);
                throw error;
            }
        };
    }

    // Set up development helpers
    setupDevelopmentHelpers() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Add development helpers
            window.app = this;
            window.auth = auth;
            window.api = api;
            window.router = router;
            window.masterAdmin = masterAdmin;
            window.companyAdmin = companyAdmin;
            window.employee = employee;

            console.log('Development mode: Global objects available in console');
        }
    }
}

// Create global app instance
const app = new App();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Set up all features
    app.setupErrorHandling();
    app.setupNetworkHandling();
    app.setupKeyboardShortcuts();
    app.setupResponsive();
    app.setupAccessibility();
    app.setupPerformanceMonitoring();
    app.setupDevelopmentHelpers();

    // Initialize the main application
    await app.init();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
        // Optionally refresh data when page becomes visible
    }
});

// Service worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker will be added in future phases
        console.log('Service worker support detected');
    });
}

