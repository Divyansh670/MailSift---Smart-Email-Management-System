import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import joblib
import os
from config import Config
from data_processor import EmailDataProcessor, create_sample_training_data

class EmailClassifierTrainer:
    def __init__(self):
        self.processor = EmailDataProcessor()
        self.models = {}
        self.vectorizer = None
        self.label_encoder = None
        self.scaler = StandardScaler()
        
    def prepare_data(self, df):
        """Prepare data for training"""
        # Separate features
        text_features = df['text'].fillna('')
        
        # Numerical features
        numerical_features = [
            'subject_length', 'body_length', 'word_count', 
            'exclamation_count', 'question_count', 'caps_ratio'
        ]
        
        # Boolean features
        boolean_features = [
            'has_deadline', 'has_urgent', 'has_apply', 'has_opportunity'
        ]
        
        # Combine numerical and boolean features
        feature_matrix = df[numerical_features + boolean_features].fillna(0)
        
        return text_features, feature_matrix
    
    def create_text_vectorizer(self, text_data):
        """Create and fit TF-IDF vectorizer"""
        self.vectorizer = TfidfVectorizer(
            max_features=Config.MAX_FEATURES,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.95
        )
        
        text_vectors = self.vectorizer.fit_transform(text_data)
        return text_vectors
    
    def train_importance_classifier(self, df):
        """Train binary classifier for email importance"""
        print("Training importance classifier...")
        
        # Prepare data
        text_features, numerical_features = self.prepare_data(df)
        
        # Create text vectors
        text_vectors = self.create_text_vectorizer(text_features)
        
        # Scale numerical features
        numerical_scaled = self.scaler.fit_transform(numerical_features)
        
        # Combine features
        X = np.hstack([text_vectors.toarray(), numerical_scaled])
        y = df['is_important'].astype(int)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=Config.TEST_SIZE, random_state=Config.RANDOM_STATE, stratify=y
        )
        
        # Train multiple models and select best
        models_to_try = {
            'logistic_regression': LogisticRegression(random_state=Config.RANDOM_STATE, max_iter=1000),
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=Config.RANDOM_STATE),
            'svm': SVC(probability=True, random_state=Config.RANDOM_STATE)
        }
        
        best_model = None
        best_score = 0
        
        for name, model in models_to_try.items():
            # Cross-validation
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
            avg_score = cv_scores.mean()
            
            print(f"{name}: CV Accuracy = {avg_score:.4f} (+/- {cv_scores.std() * 2:.4f})")
            
            if avg_score > best_score:
                best_score = avg_score
                best_model = model
                best_model_name = name
        
        # Train best model on full training set
        best_model.fit(X_train, y_train)
        
        # Evaluate on test set
        y_pred = best_model.predict(X_test)
        test_accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\nBest model: {best_model_name}")
        print(f"Test Accuracy: {test_accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        self.models['importance'] = best_model
        return best_model, test_accuracy
    
    def train_category_classifier(self, df):
        """Train multi-class classifier for email categories"""
        print("\nTraining category classifier...")
        
        # Prepare data
        text_features, numerical_features = self.prepare_data(df)
        
        # Use the same vectorizer as importance classifier
        text_vectors = self.vectorizer.transform(text_features)
        
        # Scale numerical features
        numerical_scaled = self.scaler.transform(numerical_features)
        
        # Combine features
        X = np.hstack([text_vectors.toarray(), numerical_scaled])
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        y = self.label_encoder.fit_transform(df['category'])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=Config.TEST_SIZE, random_state=Config.RANDOM_STATE, stratify=y
        )
        
        # Train Random Forest for multi-class classification
        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            random_state=Config.RANDOM_STATE
        )
        
        # Cross-validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
        print(f"Category Classifier CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        # Train on full training set
        model.fit(X_train, y_train)
        
        # Evaluate on test set
        y_pred = model.predict(X_test)
        test_accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Test Accuracy: {test_accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=self.label_encoder.classes_))
        
        self.models['category'] = model
        return model, test_accuracy
    
    def save_models(self):
        """Save trained models and preprocessors"""
        model_data = {
            'importance_model': self.models.get('importance'),
            'category_model': self.models.get('category'),
            'vectorizer': self.vectorizer,
            'label_encoder': self.label_encoder,
            'scaler': self.scaler,
            'config': {
                'categories': Config.CATEGORIES,
                'max_features': Config.MAX_FEATURES,
                'min_confidence': Config.MIN_CONFIDENCE
            }
        }
        
        model_path = os.path.join(Config.MODEL_PATH, Config.MODEL_NAME)
        joblib.dump(model_data, model_path)
        print(f"\nModels saved to: {model_path}")
    
    def train_full_pipeline(self, emails_data=None):
        """Train the complete email classification pipeline"""
        print("Starting email classification training pipeline...")
        
        # Get training data
        if emails_data is None:
            print("No training data provided, using sample data...")
            emails_data = create_sample_training_data()
        
        # Process data
        df = self.processor.create_training_dataset(emails_data)
        
        print(f"Training dataset created with {len(df)} samples")
        print(f"Categories: {df['category'].value_counts().to_dict()}")
        print(f"Important emails: {df['is_important'].sum()}/{len(df)}")
        
        # Check if we have enough data
        if len(df) < 50:
            print("⚠️  WARNING: Training dataset is very small. Consider collecting more data for better performance.")
        
        # Train models
        importance_model, importance_accuracy = self.train_importance_classifier(df)
        category_model, category_accuracy = self.train_category_classifier(df)
        
        # Save models
        self.save_models()
        
        print("\n" + "="*50)
        print("TRAINING COMPLETED SUCCESSFULLY!")
        print("="*50)
        print(f"Importance Classifier Accuracy: {importance_accuracy:.4f}")
        print(f"Category Classifier Accuracy: {category_accuracy:.4f}")
        print(f"Models saved to: {Config.MODEL_PATH}")
        print("\nYou can now start the Flask API server to use the trained models.")
        
        return {
            'importance_accuracy': importance_accuracy,
            'category_accuracy': category_accuracy,
            'training_samples': len(df)
        }

def main():
    """
    Manual Step Required: Prepare your training data
    
    To train the model with your own data:
    1. Modify the create_sample_training_data() function in data_processor.py
    2. Connect it to your actual email data source (Gmail API, database, etc.)
    3. Ensure you have at least 100-500 emails for decent performance
    4. Make sure the data covers all categories you want to classify
    """
    
    trainer = EmailClassifierTrainer()
    
    print("🤖 MailSift ML Model Training")
    print("="*40)
    
    # Manual Step Required: Replace with your actual email data
    print("⚠️  MANUAL STEP REQUIRED:")
    print("1. Modify create_sample_training_data() in data_processor.py")
    print("2. Connect it to your actual email data source")
    print("3. Collect at least 100-500 diverse emails for training")
    print("4. Run this script again with real data")
    print()
    
    choice = input("Continue with sample data for demonstration? (y/n): ").lower()
    
    if choice == 'y':
        print("\nProceeding with sample data...")
        results = trainer.train_full_pipeline()
        
        print("\n📊 Training Results:")
        for key, value in results.items():
            print(f"  {key}: {value}")
            
        print("\n🚀 Next Steps:")
        print("1. Replace sample data with real email data")
        print("2. Retrain the model with more data")
        print("3. Start the Flask API: python predict.py")
        print("4. Test the API with your Node.js backend")
        
    else:
        print("Please prepare your training data first, then run this script again.")

if __name__ == "__main__":
    main()