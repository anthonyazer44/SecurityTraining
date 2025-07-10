from flask import Blueprint, request, jsonify, session
from src.models.database import db, Company, Employee, TrainingModule, EmployeeProgress, EmployeeNotes
from src.utils.security import SecurityValidator, RateLimiter, PasswordSecurity, AuditLogger
from src.utils.email_service import email_service
from datetime import datetime, timedelta
import secrets
import string

company_admin_bp = Blueprint('company_admin', __name__)

@company_admin_bp.route('/test', methods=['GET'])
def test_route():
    return jsonify({'message': 'Company admin blueprint is working!'})

def require_company_admin_auth(company_id):
    """Check if user is authenticated as company admin for the specific company"""
    if 'company_admin_id' not in session or session.get('company_id') != company_id:
        return False
    return True

@company_admin_bp.route('/<int:company_id>/login', methods=['POST'])
def company_admin_login(company_id):
    try:
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({'success': False, 'message': 'Password is required'}), 400
        
        # Get company
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'success': False, 'message': 'Company not found'}), 404
        
        if not company.is_active:
            return jsonify({'success': False, 'message': 'Company account is inactive'}), 403
        
        # Check password
        if not PasswordSecurity.verify_password(password, company.admin_password):
            return jsonify({'success': False, 'message': 'Invalid password'}), 401
        
        # Set session
        session['company_admin_id'] = company.id
        session['company_id'] = company.id
        session['user_type'] = 'company_admin'
        
        return jsonify({
            'success': True,
            'company': {
                'id': company.id,
                'name': company.name,
                'contact_email': company.contact_email,
                'industry': company.industry
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/logout', methods=['POST'])
def company_admin_logout(company_id):
    try:
        session.clear()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/check-auth', methods=['GET'])
def check_company_admin_auth(company_id):
    try:
        authenticated = require_company_admin_auth(company_id)
        return jsonify({'authenticated': authenticated})
    except Exception as e:
        return jsonify({'authenticated': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/dashboard', methods=['GET'])
def get_company_dashboard(company_id):
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'success': False, 'message': 'Company not found'}), 404
        
        # Get statistics
        total_employees = Employee.query.filter_by(company_id=company_id).count()
        
        # Get assigned modules count
        assigned_modules = db.session.query(EmployeeProgress.module_id).filter(
            EmployeeProgress.employee_id.in_(
                db.session.query(Employee.id).filter_by(company_id=company_id)
            )
        ).distinct().count()
        
        # Get completed trainings
        completed_trainings = EmployeeProgress.query.filter(
            EmployeeProgress.employee_id.in_(
                db.session.query(Employee.id).filter_by(company_id=company_id)
            ),
            EmployeeProgress.is_completed == True
        ).count()
        
        # Calculate completion rate
        total_progress_records = EmployeeProgress.query.filter(
            EmployeeProgress.employee_id.in_(
                db.session.query(Employee.id).filter_by(company_id=company_id)
            )
        ).count()
        
        completion_rate = 0
        if total_progress_records > 0:
            completion_rate = round((completed_trainings / total_progress_records) * 100, 1)
        
        # Get recent activity (last 10 activities)
        recent_activity = []
        recent_progress = EmployeeProgress.query.filter(
            EmployeeProgress.employee_id.in_(
                db.session.query(Employee.id).filter_by(company_id=company_id)
            )
        ).order_by(EmployeeProgress.started_date.desc()).limit(10).all()
        
        for progress in recent_progress:
            employee = Employee.query.get(progress.employee_id)
            module = TrainingModule.query.get(progress.module_id)
            if employee and module:
                if progress.is_completed:
                    description = f"{employee.name} completed {module.title}"
                    icon = "check-circle"
                else:
                    description = f"{employee.name} started {module.title}"
                    icon = "play-circle"
                
                recent_activity.append({
                    'description': description,
                    'timestamp': progress.started_date.isoformat() if progress.started_date else None,
                    'icon': icon
                })
        
        return jsonify({
            'success': True,
            'company': {
                'id': company.id,
                'name': company.name,
                'contact_email': company.contact_email,
                'industry': company.industry
            },
            'total_employees': total_employees,
            'assigned_modules': assigned_modules,
            'completed_trainings': completed_trainings,
            'completion_rate': completion_rate,
            'recent_activity': recent_activity
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/employees', methods=['GET'])
def get_company_employees(company_id):
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        search = request.args.get('search', '')
        department = request.args.get('department', '')
        
        query = Employee.query.filter_by(company_id=company_id)
        
        if search:
            query = query.filter(
                db.or_(
                    Employee.name.ilike(f'%{search}%'),
                    Employee.email.ilike(f'%{search}%')
                )
            )
        
        if department:
            query = query.filter(Employee.department == department)
        
        employees = query.all()
        
        # Calculate training progress for each employee
        employee_list = []
        for employee in employees:
            # Get employee's progress
            total_assigned = EmployeeProgress.query.filter_by(employee_id=employee.id).count()
            completed = EmployeeProgress.query.filter_by(employee_id=employee.id, is_completed=True).count()
            
            progress_percentage = 0
            if total_assigned > 0:
                progress_percentage = round((completed / total_assigned) * 100, 1)
            
            employee_list.append({
                'id': employee.id,
                'name': employee.name,
                'email': employee.email,
                'department': employee.department,
                'position': employee.position,
                'training_progress': progress_percentage,
                'created_date': employee.created_date.isoformat() if employee.created_date else None
            })
        
        return jsonify({
            'success': True,
            'employees': employee_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/employees', methods=['POST'])
def create_employee(company_id):
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Check if email already exists
        existing_employee = Employee.query.filter_by(email=data['email']).first()
        if existing_employee:
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Generate random password
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        
        # Create employee
        employee = Employee(
            company_id=company_id,
            name=data['name'],
            email=data['email'],
            department=data.get('department'),
            employee_id=data.get('employee_id'),
            password=PasswordSecurity.hash_password(password)
        )
        
        db.session.add(employee)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'employee': {
                'id': employee.id,
                'name': employee.name,
                'email': employee.email,
                'password': password  # Return password for admin to share
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/employees/<int:employee_id>', methods=['PUT'])
def update_employee(company_id, employee_id):
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        employee = Employee.query.filter_by(id=employee_id, company_id=company_id).first()
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            employee.name = data['name']
        if 'email' in data:
            # Check if email already exists (excluding current employee)
            existing = Employee.query.filter(Employee.email == data['email'], Employee.id != employee_id).first()
            if existing:
                return jsonify({'success': False, 'message': 'Email already exists'}), 400
            employee.email = data['email']
        if 'department' in data:
            employee.department = data['department']
        if 'position' in data:
            employee.position = data['position']
        
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(company_id, employee_id):
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        employee = Employee.query.filter_by(id=employee_id, company_id=company_id).first()
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Delete related progress records first
        EmployeeProgress.query.filter_by(employee_id=employee_id).delete()
        
        # Delete employee
        db.session.delete(employee)
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/employees/bulk-import', methods=['POST'])
def bulk_import_employees(company_id):
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'success': False, 'message': 'File must be a CSV'}), 400
        
        # Read CSV
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.DictReader(stream)
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_input, start=2):  # Start at 2 because row 1 is headers
            try:
                # Validate required fields
                if not all([row.get('name'), row.get('email')]):
                    errors.append(f"Row {row_num}: Missing required fields")
                    continue
                
                # Check if email already exists
                if Employee.query.filter_by(email=row['email']).first():
                    errors.append(f"Row {row_num}: Email {row['email']} already exists")
                    continue
                
                # Generate password
                password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
                
                # Create employee
                employee = Employee(
                    company_id=company_id,
                    name=row['name'],
                    email=row['email'],
                    department=row.get('department'),
                    employee_id=row.get('employee_id'),
                    password=PasswordSecurity.hash_password(password)
                )
                
                db.session.add(employee)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        if imported_count > 0:
            db.session.commit()
        
        return jsonify({
            'success': True,
            'imported_count': imported_count,
            'errors': errors
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/training-modules', methods=['GET'])
def get_company_training_modules(company_id):
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        modules = TrainingModule.query.all()
        
        module_list = []
        for module in modules:
            module_list.append({
                'id': module.id,
                'title': module.title,
                'description': module.description,
                'duration_minutes': module.duration_minutes,
                'difficulty_level': module.difficulty_level
            })
        
        return jsonify({
            'success': True,
            'modules': module_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/assign-training', methods=['POST'])
def assign_training(company_id):
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        data = request.get_json()
        employee_ids = data.get('employee_ids', [])
        module_ids = data.get('module_ids', [])
        
        if not employee_ids or not module_ids:
            return jsonify({'success': False, 'message': 'Employee IDs and Module IDs are required'}), 400
        
        # Verify employees belong to this company
        employees = Employee.query.filter(
            Employee.id.in_(employee_ids),
            Employee.company_id == company_id
        ).all()
        
        if len(employees) != len(employee_ids):
            return jsonify({'success': False, 'message': 'Some employees not found or not in this company'}), 400
        
        # Verify modules exist
        modules = TrainingModule.query.filter(TrainingModule.id.in_(module_ids)).all()
        if len(modules) != len(module_ids):
            return jsonify({'success': False, 'message': 'Some training modules not found'}), 400
        
        # Create progress records
        assignments_created = 0
        for employee_id in employee_ids:
            for module_id in module_ids:
                # Check if assignment already exists
                existing = EmployeeProgress.query.filter_by(
                    employee_id=employee_id,
                    module_id=module_id
                ).first()
                
                if not existing:
                    progress = EmployeeProgress(
                        employee_id=employee_id,
                        module_id=module_id,
                        progress_percentage=0,
                        completed=False,
                        assigned_date=datetime.utcnow()
                    )
                    db.session.add(progress)
                    assignments_created += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'assignments_created': assignments_created
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/reports/progress', methods=['GET'])
def get_company_progress_report(company_id):
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        # Get overall completion rate
        total_progress = EmployeeProgress.query.filter(
            EmployeeProgress.employee_id.in_(
                db.session.query(Employee.id).filter_by(company_id=company_id)
            )
        ).count()
        
        completed_progress = EmployeeProgress.query.filter(
            EmployeeProgress.employee_id.in_(
                db.session.query(Employee.id).filter_by(company_id=company_id)
            ),
            EmployeeProgress.is_completed == True
        ).count()
        
        overall_completion_rate = 0
        if total_progress > 0:
            overall_completion_rate = round((completed_progress / total_progress) * 100, 1)
        
        # Calculate average completion time (placeholder)
        average_completion_time = "2.5 hours"
        
        # Count top performers (employees with 100% completion)
        top_performers = db.session.query(Employee.id).filter(
            Employee.company_id == company_id,
            Employee.id.in_(
                db.session.query(EmployeeProgress.employee_id).filter(
                    EmployeeProgress.is_completed == True
                ).group_by(EmployeeProgress.employee_id).having(
                    db.func.count(EmployeeProgress.id) == db.session.query(
                        db.func.count(EmployeeProgress.id)
                    ).filter(EmployeeProgress.employee_id == Employee.id).scalar_subquery()
                )
            )
        ).count()
        
        # Get module progress
        module_progress = []
        modules = TrainingModule.query.all()
        
        for module in modules:
            assigned_count = EmployeeProgress.query.filter(
                EmployeeProgress.module_id == module.id,
                EmployeeProgress.employee_id.in_(
                    db.session.query(Employee.id).filter_by(company_id=company_id)
                )
            ).count()
            
            completed_count = EmployeeProgress.query.filter(
                EmployeeProgress.module_id == module.id,
                EmployeeProgress.employee_id.in_(
                    db.session.query(Employee.id).filter_by(company_id=company_id)
                ),
                EmployeeProgress.is_completed == True
            ).count()
            
            completion_rate = 0
            if assigned_count > 0:
                completion_rate = round((completed_count / assigned_count) * 100, 1)
            
            if assigned_count > 0:  # Only include modules that have been assigned
                module_progress.append({
                    'title': module.title,
                    'assigned_count': assigned_count,
                    'completed_count': completed_count,
                    'completion_rate': completion_rate
                })
        
        # Get employee progress
        employee_progress = []
        employees = Employee.query.filter_by(company_id=company_id).all()
        
        for employee in employees:
            assigned_modules = EmployeeProgress.query.filter_by(employee_id=employee.id).count()
            completed_modules = EmployeeProgress.query.filter_by(employee_id=employee.id, is_completed=True).count()
            
            completion_rate = 0
            if assigned_modules > 0:
                completion_rate = round((completed_modules / assigned_modules) * 100, 1)
            
            # Get last activity
            last_progress = EmployeeProgress.query.filter_by(employee_id=employee.id).order_by(
                EmployeeProgress.started_date.desc()
            ).first()
            
            last_activity = None
            if last_progress and last_progress.started_date:
                last_activity = last_progress.started_date.isoformat()
            
            if assigned_modules > 0:  # Only include employees with assigned training
                employee_progress.append({
                    'name': employee.name,
                    'assigned_modules': assigned_modules,
                    'completed_modules': completed_modules,
                    'completion_rate': completion_rate,
                    'last_activity': last_activity
                })
        
        return jsonify({
            'success': True,
            'overall_completion_rate': overall_completion_rate,
            'average_completion_time': average_completion_time,
            'top_performers': top_performers,
            'module_progress': module_progress,
            'employee_progress': employee_progress
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# Employee Password Management Routes

@company_admin_bp.route('/<int:company_id>/employees/<int:employee_id>/password', methods=['GET'])
def get_employee_password_info(company_id, employee_id):
    """Get employee password information (for company admin)"""
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        employee = Employee.query.filter_by(id=employee_id, company_id=company_id).first()
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        return jsonify({
            'success': True,
            'employee_id': employee.id,
            'employee_name': employee.name,
            'employee_email': employee.email,
            'has_password': bool(employee.password),
            'password_last_updated': employee.updated_at.isoformat() if employee.updated_at else None
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/employees/<int:employee_id>/password', methods=['PUT'])
def update_employee_password(company_id, employee_id):
    """Update/reset employee password"""
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        employee = Employee.query.filter_by(id=employee_id, company_id=company_id).first()
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        data = request.get_json()
        
        # Check if custom password provided or generate new one
        if data.get('password'):
            new_password = data['password']
            # Validate password strength
            if len(new_password) < 6:
                return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400
        else:
            # Generate secure password
            new_password = PasswordSecurity.generate_secure_password(length=8)
        
        # Hash the new password
        hashed_password = PasswordSecurity.hash_password(new_password)
        
        employee.password = hashed_password
        employee.updated_at = datetime.now()
        db.session.commit()
        
        # Log the password change
        AuditLogger.log_security_event(
            'EMPLOYEE_PASSWORD_RESET', 
            f'Employee {employee.name} password reset by company admin',
            request.remote_addr
        )
        
        return jsonify({
            'success': True,
            'message': 'Employee password updated successfully',
            'new_password': new_password,  # Return plain text for company admin
            'employee_id': employee.id,
            'employee_name': employee.name
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/employees/<int:employee_id>/password/generate', methods=['POST'])
def generate_employee_password(company_id, employee_id):
    """Generate a new secure password for employee"""
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        employee = Employee.query.filter_by(id=employee_id, company_id=company_id).first()
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Generate new secure password
        new_password = PasswordSecurity.generate_secure_password(length=8)
        hashed_password = PasswordSecurity.hash_password(new_password)
        
        employee.password = hashed_password
        employee.updated_at = datetime.now()
        db.session.commit()
        
        # Log the password generation
        AuditLogger.log_security_event(
            'EMPLOYEE_PASSWORD_GENERATED', 
            f'New password generated for employee {employee.name}',
            request.remote_addr
        )
        
        return jsonify({
            'success': True,
            'message': 'New password generated successfully',
            'new_password': new_password,
            'employee_id': employee.id,
            'employee_name': employee.name
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/employees/passwords/bulk-reset', methods=['POST'])
def bulk_reset_employee_passwords(company_id):
    """Reset passwords for multiple employees"""
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        data = request.get_json()
        employee_ids = data.get('employee_ids', [])
        
        if not employee_ids:
            return jsonify({'success': False, 'message': 'employee_ids are required'}), 400
        
        employees = Employee.query.filter(
            Employee.id.in_(employee_ids),
            Employee.company_id == company_id
        ).all()
        
        reset_results = []
        
        for employee in employees:
            # Generate new password for each employee
            new_password = PasswordSecurity.generate_secure_password(length=8)
            hashed_password = PasswordSecurity.hash_password(new_password)
            
            employee.password = hashed_password
            employee.updated_at = datetime.now()
            
            reset_results.append({
                'employee_id': employee.id,
                'employee_name': employee.name,
                'employee_email': employee.email,
                'new_password': new_password
            })
        
        db.session.commit()
        
        # Log bulk password reset
        AuditLogger.log_security_event(
            'BULK_EMPLOYEE_PASSWORD_RESET', 
            f'Bulk password reset for {len(employees)} employees in company {company_id}',
            request.remote_addr
        )
        
        return jsonify({
            'success': True,
            'message': f'Passwords reset for {len(employees)} employees',
            'reset_results': reset_results
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/employees/passwords/export', methods=['GET'])
def export_employee_passwords(company_id):
    """Export employee credentials for company admin"""
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        employees = Employee.query.filter_by(company_id=company_id).all()
        
        # Note: This only provides info about which employees have passwords
        # Actual passwords cannot be retrieved from hashed values
        employee_credentials = []
        for employee in employees:
            employee_credentials.append({
                'employee_id': employee.id,
                'name': employee.name,
                'email': employee.email,
                'department': employee.department,
                'has_password': bool(employee.password),
                'created_date': employee.created_date.isoformat() if employee.created_date else None,
                'last_updated': employee.updated_at.isoformat() if employee.updated_at else None
            })
        
        return jsonify({
            'success': True,
            'company_id': company_id,
            'total_employees': len(employees),
            'employees': employee_credentials,
            'export_date': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@company_admin_bp.route('/<int:company_id>/password-policy', methods=['GET'])
def get_company_password_policy(company_id):
    """Get password policy for the company"""
    try:
        if not require_company_admin_auth(company_id):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        return jsonify({
            'success': True,
            'policy': {
                'minimum_length': 6,
                'require_uppercase': False,
                'require_lowercase': True,
                'require_numbers': True,
                'require_special_chars': False,
                'password_expiry_days': 90,
                'password_history_count': 3
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

