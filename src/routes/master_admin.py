from flask import Blueprint, request, jsonify, session
from src.models.database import db, Company, Employee, TrainingModule, EmployeeProgress
from src.utils.security import SecurityValidator, RateLimiter, PasswordSecurity, AuditLogger, rate_limit
from src.utils.email_service import email_service
import string
import secrets
from datetime import datetime

# Master Admin Credentials
MASTER_ADMIN_USERNAME = "admin"
MASTER_ADMIN_PASSWORD = "admin123"

master_admin_bp = Blueprint('master_admin', __name__)

def generate_secure_password(length=12):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for i in range(length))
    return password

def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    """Check if password matches the hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def require_master_admin_auth():
    """Check if user is authenticated as master admin"""
    return session.get('master_admin_authenticated') == True
@master_admin_bp.route('/login', methods=['POST'])
@rate_limit(max_attempts=5, window_minutes=5)
def master_admin_login():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        # Input validation
        if not username or not password:
            AuditLogger.log_login_attempt('master_admin', username, False, request.remote_addr)
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Validate credentials
        if username == MASTER_ADMIN_USERNAME and password == MASTER_ADMIN_PASSWORD:
            session['master_admin_authenticated'] = True
            session['user_type'] = 'master_admin'
            session['username'] = username
            session['last_activity'] = datetime.now().timestamp()
            
            AuditLogger.log_login_attempt('master_admin', username, True, request.remote_addr)
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user_type': 'master_admin'
            })
        else:
            AuditLogger.log_login_attempt('master_admin', username, False, request.remote_addr)
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        AuditLogger.log_security_event('LOGIN_ERROR', str(e), request.remote_addr)
        return jsonify({'error': 'Login failed'}), 500

@master_admin_bp.route('/logout', methods=['POST'])
def master_admin_logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@master_admin_bp.route('/dashboard', methods=['GET'])
def dashboard():
    """Get dashboard statistics"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    total_companies = Company.query.count()
    active_companies = Company.query.filter_by(is_active=True).count()
    total_employees = Employee.query.count()
    active_modules = TrainingModule.query.filter_by(is_active=True).count()
    
    return jsonify({
        'total_companies': total_companies,
        'active_companies': active_companies,
        'total_employees': total_employees,
        'active_modules': active_modules
    })

