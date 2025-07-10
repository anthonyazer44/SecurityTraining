#!/bin/bash
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
