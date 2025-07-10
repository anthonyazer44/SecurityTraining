#!/usr/bin/env python3
"""
Deployment preparation script for Starcomm Training System
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return None

def check_dependencies():
    """Check if all required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        'flask',
        'flask-cors',
        'flask-sqlalchemy',
        'bcrypt'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        for package in missing_packages:
            run_command(f"pip install {package}", f"Installing {package}")
    else:
        print("✅ All dependencies are installed")

def update_requirements():
    """Update requirements.txt with current environment"""
    print("📝 Updating requirements.txt...")
    
    # Generate requirements.txt
    output = run_command("pip freeze", "Generating requirements.txt")
    if output:
        with open('requirements.txt', 'w') as f:
            f.write(output)
        print("✅ requirements.txt updated")

def create_production_config():
    """Create production configuration file"""
    print("⚙️ Creating production configuration...")
    
    config_content = """# Production Configuration for Starcomm Training System

# Database Configuration
DATABASE_URL=sqlite:///starcomm_training.db

# Security Configuration
SECRET_KEY=your-secret-key-here-change-in-production
FLASK_ENV=production

# Email Configuration (Optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@starcomm.com
FROM_NAME=Starcomm Training System

# Server Configuration
HOST=0.0.0.0
PORT=5000
DEBUG=False

# Security Headers
FORCE_HTTPS=True
SESSION_TIMEOUT=1800

# Rate Limiting
RATE_LIMIT_ENABLED=True
MAX_LOGIN_ATTEMPTS=5
LOGIN_RATE_WINDOW=300
"""
    
    with open('.env.example', 'w') as f:
        f.write(config_content)
    
    print("✅ Production configuration template created (.env.example)")
    print("📋 Remember to:")
    print("   1. Copy .env.example to .env")
    print("   2. Update the configuration values for your environment")
    print("   3. Never commit .env to version control")

def create_docker_files():
    """Create Docker configuration files"""
    print("🐳 Creating Docker configuration...")
    
    # Dockerfile
    dockerfile_content = """FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \\
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:5000/api/health || exit 1

# Run application
CMD ["python", "src/main.py"]
"""
    
    with open('Dockerfile', 'w') as f:
        f.write(dockerfile_content)
    
    # Docker Compose
    docker_compose_content = """version: '3.8'

services:
  starcomm-training:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=sqlite:///data/starcomm_training.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  data:
"""
    
    with open('docker-compose.yml', 'w') as f:
        f.write(docker_compose_content)
    
    print("✅ Docker configuration files created")

def create_deployment_scripts():
    """Create deployment scripts"""
    print("📜 Creating deployment scripts...")
    
    # Start script
    start_script = """#!/bin/bash
# Start script for Starcomm Training System

echo "🚀 Starting Starcomm Training System..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Initialize database
echo "Initializing database..."
python src/init_database.py

# Start the application
echo "Starting application..."
python src/main.py
"""
    
    with open('start.sh', 'w') as f:
        f.write(start_script)
    
    os.chmod('start.sh', 0o755)
    
    # Production start script
    prod_start_script = """#!/bin/bash
# Production start script for Starcomm Training System

echo "🚀 Starting Starcomm Training System (Production)..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Initialize database if it doesn't exist
if [ ! -f "starcomm_training.db" ]; then
    echo "Initializing database..."
    python src/init_database.py
fi

# Start the application with gunicorn for production
echo "Starting application with gunicorn..."
pip install gunicorn
gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 4 --timeout 120 src.main:app
"""
    
    with open('start-prod.sh', 'w') as f:
        f.write(prod_start_script)
    
    os.chmod('start-prod.sh', 0o755)
    
    print("✅ Deployment scripts created")

