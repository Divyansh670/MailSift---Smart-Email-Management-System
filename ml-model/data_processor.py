import re
import pandas as pd
import numpy as np
from bs4 import BeautifulSoup
import html2text
from email.utils import parseaddr
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
import joblib
from config import Config

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class EmailDataProcessor:
    def __init__(self):
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))
        self.html_converter = html2text.HTML2Text()
        self.html_converter.ignore_links = True
        self.html_converter.ignore_images = True
        
    def clean_html(self, html_content):
        """Convert HTML to clean text"""
        if not html_content:
            return ""
        
        try:
            # Use html2text for better conversion
            text = self.html_converter.handle(html_content)
            # Remove extra whitespace and newlines
            text = re.sub(r'\n+', ' ', text)
            text = re.sub(r'\s+', ' ', text)
            return text.strip()
        except:
            # Fallback to BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            return soup.get_text()
    
    def extract_sender_domain(self, sender_email):
        """Extract domain from sender email"""
        try:
            name, email = parseaddr(sender_email)
            if '@' in email:
                return email.split('@')[1].lower()
            return ""
        except:
            return ""
    
    def preprocess_text(self, text):
        """Clean and preprocess text for ML"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and stem
        tokens = [self.stemmer.stem(token) for token in tokens 
                 if token not in self.stop_words and len(token) > 2]
        
        return ' '.join(tokens)
    
    def extract_features(self, email_data):
        """Extract features from email data"""
        features = {}
        
        # Basic text features
        subject = email_data.get('subject', '')
        body_text = email_data.get('body', '')
        sender_email = email_data.get('sender', '')
        
        # Clean HTML if present
        if isinstance(body_text, dict):
            body_text = body_text.get('text', '') or self.clean_html(body_text.get('html', ''))
        
        # Combine subject and body
        full_text = f"{subject} {body_text}"
        
        # Preprocess text
        processed_text = self.preprocess_text(full_text)
        
        # Extract domain features
        sender_domain = self.extract_sender_domain(sender_email)
        
        features.update({
            'processed_text': processed_text,
            'subject_length': len(subject),
            'body_length': len(body_text),
            'total_length': len(full_text),
            'sender_domain': sender_domain,
            'has_deadline': 'deadline' in full_text.lower(),
            'has_urgent': any(word in full_text.lower() for word in ['urgent', 'asap', 'immediate']),
            'has_apply': 'apply' in full_text.lower(),
            'has_opportunity': 'opportunity' in full_text.lower(),
            'word_count': len(full_text.split()),
            'exclamation_count': full_text.count('!'),
            'question_count': full_text.count('?'),
            'caps_ratio': sum(1 for c in full_text if c.isupper()) / max(len(full_text), 1)
        })
        
        return features
    
    def label_email_with_keywords(self, email_data):
        """Label email based on keywords (for training data generation)"""
        subject = email_data.get('subject', '').lower()
        body = email_data.get('body', '')
        
        if isinstance(body, dict):
            body = body.get('text', '') or self.clean_html(body.get('html', ''))
        
        full_text = f"{subject} {body}".lower()
        
        # Check each category
        category_scores = {}
        for category, keywords in Config.CATEGORY_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword in full_text)
            if score > 0:
                category_scores[category] = score
        
        # Return category with highest score, or 'other' if no matches
        if category_scores:
            best_category = max(category_scores.items(), key=lambda x: x[1])
            return best_category[0], best_category[1] / len(Config.CATEGORY_KEYWORDS[best_category[0]])
        
        return 'other', 0.0
    
    def create_training_dataset(self, emails_data):
        """Create training dataset from email data"""
        training_data = []
        
        for email in emails_data:
            # Extract features
            features = self.extract_features(email)
            
            # Get label using keyword matching
            category, confidence = self.label_email_with_keywords(email)
            
            # Determine if important (binary classification)
            is_important = category in ['opportunities', 'scholarships', 'jobs'] or confidence > 0.7
            
            training_data.append({
                'text': features['processed_text'],
                'subject_length': features['subject_length'],
                'body_length': features['body_length'],
                'sender_domain': features['sender_domain'],
                'has_deadline': features['has_deadline'],
                'has_urgent': features['has_urgent'],
                'has_apply': features['has_apply'],
                'has_opportunity': features['has_opportunity'],
                'word_count': features['word_count'],
                'exclamation_count': features['exclamation_count'],
                'question_count': features['question_count'],
                'caps_ratio': features['caps_ratio'],
                'category': category,
                'is_important': is_important,
                'confidence': confidence
            })
        
        return pd.DataFrame(training_data)
    
    def save_preprocessor(self, vectorizer, label_encoder, filepath):
        """Save preprocessing objects"""
        joblib.dump({
            'vectorizer': vectorizer,
            'label_encoder': label_encoder,
            'processor_config': {
                'stop_words': list(self.stop_words),
                'categories': Config.CATEGORIES
            }
        }, filepath)
    
    def load_preprocessor(self, filepath):
        """Load preprocessing objects"""
        data = joblib.load(filepath)
        return data['vectorizer'], data['label_encoder']

# Manual Step Required: Create sample training data
def create_sample_training_data():
    """
    Manual Step Required: Replace this function with your actual email data collection logic.
    
    This function should:
    1. Connect to your email source (Gmail API, database, etc.)
    2. Fetch a diverse set of emails
    3. Return them in the expected format
    
    Expected format for each email:
    {
        'subject': 'Email subject',
        'body': 'Email body text' or {'text': '...', 'html': '...'},
        'sender': 'sender@example.com'
    }
    """
    
    # Sample data for demonstration - replace with real data
    sample_emails = [
        {
            'subject': 'Google Summer of Code 2024 Applications Open',
            'body': 'Join thousands of students in contributing to open source projects...',
            'sender': 'opensource@google.com'
        },
        {
            'subject': 'HackMIT Registration Opens Tomorrow',
            'body': 'Get ready for the biggest hackathon at MIT! Registration opens...',
            'sender': 'team@hackmit.org'
        },
        {
            'subject': 'Weekly Newsletter - Tech Updates',
            'body': 'Here are this week\'s top tech stories and updates...',
            'sender': 'newsletter@techblog.com'
        },
        {
            'subject': 'Software Engineering Internship - Meta',
            'body': 'We are excited to offer internship positions for summer 2024...',
            'sender': 'university@meta.com'
        },
        {
            'subject': 'Gates Millennium Scholarship Application',
            'body': 'The Gates Foundation is offering full scholarships...',
            'sender': 'scholars@gatesfoundation.org'
        }
    ]
    
    print("⚠️  MANUAL STEP REQUIRED:")
    print("Replace the create_sample_training_data() function with your actual email data collection logic.")
    print("The sample data provided is for demonstration only.")
    
    return sample_emails

if __name__ == "__main__":
    processor = EmailDataProcessor()
    
    # Create sample training data
    emails = create_sample_training_data()
    
    # Process the data
    df = processor.create_training_dataset(emails)
    
    print("Training dataset created:")
    print(df.head())
    print(f"\nDataset shape: {df.shape}")
    print(f"Categories distribution:\n{df['category'].value_counts()}")