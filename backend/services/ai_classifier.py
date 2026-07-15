# Proxy for backend/services/ai_classifier.py
import sys
import os

# Allow direct script imports to locate the app directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ai_classifier import classify_complaint, DEPARTMENTS, PRIORITIES, SEVERITIES