@master_admin_bp.route('/companies', methods=['GET'])
def get_companies():
    """Get list of all companies with search and filter"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    search = request.args.get('search', '')
    status = request.args.get('status', 'all')  # all, active, inactive
    
    query = Company.query
    
    if search:
        query = query.filter(Company.name.contains(search))
    
    if status == 'active':
        query = query.filter_by(is_active=True)
    elif status == 'inactive':
        query = query.filter_by(is_active=False)
    
    companies = query.all()
    
    companies_data = []
    for company in companies:
        company_dict = company.to_dict()
        # Add employee count for this company
        company_dict['actual_employee_count'] = Employee.query.filter_by(company_id=company.id).count()
        companies_data.append(company_dict)
    
    return jsonify({'companies': companies_data})

@master_admin_bp.route('/companies', methods=['POST'])
def create_company():
    """Create a new company"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'contact_email', 'industry']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Generate secure admin password
    admin_password = PasswordSecurity.generate_secure_password()
    
    # Hash the admin password
    hashed_password = PasswordSecurity.hash_password(admin_password)
    
    # Create new company
    company = Company(
        name=data['name'],
        admin_password=hashed_password,
        contact_email=data['contact_email'],
        industry=data['industry'],
        employee_count=data.get('employee_count', 0)
    )
    
    try:
        db.session.add(company)
        db.session.commit()
        
        # Return company data with plain text password for email
        company_dict = company.to_dict()
        company_dict['admin_password_plain'] = admin_password
        
        return jsonify({
            'success': True,
            'message': 'Company created successfully',
            'company': company_dict
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create company'}), 500

@master_admin_bp.route('/companies/<int:company_id>', methods=['PUT'])
def update_company(company_id):
    """Update company information"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    company = Company.query.get_or_404(company_id)
    data = request.get_json()
    
    # Update fields
    if 'name' in data:
        company.name = data['name']
    if 'contact_email' in data:
        company.contact_email = data['contact_email']
    if 'industry' in data:
        company.industry = data['industry']
    if 'employee_count' in data:
        company.employee_count = data['employee_count']
    if 'is_active' in data:
        company.is_active = data['is_active']
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Company updated successfully',
            'company': company.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update company'}), 500

@master_admin_bp.route('/companies/<int:company_id>', methods=['DELETE'])
def delete_company(company_id):
    """Delete a company (soft delete by setting inactive)"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    company = Company.query.get_or_404(company_id)
    company.is_active = False
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Company deactivated successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to deactivate company'}), 500

@master_admin_bp.route('/companies/bulk-action', methods=['POST'])
def bulk_company_action():
    """Perform bulk actions on companies"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    company_ids = data.get('company_ids', [])
    action = data.get('action')  # 'activate' or 'deactivate'
    
    if not company_ids or not action:
        return jsonify({'error': 'company_ids and action are required'}), 400
    
    companies = Company.query.filter(Company.id.in_(company_ids)).all()
    
    for company in companies:
        if action == 'activate':
            company.is_active = True
        elif action == 'deactivate':
            company.is_active = False
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Bulk {action} completed successfully',
            'affected_count': len(companies)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to perform bulk {action}'}), 500

@master_admin_bp.route('/training-modules', methods=['GET'])
def get_training_modules():
    """Get list of all training modules"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    modules = TrainingModule.query.all()
    return jsonify({'modules': [module.to_dict() for module in modules]})

@master_admin_bp.route('/reports/overview', methods=['GET'])
def get_overview_report():
    """Get overview report with key metrics"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    # Calculate completion rates
    total_progress = EmployeeProgress.query.count()
    completed_progress = EmployeeProgress.query.filter_by(is_completed=True).count()
    completion_rate = (completed_progress / total_progress * 100) if total_progress > 0 else 0
    
    # Get module completion stats
    module_stats = []
    modules = TrainingModule.query.filter_by(is_active=True).all()
    for module in modules:
        total_attempts = EmployeeProgress.query.filter_by(module_id=module.id).count()
        completed_attempts = EmployeeProgress.query.filter_by(module_id=module.id, is_completed=True).count()
        module_completion_rate = (completed_attempts / total_attempts * 100) if total_attempts > 0 else 0
        
        module_stats.append({
            'module_name': module.title,
            'total_attempts': total_attempts,
            'completed_attempts': completed_attempts,
            'completion_rate': round(module_completion_rate, 2)
        })
    
    return jsonify({
        'overall_completion_rate': round(completion_rate, 2),
        'total_progress_records': total_progress,
        'completed_records': completed_progress,
        'module_stats': module_stats
    })

@master_admin_bp.route('/check-auth', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    return jsonify({
        'authenticated': require_master_admin_auth(),
        'user_type': session.get('user_type')
    })


# Password Management Routes

@master_admin_bp.route('/companies/<int:company_id>/password', methods=['GET'])
def get_company_password(company_id):
    """Get company admin password (for master admin only)"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    company = Company.query.get_or_404(company_id)
    
    # For security, we don't return the actual hashed password
    # Instead, we provide a way to reset it
    return jsonify({
        'company_id': company.id,
        'company_name': company.name,
        'has_password': bool(company.admin_password),
        'password_last_updated': company.updated_at.isoformat() if company.updated_at else None
    })

@master_admin_bp.route('/companies/<int:company_id>/password', methods=['PUT'])
def update_company_password(company_id):
    """Update/reset company admin password"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    company = Company.query.get_or_404(company_id)
    data = request.get_json()
    
    # Check if custom password provided or generate new one
    if data.get('password'):
        new_password = data['password']
        # Validate password strength
        if len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
    else:
        # Generate secure password
        new_password = PasswordSecurity.generate_secure_password()
    
    # Hash the new password
    hashed_password = PasswordSecurity.hash_password(new_password)
    
    try:
        company.admin_password = hashed_password
        company.updated_at = datetime.now()
        db.session.commit()
        
        # Log the password change
        AuditLogger.log_security_event(
            'PASSWORD_RESET', 
            f'Company {company.name} password reset by master admin',
            request.remote_addr
        )
        
        return jsonify({
            'success': True,
            'message': 'Company password updated successfully',
            'new_password': new_password,  # Return plain text for master admin
            'company_id': company.id,
            'company_name': company.name
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update password'}), 500

@master_admin_bp.route('/companies/<int:company_id>/password/generate', methods=['POST'])
def generate_company_password(company_id):
    """Generate a new secure password for company"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    company = Company.query.get_or_404(company_id)
    
    # Generate new secure password
    new_password = PasswordSecurity.generate_secure_password()
    hashed_password = PasswordSecurity.hash_password(new_password)
    
    try:
        company.admin_password = hashed_password
        company.updated_at = datetime.now()
        db.session.commit()
        
        # Log the password generation
        AuditLogger.log_security_event(
            'PASSWORD_GENERATED', 
            f'New password generated for company {company.name}',
            request.remote_addr
        )
        
        return jsonify({
            'success': True,
            'message': 'New password generated successfully',
            'new_password': new_password,
            'company_id': company.id,
            'company_name': company.name
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to generate password'}), 500

@master_admin_bp.route('/companies/passwords/bulk-reset', methods=['POST'])
def bulk_reset_company_passwords():
    """Reset passwords for multiple companies"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    company_ids = data.get('company_ids', [])
    
    if not company_ids:
        return jsonify({'error': 'company_ids are required'}), 400
    
    companies = Company.query.filter(Company.id.in_(company_ids)).all()
    reset_results = []
    
    try:
        for company in companies:
            # Generate new password for each company
            new_password = PasswordSecurity.generate_secure_password()
            hashed_password = PasswordSecurity.hash_password(new_password)
            
            company.admin_password = hashed_password
            company.updated_at = datetime.now()
            
            reset_results.append({
                'company_id': company.id,
                'company_name': company.name,
                'new_password': new_password
            })
        
        db.session.commit()
        
        # Log bulk password reset
        AuditLogger.log_security_event(
            'BULK_PASSWORD_RESET', 
            f'Bulk password reset for {len(companies)} companies',
            request.remote_addr
        )
        
        return jsonify({
            'success': True,
            'message': f'Passwords reset for {len(companies)} companies',
            'reset_results': reset_results
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to reset passwords'}), 500

@master_admin_bp.route('/password-policy', methods=['GET'])
def get_password_policy():
    """Get current password policy settings"""
    if not require_master_admin_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    return jsonify({
        'minimum_length': 8,
        'require_uppercase': True,
        'require_lowercase': True,
        'require_numbers': True,
        'require_special_chars': True,
        'password_expiry_days': 90,
        'password_history_count': 5
    })

