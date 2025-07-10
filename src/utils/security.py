"""
Security utilities for Starcomm Training System
"""

import hashlib
import time
import re
import logging
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecurityValidator:
    """Input validation and sanitization"""
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password(password):
        """Validate password strength"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        if not re.search(r'\d', password):
            return False, "Password must contain at least one number"
        return True, "Password is valid"
    
    @staticmethod
    def sanitize_input(text):
        """Sanitize user input"""
        if not text:
            return ""
        # Remove potentially dangerous characters
        text = re.sub(r'[<>"\']', '', str(text))
        return text.strip()
    
    @staticmethod
    def validate_company_name(name):
        """Validate company name"""
        if not name or len(name.strip()) < 2:
            return False, "Company name must be at least 2 characters"
        if len(name) > 100:
            return False, "Company name must be less than 100 characters"
        return True, "Valid company name"

class RateLimiter:
    """Rate limiting for API endpoints"""
    
    def __init__(self):
        self.attempts = {}
        self.blocked_ips = {}
    
    def is_rate_limited(self, ip_address, max_attempts=5, window_minutes=15):
        """Check if IP is rate limited"""
        current_time = datetime.now()
        
        # Clean old attempts
        if ip_address in self.attempts:
            self.attempts[ip_address] = [
                attempt for attempt in self.attempts[ip_address]
                if current_time - attempt < timedelta(minutes=window_minutes)
            ]
        
        # Check if blocked
        if ip_address in self.blocked_ips:
            if current_time - self.blocked_ips[ip_address] < timedelta(minutes=window_minutes):
                return True
            else:
                del self.blocked_ips[ip_address]
        
        # Check attempts
        attempts_count = len(self.attempts.get(ip_address, []))
        if attempts_count >= max_attempts:
            self.blocked_ips[ip_address] = current_time
            return True
        
        return False
    
    def record_attempt(self, ip_address):
        """Record a failed attempt"""
        if ip_address not in self.attempts:
            self.attempts[ip_address] = []
        self.attempts[ip_address].append(datetime.now())

class PasswordSecurity:
    """Password hashing and verification using hashlib"""
    
    @staticmethod
    def hash_password(password):
        """Hash password using SHA-256 with salt"""
        salt = "starcomm_training_salt_2024"  # In production, use random salt per password
        return hashlib.sha256((password + salt).encode()).hexdigest()
    
    @staticmethod
    def verify_password(password, hashed):
        """Verify password against hash"""
        return PasswordSecurity.hash_password(password) == hashed
    
    @staticmethod
    def generate_secure_password(length=12):
        """Generate a secure random password"""
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))

class AuditLogger:
    """Security event logging"""
    
    @staticmethod
    def log_login_attempt(user_type, username, success, ip_address):
        """Log login attempt"""
        status = "SUCCESS" if success else "FAILED"
        logger.info(f"LOGIN_{status}: {user_type} - {username} from {ip_address}")
    
    @staticmethod
    def log_security_event(event_type, details, ip_address):
        """Log security event"""
        logger.warning(f"SECURITY_EVENT: {event_type} - {details} from {ip_address}")
    
    @staticmethod
    def log_admin_action(admin_user, action, details, ip_address):
        """Log admin action"""
        logger.info(f"ADMIN_ACTION: {admin_user} - {action} - {details} from {ip_address}")

# Global rate limiter instance
rate_limiter = RateLimiter()

def require_auth(user_type):
    """Decorator to require authentication"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if user_type not in session:
                return jsonify({'error': 'Authentication required'}), 401
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def rate_limit(max_attempts=5, window_minutes=15):
    """Decorator for rate limiting"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ip_address = request.remote_addr
            if rate_limiter.is_rate_limited(ip_address, max_attempts, window_minutes):
                AuditLogger.log_security_event('RATE_LIMIT_EXCEEDED', f'Function: {f.__name__}', ip_address)
                return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429
            return f(*args, **kwargs)
        return decorated_function
    return decorator



def apply_security_headers(app):
    """Apply security headers to Flask app"""
    @app.after_request
    def add_security_headers(response):
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # Enable XSS protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        # Enforce HTTPS (in production)
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        # Content Security Policy
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        return response
    return app

