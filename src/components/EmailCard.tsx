import React from 'react';
import { 
  Star, 
  Clock, 
  ExternalLink, 
  Calendar, 
  MoreVertical,
  Mail,
  AlertCircle
} from 'lucide-react';
import { Email } from '../types/email';

interface EmailCardProps {
  email: Email;
  onMarkImportant: (emailId: string) => void;
  onSetReminder: (email: Email) => void;
}

const EmailCard: React.FC<EmailCardProps> = ({ 
  email, 
  onMarkImportant, 
  onSetReminder 
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      default: return 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10';
    }
  };

  const getTagColor = (category: string) => {
    const colors = {
      opportunities: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      hackathons: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      contests: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      scholarships: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      jobs: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      events: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const emailDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - emailDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return emailDate.toLocaleDateString();
  };

  return (
    <div className={`card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border-l-4 ${getPriorityColor(email.priority)} border-r border-t border-b border-gray-200 dark:border-gray-700 p-6 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          <img
            src={email.sender.avatar}
            alt={email.sender.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {email.sender.name}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {email.sender.email}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{timeAgo(email.date)}</span>
              {email.priority === 'high' && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 font-medium">High Priority</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onMarkImportant(email.id)}
            className={`p-2 rounded-lg transition-colors ${
              email.isImportant
                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
            }`}
          >
            <Star className={`w-5 h-5 ${email.isImportant ? 'fill-current' : ''}`} />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
          {email.subject}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
          {email.preview}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {email.tags.map((tag, index) => (
          <span
            key={index}
            className={`px-3 py-1 rounded-full text-xs font-medium ${getTagColor(tag.category)}`}
          >
            {tag.label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => onSetReminder(email)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors text-sm font-medium"
          >
            <Calendar className="w-4 h-4" />
            <span>Remind Me</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
            <Mail className="w-4 h-4" />
            <span>Reply</span>
          </button>
        </div>
        
        <button className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors text-sm font-medium">
          <span>Open Email</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EmailCard;