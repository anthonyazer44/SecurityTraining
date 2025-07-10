#!/usr/bin/env python3
"""
Database initialization script for Render deployment
This script initializes the PostgreSQL database with default data
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from src.models.database import db, TrainingModule, Company, Employee, EmployeeProgress, EmployeeNotes
from src.utils.security import PasswordSecurity
from flask import Flask
import json
import string
import secrets

def create_default_training_modules():
    """Create the 5 default training modules as specified in the roadmap"""
    
    # 1. Phishing Awareness (20 minutes)
    phishing_questions = [
        {
            "question": "What is the most common sign of a phishing email?",
            "type": "multiple_choice",
            "options": [
                "Urgent language demanding immediate action",
                "Professional company logo",
                "Correct spelling and grammar",
                "Familiar sender address"
            ],
            "correct_answer": 0,
            "explanation": "Phishing emails often use urgent language to pressure recipients into acting quickly without thinking."
        },
        {
            "question": "You should always click on links in emails from unknown senders.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Never click on links from unknown senders as they may lead to malicious websites."
        },
        {
            "question": "What should you do if you receive a suspicious email?",
            "type": "multiple_choice",
            "options": [
                "Delete it immediately",
                "Forward it to colleagues",
                "Report it to IT security",
                "Reply asking for verification"
            ],
            "correct_answer": 2,
            "explanation": "Always report suspicious emails to your IT security team for proper handling."
        },
        {
            "question": "Phishing attacks can only happen through email.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Phishing can occur through various channels including SMS, social media, and phone calls."
        },
        {
            "question": "What is spear phishing?",
            "type": "multiple_choice",
            "options": [
                "Phishing using fishing terminology",
                "Targeted phishing aimed at specific individuals",
                "Phishing through social media only",
                "Automated mass phishing campaigns"
            ],
            "correct_answer": 1,
            "explanation": "Spear phishing is a targeted attack aimed at specific individuals or organizations."
        }
    ]
    
    phishing_module = TrainingModule(
        title="Phishing Awareness",
        description="Learn to identify and avoid phishing attacks through email and social media scams.",
        video_url="/static/videos/phishing-awareness.mp4",
        duration_minutes=20,
        difficulty_level="Beginner",
        category="Phishing",
        quiz_questions=json.dumps(phishing_questions),
        passing_score=70
    )
    
    # 2. Password Security (15 minutes)
    password_questions = [
        {
            "question": "What makes a strong password?",
            "type": "multiple_choice",
            "options": [
                "At least 8 characters with mixed case, numbers, and symbols",
                "Your birthday and name",
                "A common dictionary word",
                "The same password for all accounts"
            ],
            "correct_answer": 0,
            "explanation": "Strong passwords should be long and include a mix of character types."
        },
        {
            "question": "You should use the same password for all your accounts.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Using unique passwords for each account prevents a single breach from compromising all accounts."
        },
        {
            "question": "What is two-factor authentication (2FA)?",
            "type": "multiple_choice",
            "options": [
                "Using two different passwords",
                "An additional security layer beyond just a password",
                "Logging in twice",
                "Having two user accounts"
            ],
            "correct_answer": 1,
            "explanation": "2FA adds an extra layer of security by requiring a second form of verification."
        }
    ]
    
    password_module = TrainingModule(
        title="Password Security",
        description="Learn best practices for creating strong passwords and using password managers effectively.",
        video_url="/static/videos/password-security.mp4",
        duration_minutes=15,
        difficulty_level="Beginner",
        category="Passwords",
        quiz_questions=json.dumps(password_questions),
        passing_score=70
    )
    
    # Add modules to the database
    modules = [phishing_module, password_module]
    
    for module in modules:
        db.session.add(module)
    
    db.session.commit()
    print("Default training modules created successfully!")

def create_default_companies():
    """Create default test companies for testing purposes"""
    companies_data = [
        {
            "name": "TechCorp Solutions",
            "contact_email": "admin@techcorp.com",
            "industry": "Technology",
            "employee_count": 150
        },
        {
            "name": "Healthcare Plus",
            "contact_email": "admin@healthcareplus.com", 
            "industry": "Healthcare",
            "employee_count": 75
        }
    ]
    
    created_companies = []
    
    for company_data in companies_data:
        # Generate a random password for the company
        alphabet = string.ascii_letters + string.digits
        password = ''.join(secrets.choice(alphabet) for i in range(12))
        
        # Hash the password
        hashed_password = PasswordSecurity.hash_password(password)
        
        # Create the company
        company = Company(
            name=company_data["name"],
            admin_password=hashed_password,
            contact_email=company_data["contact_email"],
            industry=company_data["industry"],
            employee_count=company_data["employee_count"],
            is_active=True
        )
        
        db.session.add(company)
        db.session.flush()  # Get the ID
        
        created_companies.append({
            "id": company.id,
            "name": company.name,
            "password": password
        })
    
    db.session.commit()
    
    print("Default companies created successfully!")
    for company in created_companies:
        print(f"Company ID: {company['id']}, Name: {company['name']}, Password: {company['password']}")
    
    return created_companies

def init_render_database():
    """Initialize the database for Render deployment"""
    app = Flask(__name__)
    
    # Use DATABASE_URL from environment (Render provides this)
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable not found!")
        print("This script is designed for Render deployment with PostgreSQL.")
        return
    
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("All database tables created successfully!")
        
        # Check if training modules already exist
        if TrainingModule.query.count() == 0:
            create_default_training_modules()
        else:
            print("Training modules already exist in database.")
        
        # Check if companies exist
        if Company.query.count() == 0:
            companies = create_default_companies()
            print(f"\n=== IMPORTANT: Save these credentials for testing ===")
            for company in companies:
                print(f"Company ID: {company['id']}, Name: {company['name']}, Password: {company['password']}")
            print("=" * 60)
        else:
            print("Companies already exist in database.")

if __name__ == '__main__':
    init_render_database()

