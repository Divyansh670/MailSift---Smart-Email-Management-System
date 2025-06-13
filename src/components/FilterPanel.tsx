import React from 'react';
import { 
  Briefcase, 
  Code, 
  Trophy, 
  GraduationCap, 
  Users, 
  Calendar,
  Filter,
  CheckCircle
} from 'lucide-react';
import { EmailFilter } from '../types/email';

interface FilterPanelProps {
  activeFilters: EmailFilter[];
  onFiltersChange: (filters: EmailFilter[]) => void;
  emailCounts: Record<string, number>;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  activeFilters, 
  onFiltersChange, 
  emailCounts 
}) => {
  const filterOptions = [
    { 
      id: 'all' as EmailFilter, 
      label: 'All Emails', 
      icon: <Filter className="w-5 h-5" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      count: emailCounts.all 
    },
    { 
      id: 'opportunities' as EmailFilter, 
      label: 'Opportunities', 
      icon: <Briefcase className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      count: emailCounts.opportunities 
    },
    { 
      id: 'hackathons' as EmailFilter, 
      label: 'Hackathons', 
      icon: <Code className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      count: emailCounts.hackathons 
    },
    { 
      id: 'contests' as EmailFilter, 
      label: 'Contests', 
      icon: <Trophy className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      count: emailCounts.contests 
    },
    { 
      id: 'scholarships' as EmailFilter, 
      label: 'Scholarships', 
      icon: <GraduationCap className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      count: emailCounts.scholarships 
    },
    { 
      id: 'jobs' as EmailFilter, 
      label: 'Jobs', 
      icon: <Users className="w-5 h-5" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      count: emailCounts.jobs 
    },
    { 
      id: 'events' as EmailFilter, 
      label: 'Events', 
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      count: emailCounts.events 
    },
  ];

  const handleFilterClick = (filterId: EmailFilter) => {
    if (filterId === 'all') {
      onFiltersChange(['all']);
    } else {
      let newFilters: EmailFilter[];
      
      if (activeFilters.includes('all')) {
        newFilters = [filterId];
      } else if (activeFilters.includes(filterId)) {
        newFilters = activeFilters.filter(f => f !== filterId);
        if (newFilters.length === 0) {
          newFilters = ['all'];
        }
      } else {
        newFilters = [...activeFilters, filterId];
      }
      
      onFiltersChange(newFilters);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
        <Filter className="w-5 h-5" />
        <span>Filters</span>
      </h3>
      
      <div className="space-y-2">
        {filterOptions.map((option) => {
          const isActive = activeFilters.includes(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => handleFilterClick(option.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                isActive
                  ? `${option.bgColor} ${option.color} shadow-md`
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isActive && option.id !== 'all' && (
                  <CheckCircle className="w-4 h-4" />
                )}
                <div className={`p-1 rounded ${isActive ? 'bg-white/20' : ''}`}>
                  {option.icon}
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
              <span className={`text-sm px-2 py-1 rounded-full ${
                isActive 
                  ? 'bg-white/20 text-current' 
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {option.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <div className="flex justify-between">
            <span>Total Filtered:</span>
            <span className="font-medium">
              {activeFilters.includes('all') 
                ? emailCounts.all 
                : activeFilters.reduce((sum, filter) => sum + (emailCounts[filter] || 0), 0)
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span>Unread:</span>
            <span className="font-medium text-primary-600">23</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;