def create_readme():
    """Create comprehensive README file"""
    print("📖 Creating README.md...")
    
    readme_content = """# Starcomm Training System

A comprehensive 3-tier security awareness training platform with Master Admin, Company Admin, and Employee portals.

## Features

### Master Admin Portal
- Manage multiple companies
- View system-wide analytics
- Create and manage training modules
- Monitor compliance across all companies

### Company Admin Portal
- Manage company employees
- Assign training modules
- Track employee progress
- Generate compliance reports

### Employee Training Portal
- Complete assigned training modules
- Take interactive quizzes
- Track personal progress
- Earn completion certificates

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: SQLite (development), PostgreSQL (production recommended)
- **Security**: bcrypt, rate limiting, input validation
- **Email**: SMTP integration for notifications

## Quick Start

### Development

1. Clone the repository
2. Run the start script:
   ```bash
   ./start.sh
   ```
3. Open http://localhost:5000 in your browser

### Production

1. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
2. Update the configuration in `.env`
3. Run the production start script:
   ```bash
   ./start-prod.sh
   ```

### Docker Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Configuration

### Environment Variables

- `SECRET_KEY`: Flask secret key for sessions
- `DATABASE_URL`: Database connection string
- `SMTP_SERVER`: Email server for notifications
- `SMTP_USERNAME`: Email username
- `SMTP_PASSWORD`: Email password

### Default Credentials

**Master Admin:**
- Username: admin
- Password: admin123

**Note**: Change these credentials in production!

## API Endpoints

### Master Admin
- `POST /api/master/login` - Master admin login
- `GET /api/master/dashboard` - Dashboard statistics
- `POST /api/master/companies` - Create company
- `GET /api/master/companies` - List companies

### Company Admin
- `POST /api/company/{id}/login` - Company admin login
- `GET /api/company/{id}/dashboard` - Company dashboard
- `POST /api/company/{id}/employees` - Create employee
- `GET /api/company/{id}/employees` - List employees

### Employee
- `POST /api/employee/{id}/login` - Employee login
- `GET /api/employee/{id}/dashboard` - Employee dashboard
- `GET /api/employee/{id}/modules` - Available modules
- `POST /api/employee/{id}/progress` - Update progress

## Security Features

- Input validation and sanitization
- Rate limiting for brute force protection
- Secure password hashing with bcrypt
- Session management with timeout
- CSRF protection
- Security headers
- Audit logging

## Development

### Project Structure

```
starcomm-training-system/
├── src/
│   ├── main.py              # Main Flask application
│   ├── models/              # Database models
│   ├── routes/              # API route handlers
│   ├── utils/               # Utility functions
│   └── static/              # Frontend files
├── requirements.txt         # Python dependencies
├── start.sh                # Development start script
├── start-prod.sh           # Production start script
└── docker-compose.yml      # Docker configuration
```

### Adding New Features

1. Create database models in `src/models/`
2. Add API routes in `src/routes/`
3. Update frontend components in `src/static/js/components/`
4. Add tests and update documentation

## Deployment

### Render.com

1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy using the production start script

### Heroku

1. Create a new Heroku app
2. Set environment variables
3. Deploy using Git

### VPS/Cloud Server

1. Clone repository on server
2. Configure environment variables
3. Run production start script
4. Set up reverse proxy (nginx recommended)

## Support

For support and questions, please contact the development team.

## License

Copyright © 2024 Starcomm. All rights reserved.
"""
    
    with open('README.md', 'w') as f:
        f.write(readme_content)
    
    print("✅ README.md created")

def main():
    """Main deployment preparation function"""
    print("🎯 Starcomm Training System - Deployment Preparation")
    print("=" * 50)
    
    # Change to project directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run preparation steps
    check_dependencies()
    update_requirements()
    create_production_config()
    create_docker_files()
    create_deployment_scripts()
    create_readme()
    
    print("\n🎉 Deployment preparation completed!")
    print("\n📋 Next steps:")
    print("1. Review and update .env.example with your configuration")
    print("2. Test the application locally with ./start.sh")
    print("3. Deploy to your preferred platform")
    print("4. Update default credentials for security")
    
    print("\n🚀 Your Starcomm Training System is ready for deployment!")

if __name__ == "__main__":
    main()

