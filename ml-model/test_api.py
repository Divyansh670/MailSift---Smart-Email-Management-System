import requests
import json

def test_ml_api():
    """Test the ML API endpoints"""
    
    base_url = "http://localhost:5001"
    
    # Test data
    test_email = {
        "subject": "Google Summer of Code 2024 - Applications Now Open!",
        "body": "Join thousands of students contributing to open source projects with mentorship from experienced developers. Applications open until March 15th. This is a great opportunity for students to gain experience.",
        "sender": "opensource@google.com"
    }
    
    print("🧪 Testing MailSift ML API")
    print("="*40)
    
    # Test health check
    print("1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test model info
    print("2. Testing model info...")
    try:
        response = requests.get(f"{base_url}/model_info")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            info = response.json()
            print(f"   Categories: {info.get('categories', [])}")
            print(f"   Models loaded: {info.get('models_loaded', False)}")
        else:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test single prediction
    print("3. Testing single prediction...")
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=test_email,
            headers={'Content-Type': 'application/json'}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            prediction = response.json()
            print(f"   Is Important: {prediction.get('isImportant', False)}")
            print(f"   Confidence: {prediction.get('confidence', 0):.3f}")
            print(f"   Primary Category: {prediction.get('primaryCategory', 'unknown')}")
            print(f"   Category Confidence: {prediction.get('categoryConfidence', 0):.3f}")
        else:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test batch prediction
    print("4. Testing batch prediction...")
    try:
        batch_data = {
            "emails": [
                test_email,
                {
                    "subject": "Weekly Newsletter",
                    "body": "Here are this week's updates and news from our team.",
                    "sender": "newsletter@company.com"
                }
            ]
        }
        
        response = requests.post(
            f"{base_url}/batch_predict",
            json=batch_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Processed: {result.get('total_processed', 0)}")
            print(f"   Errors: {result.get('total_errors', 0)}")
        else:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n✅ API testing completed!")

if __name__ == "__main__":
    test_ml_api()