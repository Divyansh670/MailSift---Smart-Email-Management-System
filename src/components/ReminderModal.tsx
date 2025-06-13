import React, { useState } from 'react';
import { X, Clock, Calendar, Bell } from 'lucide-react';
import { Email } from '../types/email';

interface ReminderModalProps {
  email: Email;
  onClose: () => void;
  onSubmit: (reminderTime: string) => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ 
  email, 
  onClose, 
  onSubmit 
}) => {
  const [selectedTime, setSelectedTime] = useState('1hour');
  const [customTime, setCustomTime] = useState('');
  const [customDate, setCustomDate] = useState('');

  const quickOptions = [
    { id: '30min', label: '30 minutes', icon: <Clock className="w-4 h-4" /> },
    { id: '1hour', label: '1 hour', icon: <Clock className="w-4 h-4" /> },
    { id: '3hours', label: '3 hours', icon: <Clock className="w-4 h-4" /> },
    { id: '1day', label: 'Tomorrow', icon: <Calendar className="w-4 h-4" /> },
    { id: '3days', label: '3 days', icon: <Calendar className="w-4 h-4" /> },
    { id: '1week', label: '1 week', icon: <Calendar className="w-4 h-4" /> },
    { id: 'custom', label: 'Custom', icon: <Bell className="w-4 h-4" /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let reminderTime = selectedTime;
    
    if (selectedTime === 'custom') {
      if (customDate && customTime) {
        reminderTime = `${customDate} ${customTime}`;
      } else {
        return; // Don't submit if custom time is incomplete
      }
    }
    
    onSubmit(reminderTime);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Set Reminder
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Email Preview */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <img
              src={email.sender.avatar}
              alt={email.sender.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {email.subject}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                From {email.sender.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Remind me in:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {quickOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedTime(option.id)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${
                      selectedTime === option.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Time Inputs */}
            {selectedTime === 'custom' && (
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Date
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Time
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedTime === 'custom' && (!customDate || !customTime)}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Set Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;