import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

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
        },
        {
            "question": "Which of these is a red flag in an email?",
            "type": "multiple_choice",
            "options": [
                "Generic greetings like 'Dear Customer'",
                "Requests for personal information",
                "Mismatched URLs when hovering over links",
                "All of the above"
            ],
            "correct_answer": 3,
            "explanation": "All of these are common red flags that indicate a potential phishing attempt."
        },
        {
            "question": "You can trust an email if it has your company's logo.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Logos can be easily copied and used in phishing emails to appear legitimate."
        },
        {
            "question": "What is the best way to verify a suspicious email?",
            "type": "multiple_choice",
            "options": [
                "Reply to the email asking for confirmation",
                "Contact the sender through a separate, known communication method",
                "Click the link to see where it goes",
                "Forward it to friends for their opinion"
            ],
            "correct_answer": 1,
            "explanation": "Always verify through a separate, trusted communication channel."
        },
        {
            "question": "Phishing emails always contain spelling and grammar errors.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Modern phishing emails can be very well-crafted and may not contain obvious errors."
        },
        {
            "question": "What should you do before clicking any link in an email?",
            "type": "multiple_choice",
            "options": [
                "Check the sender's reputation",
                "Hover over the link to see the actual URL",
                "Verify the email's authenticity",
                "All of the above"
            ],
            "correct_answer": 3,
            "explanation": "All of these steps help ensure the link is safe before clicking."
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
        },
        {
            "question": "Password managers are unsafe to use.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Password managers are actually recommended as they help create and store unique, strong passwords."
        },
        {
            "question": "How often should you change your passwords?",
            "type": "multiple_choice",
            "options": [
                "Every day",
                "When there's a security breach or suspicious activity",
                "Never",
                "Every hour"
            ],
            "correct_answer": 1,
            "explanation": "Passwords should be changed when there's a security incident or suspicious activity."
        },
        {
            "question": "Which is the weakest password?",
            "type": "multiple_choice",
            "options": [
                "MyP@ssw0rd123!",
                "password123",
                "Tr0ub4dor&3",
                "correct-horse-battery-staple"
            ],
            "correct_answer": 1,
            "explanation": "Simple passwords with common patterns are easily guessed or cracked."
        },
        {
            "question": "It's safe to share your password with trusted colleagues.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Passwords should never be shared, even with trusted individuals."
        },
        {
            "question": "What should you do if you suspect your password has been compromised?",
            "type": "multiple_choice",
            "options": [
                "Wait and see if anything happens",
                "Change the password immediately",
                "Use the account less frequently",
                "Tell everyone about it"
            ],
            "correct_answer": 1,
            "explanation": "Immediately changing a compromised password helps prevent unauthorized access."
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
    
    # 3. Social Engineering (25 minutes)
    social_engineering_questions = [
        {
            "question": "What is social engineering?",
            "type": "multiple_choice",
            "options": [
                "Building social networks",
                "Manipulating people to divulge confidential information",
                "Engineering social media platforms",
                "Creating social groups"
            ],
            "correct_answer": 1,
            "explanation": "Social engineering involves manipulating people to reveal sensitive information or perform actions."
        },
        {
            "question": "Attackers never use phone calls for social engineering.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Phone calls are a common method for social engineering attacks."
        },
        {
            "question": "What is pretexting?",
            "type": "multiple_choice",
            "options": [
                "Sending text messages",
                "Creating a fabricated scenario to engage victims",
                "Writing before texting",
                "Preparing for a presentation"
            ],
            "correct_answer": 1,
            "explanation": "Pretexting involves creating a false scenario to trick victims into providing information."
        },
        {
            "question": "You should always verify the identity of callers requesting sensitive information.",
            "type": "true_false",
            "correct_answer": True,
            "explanation": "Always verify the identity of anyone requesting sensitive information through independent means."
        },
        {
            "question": "What is tailgating in security terms?",
            "type": "multiple_choice",
            "options": [
                "Following someone's car too closely",
                "Following someone into a secure area without authorization",
                "Copying someone's work",
                "Monitoring someone's computer"
            ],
            "correct_answer": 1,
            "explanation": "Tailgating is following someone into a restricted area without proper authorization."
        },
        {
            "question": "Social engineers often exploit which human trait?",
            "type": "multiple_choice",
            "options": [
                "Helpfulness and trust",
                "Suspicion",
                "Laziness",
                "Intelligence"
            ],
            "correct_answer": 0,
            "explanation": "Social engineers often exploit people's natural tendency to be helpful and trusting."
        },
        {
            "question": "Baiting involves leaving infected USB drives for people to find.",
            "type": "true_false",
            "correct_answer": True,
            "explanation": "Baiting often involves leaving infected devices or media for curious victims to use."
        },
        {
            "question": "What should you do if someone claims to be from IT and asks for your password?",
            "type": "multiple_choice",
            "options": [
                "Give them the password immediately",
                "Ask for their employee ID and verify through official channels",
                "Hang up and ignore them",
                "Give them a fake password"
            ],
            "correct_answer": 1,
            "explanation": "Always verify the identity of anyone requesting sensitive information through official channels."
        },
        {
            "question": "Quid pro quo attacks offer something in exchange for information.",
            "type": "true_false",
            "correct_answer": True,
            "explanation": "Quid pro quo attacks involve offering a service or benefit in exchange for information or access."
        },
        {
            "question": "Which is NOT a common social engineering technique?",
            "type": "multiple_choice",
            "options": [
                "Phishing",
                "Pretexting",
                "Encryption",
                "Baiting"
            ],
            "correct_answer": 2,
            "explanation": "Encryption is a security measure, not a social engineering technique."
        },
        {
            "question": "Authority is often used in social engineering attacks.",
            "type": "true_false",
            "correct_answer": True,
            "explanation": "Attackers often impersonate authority figures to pressure victims into compliance."
        },
        {
            "question": "What is the best defense against social engineering?",
            "type": "multiple_choice",
            "options": [
                "Awareness and verification procedures",
                "Avoiding all communication",
                "Using complex passwords",
                "Installing antivirus software"
            ],
            "correct_answer": 0,
            "explanation": "Awareness of social engineering tactics and proper verification procedures are the best defenses."
        }
    ]
    
    social_engineering_module = TrainingModule(
        title="Social Engineering",
        description="Understand social engineering tactics including phone scams and physical security threats.",
        video_url="/static/videos/social-engineering.mp4",
        duration_minutes=25,
        difficulty_level="Intermediate",
        category="Social Engineering",
        quiz_questions=json.dumps(social_engineering_questions),
        passing_score=70
    )
    
    # 4. Data Protection (18 minutes)
    data_protection_questions = [
        {
            "question": "What does GDPR stand for?",
            "type": "multiple_choice",
            "options": [
                "General Data Protection Regulation",
                "Global Data Privacy Rules",
                "Government Data Protection Requirements",
                "General Database Protection Rules"
            ],
            "correct_answer": 0,
            "explanation": "GDPR stands for General Data Protection Regulation, a European privacy law."
        },
        {
            "question": "Personal data can be shared freely within an organization.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Personal data should only be accessed by those who need it for their job functions."
        },
        {
            "question": "What is considered personal data?",
            "type": "multiple_choice",
            "options": [
                "Name and email address",
                "IP addresses and location data",
                "Biometric and health information",
                "All of the above"
            ],
            "correct_answer": 3,
            "explanation": "Personal data includes any information that can identify an individual."
        },
        {
            "question": "Data should be kept forever for backup purposes.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Data should only be kept as long as necessary for its intended purpose."
        },
        {
            "question": "What is data minimization?",
            "type": "multiple_choice",
            "options": [
                "Reducing file sizes",
                "Collecting only necessary data",
                "Minimizing data storage costs",
                "Using minimal security measures"
            ],
            "correct_answer": 1,
            "explanation": "Data minimization means collecting only the data that is necessary for the intended purpose."
        },
        {
            "question": "Individuals have the right to access their personal data.",
            "type": "true_false",
            "correct_answer": True,
            "explanation": "Under GDPR and similar laws, individuals have the right to access their personal data."
        },
        {
            "question": "What should you do with sensitive documents when finished?",
            "type": "multiple_choice",
            "options": [
                "Leave them on your desk",
                "Throw them in regular trash",
                "Securely dispose of them (shred/secure disposal)",
                "Give them to colleagues"
            ],
            "correct_answer": 2,
            "explanation": "Sensitive documents should be securely disposed of to prevent unauthorized access."
        },
        {
            "question": "Cloud storage is always secure for sensitive data.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Cloud storage security depends on the provider and configuration; not all cloud storage is appropriate for sensitive data."
        },
        {
            "question": "What is a data breach?",
            "type": "multiple_choice",
            "options": [
                "Authorized access to data",
                "Unauthorized access, disclosure, or loss of data",
                "Regular data backup",
                "Data analysis process"
            ],
            "correct_answer": 1,
            "explanation": "A data breach involves unauthorized access, disclosure, or loss of sensitive data."
        },
        {
            "question": "Data protection is only the IT department's responsibility.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Data protection is everyone's responsibility, not just the IT department."
        }
    ]
    
    data_protection_module = TrainingModule(
        title="Data Protection",
        description="Learn GDPR basics and safe data handling practices to protect personal and sensitive information.",
        video_url="/static/videos/data-protection.mp4",
        duration_minutes=18,
        difficulty_level="Intermediate",
        category="Data Protection",
        quiz_questions=json.dumps(data_protection_questions),
        passing_score=70
    )
    
    # 5. Remote Work Security (22 minutes)
    remote_work_questions = [
        {
            "question": "What is the most important security consideration for home networks?",
            "type": "multiple_choice",
            "options": [
                "Using default router passwords",
                "Changing default passwords and enabling WPA3 encryption",
                "Leaving WiFi open for convenience",
                "Using WEP encryption"
            ],
            "correct_answer": 1,
            "explanation": "Changing default passwords and using strong encryption are crucial for home network security."
        },
        {
            "question": "Public WiFi is safe for work activities if you use HTTPS websites.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Public WiFi should be avoided for work activities; use VPN if necessary."
        },
        {
            "question": "What is a VPN?",
            "type": "multiple_choice",
            "options": [
                "Very Private Network",
                "Virtual Private Network",
                "Verified Personal Network",
                "Visual Privacy Network"
            ],
            "correct_answer": 1,
            "explanation": "VPN stands for Virtual Private Network, which creates a secure connection over the internet."
        },
        {
            "question": "You should always use company-provided VPN when working remotely.",
            "type": "true_false",
            "correct_answer": True,
            "explanation": "Company VPNs provide secure access to company resources and protect data in transit."
        },
        {
            "question": "What should you do with your work laptop when not in use?",
            "type": "multiple_choice",
            "options": [
                "Leave it open and unlocked",
                "Lock the screen or shut it down",
                "Let family members use it",
                "Leave it in your car"
            ],
            "correct_answer": 1,
            "explanation": "Always lock or shut down work devices when not in use to prevent unauthorized access."
        },
        {
            "question": "It's safe to discuss confidential work matters in public spaces.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Confidential work discussions should only happen in private, secure environments."
        },
        {
            "question": "What is shoulder surfing?",
            "type": "multiple_choice",
            "options": [
                "Surfing the internet over someone's shoulder",
                "Looking over someone's shoulder to see sensitive information",
                "A type of exercise",
                "Sharing computer screens"
            ],
            "correct_answer": 1,
            "explanation": "Shoulder surfing is when someone looks over your shoulder to view sensitive information on your screen."
        },
        {
            "question": "Home printers are always secure for printing work documents.",
            "type": "true_false",
            "correct_answer": False,
            "explanation": "Home printers may not have the same security features as office printers and could pose risks."
        },
        {
            "question": "What should you do if your work device is lost or stolen?",
            "type": "multiple_choice",
            "options": [
                "Wait to see if it turns up",
                "Report it immediately to IT and security teams",
                "Buy a replacement yourself",
                "Continue working on personal devices"
            ],
            "correct_answer": 1,
            "explanation": "Immediately report lost or stolen work devices so they can be remotely wiped and secured."
        },
        {
            "question": "Video calls should be secured with passwords or waiting rooms.",
            "type": "true_false",
            "correct_answer": True,
            "explanation": "Video calls should use security features like passwords or waiting rooms to prevent unauthorized access."
        },
        {
            "question": "Which is NOT a good practice for remote work security?",
            "type": "multiple_choice",
            "options": [
                "Using a privacy screen",
                "Keeping software updated",
                "Sharing login credentials with family",
                "Using strong WiFi encryption"
            ],
            "correct_answer": 2,
            "explanation": "Login credentials should never be shared with anyone, including family members."
        }
    ]
    
    remote_work_module = TrainingModule(
        title="Remote Work Security",
        description="Essential security practices for remote work including home network security and VPN usage.",
        video_url="/static/videos/remote-work-security.mp4",
        duration_minutes=22,
        difficulty_level="Intermediate",
        category="Remote Work",
        quiz_questions=json.dumps(remote_work_questions),
        passing_score=70
    )
    
    # Add all modules to the database
    modules = [
        phishing_module,
        password_module,
        social_engineering_module,
        data_protection_module,
        remote_work_module
    ]
    
    for module in modules:
        db.session.add(module)
    
    db.session.commit()
    print("Default training modules created successfully!")

def create_default_company():
    """Create a default test company for testing purposes"""
    # Generate a random password for the company
    alphabet = string.ascii_letters + string.digits
    password = ''.join(secrets.choice(alphabet) for i in range(12))
    
    # Hash the password
    hashed_password = PasswordSecurity.hash_password(password)
    
    # Create the test company
    test_company = Company(
        name="Test Company Inc",
        admin_password=hashed_password,
        contact_email="admin@testcompany.com",
        industry="Technology",
        employee_count=50,
        is_active=True
    )
    
    db.session.add(test_company)
    db.session.commit()
    
    print(f"Default test company created successfully!")
    print(f"Company ID: {test_company.id}")
    print(f"Company Name: {test_company.name}")
    print(f"Company Password: {password}")
    print("Save this password for testing!")
    
    return test_company, password

def init_database():
    """Initialize the database with default data"""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
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
            company, password = create_default_company()
            print(f"\n=== IMPORTANT: Save these credentials for testing ===")
            print(f"Company ID: {company.id}")
            print(f"Company Password: {password}")
            print("=" * 50)
        else:
            print("Companies already exist in database.")

if __name__ == '__main__':
    init_database()

