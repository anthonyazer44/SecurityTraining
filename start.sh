#!/bin/bash
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
