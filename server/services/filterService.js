const axios = require('axios');

class FilterService {
  constructor() {
    // Keywords for different categories
    this.keywords = {
      opportunities: [
        'internship', 'intern', 'opportunity', 'application', 'apply now',
        'career', 'job opening', 'position', 'hiring', 'recruitment',
        'fellowship', 'program', 'mentorship', 'training', 'apprenticeship'
      ],
      hackathons: [
        'hackathon', 'hack', 'coding competition', 'programming contest',
        'dev challenge', 'build challenge', 'code sprint', 'hack day',
        'innovation challenge', 'tech competition'
      ],
      contests: [
        'contest', 'competition', 'challenge', 'prize', 'award',
        'winner', 'submit', 'deadline', 'entry', 'participate',
        'coding contest', 'programming competition'
      ],
      scholarships: [
        'scholarship', 'grant', 'funding', 'financial aid', 'tuition',
        'education fund', 'student aid', 'bursary', 'stipend',
        'educational support', 'study abroad'
      ],
      jobs: [
        'job', 'position', 'role', 'employment', 'career',
        'full-time', 'part-time', 'remote', 'work from home',
        'software engineer', 'developer', 'programmer', 'analyst'
      ],
      events: [
        'event', 'conference', 'workshop', 'seminar', 'webinar',
        'meetup', 'summit', 'symposium', 'networking', 'tech talk',
        'presentation', 'demo day'
      ]
    };

    // High-priority keywords that indicate urgent emails
    this.priorityKeywords = {
      high: [
        'urgent', 'asap', 'immediate', 'deadline today', 'expires today',
        'last chance', 'final reminder', 'action required', 'time sensitive'
      ],
      medium: [
        'deadline', 'reminder', 'important', 'please review',
        'response needed', 'follow up', 'expires soon'
      ]
    };
  }

  async filterEmail(emailData) {
    try {
      const { subject, body, sender } = emailData;
      const fullText = `${subject} ${body.text || ''} ${sender.email}`.toLowerCase();

      // Apply keyword-based filtering
      const keywordResults = this.applyKeywordFiltering(fullText);

      // Apply ML prediction if enabled
      let mlResults = null;
      if (process.env.ML_API_ENABLED === 'true') {
        try {
          mlResults = await this.getMlPrediction(emailData);
        } catch (error) {
          console.warn('ML prediction failed, using keyword-based filtering only:', error.message);
        }
      }

      // Combine results
      const finalResults = this.combineResults(keywordResults, mlResults);

      return {
        tags: finalResults.tags,
        priority: finalResults.priority,
        isImportant: finalResults.isImportant,
        mlPrediction: mlResults
      };
    } catch (error) {
      console.error('Error filtering email:', error);
      return {
        tags: [],
        priority: 'low',
        isImportant: false,
        mlPrediction: null
      };
    }
  }

  applyKeywordFiltering(text) {
    const tags = [];
    let priority = 'low';
    let isImportant = false;

    // Check for category keywords
    for (const [category, keywords] of Object.entries(this.keywords)) {
      const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
      
      if (matches.length > 0) {
        tags.push({
          label: this.getCategoryLabel(category),
          category: category,
          confidence: Math.min(matches.length * 0.3, 1.0)
        });

        // Mark as important if it matches opportunity categories
        if (['opportunities', 'scholarships', 'jobs'].includes(category)) {
          isImportant = true;
        }
      }
    }

    // Check for priority keywords
    for (const [level, keywords] of Object.entries(this.priorityKeywords)) {
      const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
      if (matches.length > 0) {
        priority = level;
        isImportant = true;
        break;
      }
    }

    // Additional heuristics
    if (text.includes('deadline') && this.containsDateInNearFuture(text)) {
      priority = 'high';
      isImportant = true;
    }

    return { tags, priority, isImportant };
  }

  async getMlPrediction(emailData) {
    try {
      const response = await axios.post(`${process.env.ML_API_URL}/predict`, {
        subject: emailData.subject,
        body: emailData.body.text || '',
        sender: emailData.sender.email
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('ML API request failed:', error.message);
      throw error;
    }
  }

  combineResults(keywordResults, mlResults) {
    let finalTags = [...keywordResults.tags];
    let finalPriority = keywordResults.priority;
    let finalIsImportant = keywordResults.isImportant;

    // If ML results are available, combine them
    if (mlResults) {
      // Use ML prediction for importance if confidence is high
      if (mlResults.confidence > 0.7) {
        finalIsImportant = mlResults.isImportant;
      }

      // Add ML-predicted categories as tags
      if (mlResults.categories) {
        for (const category of mlResults.categories) {
          if (category.confidence > 0.5) {
            const existingTag = finalTags.find(tag => tag.category === category.name);
            if (!existingTag) {
              finalTags.push({
                label: this.getCategoryLabel(category.name),
                category: category.name,
                confidence: category.confidence
              });
            } else {
              // Update confidence with ML prediction
              existingTag.confidence = Math.max(existingTag.confidence, category.confidence);
            }
          }
        }
      }

      // Adjust priority based on ML confidence
      if (mlResults.isImportant && mlResults.confidence > 0.8) {
        finalPriority = 'high';
      }
    }

    return {
      tags: finalTags,
      priority: finalPriority,
      isImportant: finalIsImportant
    };
  }

  getCategoryLabel(category) {
    const labels = {
      opportunities: 'Opportunity',
      hackathons: 'Hackathon',
      contests: 'Contest',
      scholarships: 'Scholarship',
      jobs: 'Job',
      events: 'Event'
    };
    return labels[category] || category;
  }

  containsDateInNearFuture(text) {
    // Simple heuristic to check if text contains dates in near future
    const datePatterns = [
      /\b(today|tomorrow|this week|next week)\b/i,
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i
    ];

    return datePatterns.some(pattern => pattern.test(text));
  }

  // Method to update keywords dynamically
  updateKeywords(category, newKeywords) {
    if (this.keywords[category]) {
      this.keywords[category] = [...new Set([...this.keywords[category], ...newKeywords])];
    }
  }

  // Method to get filtering statistics
  getFilteringStats(emails) {
    const stats = {
      total: emails.length,
      important: 0,
      categories: {}
    };

    emails.forEach(email => {
      if (email.isImportant) stats.important++;
      
      email.tags.forEach(tag => {
        if (!stats.categories[tag.category]) {
          stats.categories[tag.category] = 0;
        }
        stats.categories[tag.category]++;
      });
    });

    return stats;
  }
}

module.exports = new FilterService();