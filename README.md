# MailSift - Smart Email Management System

MailSift is an intelligent email filtering system that uses AI to automatically categorize and prioritize important emails like internships, hackathons, contests, scholarships, and job opportunities.

## 🏗️ Project Structure

```
MailSift/
├── src/                          # React Frontend (Already provided)
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   └── ...
├── server/                       # Node.js Backend
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── ml-model/                     # Python ML Model
│   ├── models/
│   ├── config.py
│   ├── data_processor.py
│   ├── train_model.py
│   ├── predict.py
│   └── requirements.txt
└── README.md
```

## 🚀 Quick Start Guide

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or Atlas)
- Google Cloud Console account

### 1. Frontend Setup (Already Done)

The React frontend is already set up and running. It includes:
- Modern UI with Tailwind CSS
- Email dashboard with filtering
- Reminder system
- Dark/light theme toggle

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your credentials (see Manual Steps below)
nano .env

# Start the server
npm run dev
```

### 3. ML Model Setup

```bash
# Navigate to ML model directory
cd ml-model

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Train the model (see Manual Steps below)
python train_model.py

# Start the ML API server
python predict.py
```

### 4. Database Setup

Make sure MongoDB is running:

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in server/.env
```

## 🔧 Manual Configuration Steps

### Step 1: Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API and Google+ API
4. Create OAuth2 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Client Secret to `server/.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Step 2: MongoDB Configuration

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/mailsift

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mailsift
```

### Step 3: JWT and Session Secrets

Generate secure random strings:

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to server/.env
JWT_SECRET=your_generated_jwt_secret_here
SESSION_SECRET=your_generated_session_secret_here
```

### Step 4: Email Configuration (for reminders)

For Gmail SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password  # Generate app password in Gmail settings
```

### Step 5: ML Model Training Data

**IMPORTANT**: The ML model needs real email data for training.

1. Edit `ml-model/data_processor.py`
2. Replace `create_sample_training_data()` function with your data collection logic
3. Connect to Gmail API or your email database
4. Collect 100-500 diverse emails covering all categories
5. Run training: `python train_model.py`

Example data format:
```python
{
    'subject': 'Email subject',
    'body': 'Email body text',
    'sender': 'sender@example.com'
}
```

## 📊 Database Schema

### User Model
```javascript
{
  googleId: String,
  email: String,
  name: String,
  avatar: String,
  accessToken: String,
  refreshToken: String,
  tokenExpiry: Date,
  preferences: {
    emailFilters: Object,
    reminderSettings: Object
  }
}
```

### Email Model
```javascript
{
  userId: ObjectId,
  gmailId: String,
  subject: String,
  sender: {
    name: String,
    email: String,
    avatar: String
  },
  body: {
    text: String,
    html: String
  },
  date: Date,
  isImportant: Boolean,
  priority: String, // 'high', 'medium', 'low'
  tags: [{
    label: String,
    category: String,
    confidence: Number
  }],
  mlPrediction: Object
}
```

### Reminder Model
```javascript
{
  userId: ObjectId,
  emailId: ObjectId,
  title: String,
  remindAt: Date,
  status: String, // 'pending', 'sent', 'cancelled'
  notificationMethod: String
}
```

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/google` - Start Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get user info

### Emails
- `GET /api/emails/sync` - Sync emails from Gmail
- `GET /api/emails` - Get filtered emails
- `GET /api/emails/:id` - Get single email
- `PATCH /api/emails/:id/important` - Mark important
- `POST /api/emails/:id/reminder` - Create reminder

### Reminders
- `GET /api/reminders` - Get user reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Cancel reminder

### ML API
- `GET /health` - Health check
- `POST /predict` - Predict single email
- `POST /batch_predict` - Predict multiple emails
- `GET /model_info` - Get model information

## 🤖 ML Model Features

### Text Processing
- HTML to text conversion
- Text cleaning and preprocessing
- TF-IDF vectorization
- N-gram features (1-2 grams)

### Feature Engineering
- Subject/body length
- Keyword presence (deadline, urgent, apply)
- Sender domain analysis
- Punctuation analysis
- Capitalization ratio

### Models
- **Importance Classifier**: Binary classification (important/not important)
- **Category Classifier**: Multi-class classification (opportunities, hackathons, etc.)
- **Algorithms**: Logistic Regression, Random Forest, SVM

### Categories
- Opportunities (internships, fellowships)
- Hackathons (coding competitions)
- Contests (programming contests)
- Scholarships (funding opportunities)
- Jobs (employment opportunities)
- Events (conferences, workshops)

## 🔄 Email Processing Flow

1. **Gmail Sync**: Fetch emails via Gmail API
2. **Text Processing**: Clean and extract features
3. **ML Prediction**: Classify importance and category
4. **Keyword Filtering**: Apply rule-based filters
5. **Database Storage**: Save processed emails
6. **Frontend Display**: Show filtered results

## ⚡ Reminder System

### Features
- Cron-based scheduling
- Multiple notification methods (email, push)
- Flexible timing (30min, 1hr, 1day, custom)
- Email templates with HTML formatting

### Workflow
1. User sets reminder via frontend
2. Backend creates reminder record
3. Cron job checks for due reminders
4. Email notification sent via SMTP
5. Reminder marked as sent

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### ML API Testing
```bash
cd ml-model
python test_api.py
```

### Manual Testing
1. Start all services (frontend, backend, ML API)
2. Login with Google account
3. Sync emails from Gmail
4. Test filtering and categorization
5. Create and test reminders

## 🚀 Deployment

### Backend Deployment
- Use PM2 for process management
- Set up reverse proxy with Nginx
- Configure SSL certificates
- Set production environment variables

### ML Model Deployment
- Use Docker for containerization
- Deploy to cloud services (AWS, GCP, Azure)
- Set up auto-scaling
- Monitor model performance

### Database
- Use MongoDB Atlas for production
- Set up backups and monitoring
- Configure connection pooling

## 🔒 Security Features

- JWT authentication
- Rate limiting
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- OAuth2 secure token handling

## 📈 Performance Optimization

- Database indexing
- Caching with Redis (optional)
- Pagination for large datasets
- Batch processing for ML predictions
- Connection pooling

## 🐛 Troubleshooting

### Common Issues

1. **Google OAuth Error**
   - Check redirect URI configuration
   - Verify API credentials
   - Enable required APIs

2. **ML Model Not Loading**
   - Train model first: `python train_model.py`
   - Check model file path
   - Verify Python dependencies

3. **Database Connection Error**
   - Check MongoDB service status
   - Verify connection string
   - Check network connectivity

4. **Email Sync Issues**
   - Verify Gmail API permissions
   - Check token expiration
   - Review API quotas

## 📝 Development Notes

### Adding New Categories
1. Update `Config.CATEGORIES` in `ml-model/config.py`
2. Add keywords to `Config.CATEGORY_KEYWORDS`
3. Retrain the model with new data
4. Update frontend filter options

### Improving ML Accuracy
1. Collect more training data
2. Add new features to `data_processor.py`
3. Experiment with different algorithms
4. Tune hyperparameters
5. Use cross-validation for evaluation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Follow code style guidelines

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check troubleshooting section
2. Review server/ML API logs
3. Test individual components
4. Create GitHub issue with details

---

**Note**: This is a complete implementation guide. Make sure to follow all manual steps for proper setup and configuration.