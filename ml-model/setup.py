import os
import sys
import subprocess
import nltk
from config import Config

def setup_ml_environment():
    """Setup ML environment and download required data"""
    
    print("🤖 Setting up MailSift ML Environment")
    print("="*40)
    
    # Create necessary directories
    print("1. Creating directories...")
    os.makedirs(Config.MODEL_PATH, exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    print(f"   ✓ Created {Config.MODEL_PATH}")
    print("   ✓ Created logs/")
    
    # Download NLTK data
    print("\n2. Downloading NLTK data...")
    try:
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        print("   ✓ NLTK data downloaded")
    except Exception as e:
        print(f"   ⚠️  NLTK download warning: {e}")
    
    # Check Python dependencies
    print("\n3. Checking Python dependencies...")
    required_packages = [
        'numpy', 'pandas', 'scikit-learn', 'flask', 
        'nltk', 'beautifulsoup4', 'joblib'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"   ✓ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"   ✗ {package} (missing)")
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    # Create environment file if it doesn't exist
    print("\n4. Checking environment configuration...")
    env_file = '.env'
    if not os.path.exists(env_file):
        print("   Creating .env file from template...")
        with open('.env.example', 'r') as template:
            with open(env_file, 'w') as env:
                env.write(template.read())
        print("   ✓ .env file created")
    else:
        print("   ✓ .env file exists")
    
    # Check if models exist
    print("\n5. Checking trained models...")
    model_path = os.path.join(Config.MODEL_PATH, Config.MODEL_NAME)
    if os.path.exists(model_path):
        print("   ✓ Trained models found")
    else:
        print("   ⚠️  No trained models found")
        print("   Run 'python train_model.py' to train models")
    
    print("\n" + "="*40)
    print("✅ ML Environment setup completed!")
    print("\nNext steps:")
    print("1. Edit .env file with your configuration")
    print("2. Prepare training data in data_processor.py")
    print("3. Run 'python train_model.py' to train models")
    print("4. Run 'python predict.py' to start the API server")
    
    return True

if __name__ == "__main__":
    success = setup_ml_environment()
    sys.exit(0 if success else 1)