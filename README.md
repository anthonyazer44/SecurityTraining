# Starcomm Training System

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
