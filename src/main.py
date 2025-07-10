import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from src.models.database import db, TrainingModule
from src.routes.master_admin import master_admin_bp
from src.routes.company_admin import company_admin_bp
from src.routes.employee import employee_bp
from src.utils.security import apply_security_headers, RateLimiter, AuditLogger, rate_limiter

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'starcomm-training-system-secret-key-2024'

# Enable CORS for all routes
CORS(app, origins="*", allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"])

# Database configuration - support both SQLite (local) and PostgreSQL (Render)
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    # Production (Render) - PostgreSQL
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    # Local development - SQLite
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Register blueprints
app.register_blueprint(master_admin_bp, url_prefix='/api/master')
app.register_blueprint(company_admin_bp, url_prefix='/api/company')
app.register_blueprint(employee_bp, url_prefix='/api/employee')

# Apply security middleware
apply_security_headers(app)

# Rate limiting for sensitive endpoints
@app.before_request
def before_request():
    # Apply rate limiting to login endpoints
    if request.endpoint and 'login' in request.endpoint:
        if rate_limiter.is_rate_limited(request.remote_addr, max_attempts=5, window_minutes=5):
            return jsonify({
                'error': 'Too many login attempts. Please try again in 5 minutes.',
                'retry_after': 300
            }), 429

# Training modules API endpoint
@app.route('/api/training-modules', methods=['GET'])
def get_training_modules():
    """Get all available training modules"""
    try:
        modules = TrainingModule.query.all()
        modules_data = []
        
        for module in modules:
            modules_data.append({
                'id': module.id,
                'title': module.title,
                'description': module.description,
                'category': module.category,
                'duration_minutes': module.duration_minutes,
                'difficulty_level': module.difficulty_level,
                'passing_score': module.passing_score
            })
        
        return jsonify({
            'success': True,
            'modules': modules_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Starcomm Training System',
        'version': '1.0.0'
    })

# Database initialization endpoint
@app.route('/api/init-database', methods=['POST'])
def init_database():
    """Initialize database with default data"""
    try:
        from src.utils.security import PasswordSecurity
        import json
        
        # Create all tables
        db.create_all()
        
        # Check if already initialized
        if TrainingModule.query.count() > 0:
            return jsonify({
                'success': True,
                'message': 'Database already initialized',
                'modules_count': TrainingModule.query.count()
            })
        
        # Create default training modules
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
            }
        ]
        
        phishing_module = TrainingModule(
            title="Phishing Awareness",
            description="Learn to identify and avoid phishing attacks through email, social media, and other channels.",
            video_url="/static/videos/phishing-awareness.mp4",
            duration_minutes=20,
            difficulty_level="Beginner",
            category="Email Security",
            quiz_questions=json.dumps(phishing_questions),
            passing_score=80
        )
        
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
                "explanation": "Strong passwords should be long and contain a mix of different character types."
            }
        ]
        
        password_module = TrainingModule(
            title="Password Security",
            description="Best practices for creating, managing, and protecting strong passwords.",
            video_url="/static/videos/password-security.mp4",
            duration_minutes=15,
            difficulty_level="Beginner",
            category="Authentication",
            quiz_questions=json.dumps(password_questions),
            passing_score=75
        )
        
        # Add modules to database
        db.session.add(phishing_module)
        db.session.add(password_module)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Database initialized successfully',
            'modules_created': 2,
            'admin_note': 'Default admin credentials: admin/admin123'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Serve static files
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    try:
        return send_from_directory(app.static_folder, path)
    except:
        # For SPA routing, return index.html for non-API routes
        if not path.startswith('api/'):
            return send_from_directory(app.static_folder, 'index.html')
        return jsonify({'error': 'Not found'}), 404

# Error handlers
@app.errorhandler(404)
def not_found(error):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(429)
def rate_limit_error(error):
    return jsonify({'error': 'Rate limit exceeded'}), 429

def init_database():
    """Initialize database with default data"""
    from src.models.database import Company, Employee, EmployeeProgress, EmployeeNotes
    from src.utils.security import PasswordSecurity
    import string
    import secrets
    import json
    
    # Create all tables
    db.create_all()
    
    # Check if training modules already exist
    if TrainingModule.query.count() == 0:
        # Create default training modules
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
        
        db.session.add(phishing_module)
        db.session.add(password_module)
        db.session.commit()
        print("Default training modules created!")
    
    # Check if companies exist
    if Company.query.count() == 0:
        # Create default test companies
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
            
            print(f"Created company: ID={company.id}, Name={company.name}, Password={password}")
        
        db.session.commit()
        print("Default companies created!")

# Initialize database on startup
with app.app_context():
    init_database()

if __name__ == '__main__':
    # Run the application
    app.run(host='0.0.0.0', port=5000, debug=True)

