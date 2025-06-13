import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask configuration
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    PORT = int(os.getenv('ML_PORT', 5001))
    HOST = os.getenv('ML_HOST', '0.0.0.0')
    
    # Model configuration
    MODEL_PATH = os.getenv('MODEL_PATH', 'models/')
    MODEL_NAME = os.getenv('MODEL_NAME', 'email_classifier.joblib')
    VECTORIZER_NAME = os.getenv('VECTORIZER_NAME', 'tfidf_vectorizer.joblib')
    
    # Training configuration
    TEST_SIZE = float(os.getenv('TEST_SIZE', 0.2))
    RANDOM_STATE = int(os.getenv('RANDOM_STATE', 42))
    MAX_FEATURES = int(os.getenv('MAX_FEATURES', 10000))
    
    # Text processing
    MIN_CONFIDENCE = float(os.getenv('MIN_CONFIDENCE', 0.5))
    MAX_TEXT_LENGTH = int(os.getenv('MAX_TEXT_LENGTH', 10000))
    
    # Categories for classification
    CATEGORIES = [
        'opportunities',
        'hackathons', 
        'contests',
        'scholarships',
        'jobs',
        'events',
        'other'
    ]
    
    # Keywords for each category (used for initial labeling)
    CATEGORY_KEYWORDS = {
        'opportunities': [
            'internship', 'intern', 'opportunity', 'application', 'apply now',
            'career', 'job opening', 'position', 'hiring', 'recruitment',
            'fellowship', 'program', 'mentorship', 'training', 'apprenticeship'
        ],
        'hackathons': [
            'hackathon', 'hack', 'coding competition', 'programming contest',
            'dev challenge', 'build challenge', 'code sprint', 'hack day',
            'innovation challenge', 'tech competition'
        ],
        'contests': [
            'contest', 'competition', 'challenge', 'prize', 'award',
            'winner', 'submit', 'deadline', 'entry', 'participate',
            'coding contest', 'programming competition'
        ],
        'scholarships': [
            'scholarship', 'grant', 'funding', 'financial aid', 'tuition',
            'education fund', 'student aid', 'bursary', 'stipend',
            'educational support', 'study abroad'
        ],
        'jobs': [
            'job', 'position', 'role', 'employment', 'career',
            'full-time', 'part-time', 'remote', 'work from home',
            'software engineer', 'developer', 'programmer', 'analyst'
        ],
        'events': [
            'event', 'conference', 'workshop', 'seminar', 'webinar',
            'meetup', 'summit', 'symposium', 'networking', 'tech talk',
            'presentation', 'demo day'
        ]
    }

# Create directories if they don't exist
os.makedirs(Config.MODEL_PATH, exist_ok=True)