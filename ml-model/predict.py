from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import logging
from datetime import datetime
from config import Config
from data_processor import EmailDataProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class EmailPredictor:
    def __init__(self):
        self.processor = EmailDataProcessor()
        self.models = None
        self.vectorizer = None
        self.label_encoder = None
        self.scaler = None
        self.is_loaded = False
        
    def load_models(self):
        """Load trained models and preprocessors"""
        try:
            model_path = os.path.join(Config.MODEL_PATH, Config.MODEL_NAME)
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found: {model_path}")
            
            model_data = joblib.load(model_path)
            
            self.models = {
                'importance': model_data['importance_model'],
                'category': model_data['category_model']
            }
            
            self.vectorizer = model_data['vectorizer']
            self.label_encoder = model_data['label_encoder']
            self.scaler = model_data['scaler']
            
            self.is_loaded = True
            logger.info("Models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise e
    
    def predict_email(self, email_data):
        """Predict importance and category for an email"""
        if not self.is_loaded:
            raise RuntimeError("Models not loaded. Call load_models() first.")
        
        try:
            # Extract features
            features = self.processor.extract_features(email_data)
            
            # Prepare text features
            text_vector = self.vectorizer.transform([features['processed_text']])
            
            # Prepare numerical features
            numerical_features = np.array([[
                features['subject_length'],
                features['body_length'],
                features['word_count'],
                features['exclamation_count'],
                features['question_count'],
                features['caps_ratio'],
                features['has_deadline'],
                features['has_urgent'],
                features['has_apply'],
                features['has_opportunity']
            ]])
            
            # Scale numerical features
            numerical_scaled = self.scaler.transform(numerical_features)
            
            # Combine features
            X = np.hstack([text_vector.toarray(), numerical_scaled])
            
            # Predict importance
            importance_prob = self.models['importance'].predict_proba(X)[0]
            is_important = bool(importance_prob[1] > Config.MIN_CONFIDENCE)
            importance_confidence = float(importance_prob[1])
            
            # Predict category
            category_probs = self.models['category'].predict_proba(X)[0]
            category_idx = np.argmax(category_probs)
            category = self.label_encoder.classes_[category_idx]
            category_confidence = float(category_probs[category_idx])
            
            # Get top 3 categories with confidence scores
            top_categories = []
            for i, prob in enumerate(category_probs):
                if prob > 0.1:  # Only include categories with >10% confidence
                    top_categories.append({
                        'name': self.label_encoder.classes_[i],
                        'confidence': float(prob)
                    })
            
            # Sort by confidence
            top_categories.sort(key=lambda x: x['confidence'], reverse=True)
            
            return {
                'isImportant': is_important,
                'confidence': importance_confidence,
                'primaryCategory': category,
                'categoryConfidence': category_confidence,
                'categories': top_categories[:3],
                'features': {
                    'textLength': features['total_length'],
                    'hasDeadline': features['has_deadline'],
                    'hasUrgent': features['has_urgent'],
                    'senderDomain': features['sender_domain']
                }
            }
            
        except Exception as e:
            logger.error(f"Error predicting email: {str(e)}")
            raise e

# Initialize predictor
predictor = EmailPredictor()

@app.before_first_request
def load_models():
    """Load models when the app starts"""
    try:
        predictor.load_models()
        logger.info("Flask app initialized with ML models")
    except Exception as e:
        logger.error(f"Failed to load models: {str(e)}")
        logger.warning("App will continue without ML models - predictions will fail")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': predictor.is_loaded,
        'version': '1.0.0'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict email importance and category"""
    try:
        if not predictor.is_loaded:
            return jsonify({
                'error': 'Models not loaded',
                'message': 'ML models are not available. Please check server logs.'
            }), 503
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Request body must contain email data'
            }), 400
        
        # Validate required fields
        required_fields = ['subject', 'body']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Make prediction
        prediction = predictor.predict_email(data)
        
        # Add metadata
        prediction['timestamp'] = datetime.now().isoformat()
        prediction['model_version'] = '1.0.0'
        
        return jsonify(prediction)
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Predict multiple emails at once"""
    try:
        if not predictor.is_loaded:
            return jsonify({
                'error': 'Models not loaded'
            }), 503
        
        data = request.get_json()
        
        if not data or 'emails' not in data:
            return jsonify({
                'error': 'No emails provided',
                'message': 'Request body must contain "emails" array'
            }), 400
        
        emails = data['emails']
        
        if not isinstance(emails, list):
            return jsonify({
                'error': 'Invalid format',
                'message': 'emails must be an array'
            }), 400
        
        if len(emails) > 100:
            return jsonify({
                'error': 'Too many emails',
                'message': 'Maximum 100 emails per batch request'
            }), 400
        
        # Process each email
        predictions = []
        errors = []
        
        for i, email in enumerate(emails):
            try:
                prediction = predictor.predict_email(email)
                prediction['index'] = i
                predictions.append(prediction)
            except Exception as e:
                errors.append({
                    'index': i,
                    'error': str(e)
                })
        
        return jsonify({
            'predictions': predictions,
            'errors': errors,
            'total_processed': len(predictions),
            'total_errors': len(errors),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({
            'error': 'Batch prediction failed',
            'message': str(e)
        }), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """Get information about loaded models"""
    try:
        if not predictor.is_loaded:
            return jsonify({
                'error': 'Models not loaded'
            }), 503
        
        return jsonify({
            'models_loaded': True,
            'categories': list(predictor.label_encoder.classes_),
            'features': {
                'max_features': Config.MAX_FEATURES,
                'min_confidence': Config.MIN_CONFIDENCE
            },
            'version': '1.0.0',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Model info error: {str(e)}")
        return jsonify({
            'error': 'Failed to get model info',
            'message': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500

if __name__ == '__main__':
    print("🤖 MailSift ML API Server")
    print("="*30)
    
    # Check if models exist
    model_path = os.path.join(Config.MODEL_PATH, Config.MODEL_NAME)
    if not os.path.exists(model_path):
        print("⚠️  WARNING: No trained models found!")
        print(f"Expected model file: {model_path}")
        print("Please run 'python train_model.py' first to train the models.")
        print()
        print("The server will start but predictions will fail until models are trained.")
        print()
    
    print(f"🚀 Starting server on {Config.HOST}:{Config.PORT}")
    print(f"📊 Model path: {Config.MODEL_PATH}")
    print(f"🔗 Health check: http://{Config.HOST}:{Config.PORT}/health")
    print(f"🎯 Prediction endpoint: http://{Config.HOST}:{Config.PORT}/predict")
    print()
    
    # Start Flask app
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )