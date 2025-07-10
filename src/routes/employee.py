from flask import Blueprint, request, jsonify, session
from src.models.database import db, Employee, Company, TrainingModule, EmployeeProgress, EmployeeNotes
from src.utils.security import PasswordSecurity
from datetime import datetime
import json

employee_bp = Blueprint('employee', __name__)

def require_employee_auth(employee_id):
    """Check if employee is authenticated"""
    if 'employee_id' not in session or session['employee_id'] != employee_id:
        return False
    return True

@employee_bp.route('/test')
def test_employee():
    """Test route to verify employee blueprint is working"""
    return jsonify({'message': 'Employee blueprint is working'})

@employee_bp.route('/<int:employee_id>/login', methods=['POST'])
def employee_login(employee_id):
    """Employee login endpoint"""
    try:
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({'error': 'Password is required'}), 400
        
        # Find employee
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), employee.password.encode('utf-8')):
            return jsonify({'error': 'Invalid password'}), 401
        
        # Set session
        session['employee_id'] = employee_id
        session['employee_type'] = 'employee'
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'employee': employee.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@employee_bp.route('/<int:employee_id>/logout', methods=['POST'])
def employee_logout(employee_id):
    """Employee logout endpoint"""
    try:
        # Clear session
        session.pop('employee_id', None)
        session.pop('employee_type', None)
        
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        })
        
    except Exception as e:
        return jsonify({'error': 'Logout failed'}), 500

