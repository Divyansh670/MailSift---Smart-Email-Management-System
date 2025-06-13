import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import FilterPanel from '../components/FilterPanel';
import EmailCard from '../components/EmailCard';
import ReminderModal from '../components/ReminderModal';
import { Email, EmailFilter } from '../types/email';
import { mockEmails } from '../data/mockEmails';

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [activeFilters, setActiveFilters] = useState<EmailFilter[]>(['all']);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Simulate email loading
    setTimeout(() => {
      setEmails(mockEmails);
      setFilteredEmails(mockEmails);
      setLoading(false);
    }, 1000);
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let filtered = emails;

    // Apply category filters
    if (!activeFilters.includes('all')) {
      filtered = filtered.filter(email => 
        email.tags.some(tag => activeFilters.includes(tag.category as EmailFilter))
      );
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.preview.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
    });

    setFilteredEmails(filtered);
  }, [emails, activeFilters, searchQuery, sortBy]);

  const handleMarkImportant = (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId 
        ? { ...email, isImportant: !email.isImportant }
        : email
    ));
  };

  const handleSetReminder = (email: Email) => {
    setSelectedEmail(email);
    setShowReminderModal(true);
  };

  const handleReminderSubmit = (reminderTime: string) => {
    if (selectedEmail) {
      console.log(`Reminder set for email ${selectedEmail.id} at ${reminderTime}`);
      setShowReminderModal(false);
      setSelectedEmail(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Smart Inbox
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {filteredEmails.length} emails • {emails.filter(e => e.isImportant).length} marked important
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <FilterPanel
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
              emailCounts={{
                all: emails.length,
                opportunities: emails.filter(e => e.tags.some(t => t.category === 'opportunities')).length,
                hackathons: emails.filter(e => e.tags.some(t => t.category === 'hackathons')).length,
                contests: emails.filter(e => e.tags.some(t => t.category === 'contests')).length,
                scholarships: emails.filter(e => e.tags.some(t => t.category === 'scholarships')).length,
                jobs: emails.filter(e => e.tags.some(t => t.category === 'jobs')).length,
                events: emails.filter(e => e.tags.some(t => t.category === 'events')).length,
              }}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredEmails.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4m0 0V9m0 4h-4m4 0v3M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 00-2 2v3a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2M9 5V3" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No emails found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your filters or search terms.
                  </p>
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <EmailCard
                    key={email.id}
                    email={email}
                    onMarkImportant={handleMarkImportant}
                    onSetReminder={handleSetReminder}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showReminderModal && selectedEmail && (
        <ReminderModal
          email={selectedEmail}
          onClose={() => setShowReminderModal(false)}
          onSubmit={handleReminderSubmit}
        />
      )}
    </div>
  );
};

export default Dashboard;