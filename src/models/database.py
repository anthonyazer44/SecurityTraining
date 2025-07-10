from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    admin_password = db.Column(db.String(255), nullable=False)  # hashed
    contact_email = db.Column(db.String(120), nullable=False)
    industry = db.Column(db.String(100))
    employee_count = db.Column(db.Integer)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationship
    employees = db.relationship('Employee', backref='company', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Company {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'contact_email': self.contact_email,
            'industry': self.industry,
            'employee_count': self.employee_count,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'is_active': self.is_active
        }

class Employee(db.Model):
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    password = db.Column(db.String(255), nullable=False)  # hashed
    department = db.Column(db.String(100))
    employee_id = db.Column(db.String(50))  # company-specific ID
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationship
    progress = db.relationship('EmployeeProgress', backref='employee', lazy=True, cascade='all, delete-orphan')
    
    # Unique constraint for email per company
    __table_args__ = (db.UniqueConstraint('company_id', 'email', name='unique_company_email'),)
    
    def __repr__(self):
        return f'<Employee {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'name': self.name,
            'email': self.email,
            'department': self.department,
            'employee_id': self.employee_id,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active
        }

class TrainingModule(db.Model):
    __tablename__ = 'training_modules'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    video_url = db.Column(db.String(500))
    duration_minutes = db.Column(db.Integer)
    difficulty_level = db.Column(db.String(20))  # Beginner/Intermediate/Advanced
    category = db.Column(db.String(100))  # Phishing/Passwords/Social Engineering/etc
    quiz_questions = db.Column(db.Text)  # JSON string
    passing_score = db.Column(db.Integer, default=70)
    is_active = db.Column(db.Boolean, default=True)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    progress = db.relationship('EmployeeProgress', backref='module', lazy=True)
    
    def __repr__(self):
        return f'<TrainingModule {self.title}>'
    
    def get_quiz_questions(self):
        """Parse quiz questions from JSON string"""
        if self.quiz_questions:
            try:
                return json.loads(self.quiz_questions)
            except json.JSONDecodeError:
                return []
        return []
    
    def set_quiz_questions(self, questions):
        """Set quiz questions as JSON string"""
        self.quiz_questions = json.dumps(questions)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'video_url': self.video_url,
            'duration_minutes': self.duration_minutes,
            'difficulty_level': self.difficulty_level,
            'category': self.category,
            'quiz_questions': self.get_quiz_questions(),
            'passing_score': self.passing_score,
            'is_active': self.is_active,
            'created_date': self.created_date.isoformat() if self.created_date else None
        }

class EmployeeProgress(db.Model):
    __tablename__ = 'employee_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('training_modules.id'), nullable=False)
    started_date = db.Column(db.DateTime, default=datetime.utcnow)
    completed_date = db.Column(db.DateTime)
    score = db.Column(db.Integer)
    attempts = db.Column(db.Integer, default=0)
    time_spent_minutes = db.Column(db.Integer, default=0)
    is_completed = db.Column(db.Boolean, default=False)
    last_position = db.Column(db.Integer, default=0)  # For resume functionality
    notes = db.Column(db.Text)  # For note-taking capability
    
    # Unique constraint for employee-module combination
    __table_args__ = (db.UniqueConstraint('employee_id', 'module_id', name='unique_employee_module'),)
    
    def __repr__(self):
        return f'<EmployeeProgress Employee:{self.employee_id} Module:{self.module_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'module_id': self.module_id,
            'started_date': self.started_date.isoformat() if self.started_date else None,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'score': self.score,
            'attempts': self.attempts,
            'time_spent_minutes': self.time_spent_minutes,
            'is_completed': self.is_completed,
            'last_position': self.last_position,
            'notes': self.notes
        }

# Employee Notes Model
class EmployeeNotes(db.Model):
    __tablename__ = 'employee_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('training_modules.id'), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<EmployeeNotes {self.employee_id}-{self.module_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'module_id': self.module_id,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Master Admin credentials (for simplicity, stored as constants)
MASTER_ADMIN_USERNAME = "admin"
MASTER_ADMIN_PASSWORD = "admin123"  # This should be hashed in production

