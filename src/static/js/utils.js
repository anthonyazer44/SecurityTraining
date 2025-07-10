// Utility functions for the Starcomm Training System

// Show/hide loading spinner
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// Show alert messages
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fade-in`;
    alertDiv.textContent = message;
    
    // Insert at the top of content
    const content = document.getElementById('content');
    content.insertBefore(alertDiv, content.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Format date for display (date only)
function formatDateOnly(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Calculate percentage
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Generate secure password
function generatePassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Create modal
function createModal(title, content, actions = []) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal fade-in';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h3 class="modal-title">${escapeHtml(title)}</h3>
        <button class="modal-close" onclick="closeModal(this)">&times;</button>
    `;
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = content;
    
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    actions.forEach(action => {
        const button = document.createElement('button');
        button.className = `btn ${action.class || 'btn-secondary'}`;
        button.textContent = action.text;
        button.onclick = action.onclick;
        modalFooter.appendChild(button);
    });
    
    modal.appendChild(modalHeader);
    modal.appendChild(modalBody);
    if (actions.length > 0) {
        modal.appendChild(modalFooter);
    }
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // Close modal when clicking overlay
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal(modalOverlay);
        }
    });
    
    return modalOverlay;
}

// Close modal
function closeModal(element) {
    const modal = element.closest('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Confirm dialog
function confirmDialog(message, onConfirm, onCancel = null) {
    const modal = createModal('Confirm Action', `<p>${escapeHtml(message)}</p>`, [
        {
            text: 'Cancel',
            class: 'btn-secondary',
            onclick: () => {
                closeModal(modal);
                if (onCancel) onCancel();
            }
        },
        {
            text: 'Confirm',
            class: 'btn-primary',
            onclick: () => {
                closeModal(modal);
                onConfirm();
            }
        }
    ]);
}

// Create table from data
function createTable(headers, data, actions = []) {
    let tableHtml = '<div class="table-container"><table class="table">';
    
    // Headers
    tableHtml += '<thead><tr>';
    headers.forEach(header => {
        tableHtml += `<th>${escapeHtml(header)}</th>`;
    });
    if (actions.length > 0) {
        tableHtml += '<th>Actions</th>';
    }
    tableHtml += '</tr></thead>';
    
    // Body
    tableHtml += '<tbody>';
    data.forEach((row, index) => {
        tableHtml += '<tr>';
        headers.forEach(header => {
            const value = row[header.toLowerCase().replace(/\s+/g, '_')] || '';
            tableHtml += `<td>${escapeHtml(String(value))}</td>`;
        });
        
        if (actions.length > 0) {
            tableHtml += '<td>';
            actions.forEach(action => {
                tableHtml += `<button class="btn btn-sm ${action.class}" onclick="${action.onclick}(${row.id || index})">${action.text}</button> `;
            });
            tableHtml += '</td>';
        }
        
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    
    return tableHtml;
}

// Create progress bar
function createProgressBar(percentage, label = '') {
    return `
        <div class="progress">
            <div class="progress-bar" style="width: ${percentage}%">
                ${label || percentage + '%'}
            </div>
        </div>
    `;
}

// Create badge
function createBadge(text, type = 'info') {
    return `<span class="badge badge-${type}">${escapeHtml(text)}</span>`;
}

// Parse CSV content
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return { headers, data };
}

// Download data as CSV
function downloadCSV(data, filename) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                ? `"${value.replace(/"/g, '""')}"` 
                : value;
        });
        csvContent += values.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showAlert('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert('Copied to clipboard!', 'success');
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// Set URL parameters
function setUrlParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url);
}