@employee_bp.route('/<int:employee_id>/profile', methods=['GET'])
def get_employee_profile(employee_id):
    """Get employee profile"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        return jsonify({
            'success': True,
            'employee': employee.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to get profile'}), 500

@employee_bp.route('/<int:employee_id>/progress', methods=['GET'])
def get_employee_progress(employee_id):
    """Get employee training progress"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        progress = EmployeeProgress.query.filter_by(employee_id=employee_id).all()
        
        return jsonify({
            'success': True,
            'progress': [p.to_dict() for p in progress]
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to get progress'}), 500

@employee_bp.route('/<int:employee_id>/progress/<int:module_id>', methods=['PUT'])
def update_employee_progress(employee_id, module_id):
    """Update employee progress for a specific module"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        
        # Find or create progress record
        progress = EmployeeProgress.query.filter_by(
            employee_id=employee_id, 
            module_id=module_id
        ).first()
        
        if not progress:
            progress = EmployeeProgress(
                employee_id=employee_id,
                module_id=module_id,
                progress=0,
                completed=False
            )
            db.session.add(progress)
        
        # Update progress
        if 'progress' in data:
            progress.progress = data['progress']
            if progress.progress >= 100:
                progress.is_completed = True
                progress.completed_at = datetime.utcnow()
        
        if 'completed' in data:
            progress.is_completed = data['completed']
            if progress.is_completed and not progress.completed_at:
                progress.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Progress updated successfully',
            'progress': progress.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update progress'}), 500

@employee_bp.route('/<int:employee_id>/notes/<int:module_id>', methods=['POST'])
def save_employee_notes(employee_id, module_id):
    """Save employee notes for a module"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        notes_content = data.get('notes', '')
        
        # Find or create notes record
        notes = EmployeeNotes.query.filter_by(
            employee_id=employee_id,
            module_id=module_id
        ).first()
        
        if not notes:
            notes = EmployeeNotes(
                employee_id=employee_id,
                module_id=module_id,
                notes=notes_content
            )
            db.session.add(notes)
        else:
            notes.notes = notes_content
            notes.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notes saved successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to save notes'}), 500

@employee_bp.route('/<int:employee_id>/notes/<int:module_id>', methods=['GET'])
def get_employee_notes(employee_id, module_id):
    """Get employee notes for a module"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        notes = EmployeeNotes.query.filter_by(
            employee_id=employee_id,
            module_id=module_id
        ).first()
        
        return jsonify({
            'success': True,
            'notes': notes.notes if notes else ''
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to get notes'}), 500

@employee_bp.route('/<int:employee_id>/modules', methods=['GET'])
def get_training_modules(employee_id):
    """Get all training modules for employee"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        modules = TrainingModule.query.all()
        
        return jsonify({
            'success': True,
            'modules': [module.to_dict() for module in modules]
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to get modules'}), 500

@employee_bp.route('/<int:employee_id>/modules/<int:module_id>', methods=['GET'])
def get_training_module(employee_id, module_id):
    """Get specific training module"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        module = TrainingModule.query.get(module_id)
        if not module:
            return jsonify({'error': 'Module not found'}), 404
        
        return jsonify({
            'success': True,
            'module': module.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to get module'}), 500

@employee_bp.route('/<int:employee_id>/quiz/<int:module_id>', methods=['POST'])
def submit_quiz(employee_id, module_id):
    """Submit quiz answers and calculate score"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        answers = data.get('answers', {})
        
        # Get module and quiz questions
        module = TrainingModule.query.get(module_id)
        if not module or not module.quiz_questions:
            return jsonify({'error': 'Quiz not found'}), 404
        
        quiz_questions = json.loads(module.quiz_questions)
        total_questions = len(quiz_questions)
        correct_answers = 0
        
        # Calculate score
        for question in quiz_questions:
            question_id = str(question['id'])
            if question_id in answers:
                if answers[question_id] == question['correct_answer']:
                    correct_answers += 1
        
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        passed = score >= 80  # 80% passing score
        
        # Update progress
        progress = EmployeeProgress.query.filter_by(
            employee_id=employee_id,
            module_id=module_id
        ).first()
        
        if not progress:
            progress = EmployeeProgress(
                employee_id=employee_id,
                module_id=module_id,
                progress=0,
                completed=False
            )
            db.session.add(progress)
        
        # Update quiz results
        progress.quiz_score = score
        progress.quiz_attempts = (progress.quiz_attempts or 0) + 1
        
        if passed:
            progress.is_completed = True
            progress.progress = 100
            progress.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'score': score,
            'passed': passed,
            'correct_answers': correct_answers,
            'total_questions': total_questions,
            'message': 'Quiz completed successfully' if passed else 'Quiz failed. Please try again.'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit quiz'}), 500

@employee_bp.route('/<int:employee_id>/certificates', methods=['GET'])
def get_certificates(employee_id):
    """Get employee certificates"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        # Get completed modules
        completed_progress = EmployeeProgress.query.filter_by(
            employee_id=employee_id,
            completed=True
        ).all()
        
        certificates = []
        for progress in completed_progress:
            module = TrainingModule.query.get(progress.module_id)
            if module:
                certificates.append({
                    'module_id': module.id,
                    'module_title': module.title,
                    'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
                    'score': progress.quiz_score,
                    'certificate_url': f'/api/employee/{employee_id}/certificate/{module.id}'
                })
        
        return jsonify({
            'success': True,
            'certificates': certificates
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to get certificates'}), 500

@employee_bp.route('/<int:employee_id>/certificate/<int:module_id>', methods=['GET'])
def download_certificate(employee_id, module_id):
    """Download certificate for completed module"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        # Check if module is completed
        progress = EmployeeProgress.query.filter_by(
            employee_id=employee_id,
            module_id=module_id,
            completed=True
        ).first()
        
        if not progress:
            return jsonify({'error': 'Module not completed'}), 404
        
        employee = Employee.query.get(employee_id)
        module = TrainingModule.query.get(module_id)
        
        if not employee or not module:
            return jsonify({'error': 'Employee or module not found'}), 404
        
        # Generate certificate (simplified - in real implementation, generate PDF)
        certificate_data = {
            'employee_name': employee.name,
            'module_title': module.title,
            'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
            'score': progress.quiz_score,
            'certificate_id': f'CERT-{employee_id}-{module_id}-{progress.completed_at.strftime("%Y%m%d") if progress.completed_at else "unknown"}'
        }
        
        return jsonify({
            'success': True,
            'certificate': certificate_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate certificate'}), 500

@employee_bp.route('/<int:employee_id>/dashboard', methods=['GET'])
def get_dashboard_data(employee_id):
    """Get employee dashboard data"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        # Get progress data
        progress = EmployeeProgress.query.filter_by(employee_id=employee_id).all()
        modules = TrainingModule.query.all()
        
        # Calculate statistics
        completed_modules = len([p for p in progress if p.is_completed])
        total_modules = len(modules)
        in_progress_modules = len([p for p in progress if not p.is_completed and p.progress > 0])
        
        # Get recent activity
        recent_progress = sorted(
            [p for p in progress if p.started_date],
            key=lambda x: x.started_date,
            reverse=True
        )[:5]
        
        dashboard_data = {
            'employee': employee.to_dict(),
            'statistics': {
                'completed_modules': completed_modules,
                'total_modules': total_modules,
                'in_progress_modules': in_progress_modules,
                'overall_progress': round((completed_modules / total_modules) * 100) if total_modules > 0 else 0
            },
            'recent_activity': [p.to_dict() for p in recent_progress],
            'modules': [m.to_dict() for m in modules],
            'progress': [p.to_dict() for p in progress]
        }
        
        return jsonify({
            'success': True,
            'dashboard': dashboard_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard data'}), 500

@employee_bp.route('/<int:employee_id>/progress/download', methods=['GET'])
def download_progress_report(employee_id):
    """Download employee progress report"""
    try:
        if not require_employee_auth(employee_id):
            return jsonify({'error': 'Authentication required'}), 401
        
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        progress = EmployeeProgress.query.filter_by(employee_id=employee_id).all()
        modules = TrainingModule.query.all()
        
        # Generate report data (simplified - in real implementation, generate PDF)
        report_data = {
            'employee': employee.to_dict(),
            'generated_at': datetime.utcnow().isoformat(),
            'progress_summary': {
                'total_modules': len(modules),
                'completed_modules': len([p for p in progress if p.is_completed]),
                'in_progress_modules': len([p for p in progress if not p.is_completed and p.progress > 0]),
                'average_score': sum([p.quiz_score for p in progress if p.quiz_score]) / len([p for p in progress if p.quiz_score]) if progress else 0
            },
            'detailed_progress': [p.to_dict() for p in progress]
        }
        
        return jsonify({
            'success': True,
            'report': report_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate report'}), 500

