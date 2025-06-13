import { Email } from '../types/email';

export const mockEmails: Email[] = [
  {
    id: '1',
    subject: 'Google Summer of Code 2024 - Applications Now Open!',
    sender: {
      name: 'Google Open Source',
      email: 'opensource@google.com',
      avatar: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    date: '2024-01-15T09:30:00Z',
    preview: 'Join thousands of students contributing to open source projects with mentorship from experienced developers. Applications open until March 15th...',
    isImportant: true,
    isRead: false,
    priority: 'high',
    tags: [
      { label: 'Internship', category: 'opportunities' },
      { label: 'Open Source', category: 'opportunities' },
      { label: 'Google', category: 'opportunities' }
    ]
  },
  {
    id: '2',
    subject: 'HackMIT 2024 Registration Opens Tomorrow!',
    sender: {
      name: 'HackMIT Team',
      email: 'team@hackmit.org',
      avatar: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    date: '2024-01-14T15:45:00Z',
    preview: 'Get ready for the biggest hackathon at MIT! Registration opens tomorrow at 12 PM EST. Limited spots available for this premier coding competition...',
    isImportant: false,
    isRead: true,
    priority: 'high',
    tags: [
      { label: 'Hackathon', category: 'hackathons' },
      { label: 'MIT', category: 'hackathons' },
      { label: 'Competition', category: 'contests' }
    ]
  },
  {
    id: '3',
    subject: 'Microsoft Imagine Cup 2024 - $100K Prize Pool',
    sender: {
      name: 'Microsoft Student Partners',
      email: 'imaginecup@microsoft.com',
      avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    date: '2024-01-13T11:20:00Z',
    preview: "The world's premier student technology competition is back! Create innovative solutions using Microsoft technologies and compete for prizes up to $100,000...",
    isImportant: true,
    isRead: false,
    priority: 'medium',
    tags: [
      { label: 'Competition', category: 'contests' },
      { label: 'Microsoft', category: 'contests' },
      { label: 'Prize Money', category: 'contests' }
    ]
  },
  {
    id: '4',
    subject: 'Gates Millennium Scholarship - Application Deadline Extended',
    sender: {
      name: 'Gates Foundation',
      email: 'scholars@gatesfoundation.org',
      avatar: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    date: '2024-01-12T08:15:00Z',
    preview: 'Due to high demand, we are extending the application deadline for the Gates Millennium Scholarship program. Full tuition coverage for outstanding minority students...',
    isImportant: true,
    isRead: true,
    priority: 'high',
    tags: [
      { label: 'Scholarship', category: 'scholarships' },
      { label: 'Full Funding', category: 'scholarships' },
      { label: 'Gates Foundation', category: 'scholarships' }
    ]
  },
  {
    id: '5',
    subject: 'Software Engineering Internship - Meta Summer 2024',
    sender: {
      name: 'Meta University Recruiting',
      email: 'university@meta.com',
      avatar: 'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    date: '2024-01-11T14:30:00Z',
    preview: 'Join our software engineering internship program at Meta! Work on cutting-edge projects in AR/VR, social platforms, and AI. Competitive compensation and mentorship...',
    isImportant: false,
    isRead: false,
    priority: 'medium',
    tags: [
      { label: 'Internship', category: 'jobs' },
      { label: 'Meta', category: 'jobs' },
      { label: 'Software Engineering', category: 'jobs' }
    ]
  },
  {
    id: '6',
    subject: 'AWS re:Invent Student Challenge 2024',
    sender: {
      name: 'Amazon Web Services',
      email: 'student-programs@aws.com',
      avatar: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    date: '2024-01-10T10:45:00Z',
    preview: 'Build the next generation of cloud applications! The AWS re:Invent Student Challenge offers students the chance to showcase their cloud computing skills...',
    isImportant: false,
    isRead: true,
    priority: 'low',
    tags: [
      { label: 'Cloud Computing', category: 'contests' },
      { label: 'AWS', category: 'contests' },
      { label: 'Technical Challenge', category: 'contests' }
    ]
  },
  {
    id: '7',
    subject: 'TechCrunch Disrupt Startup Competition - Early Bird Ends Soon',
    sender: {
      name: 'TechCrunch Events',
      email: 'events@techcrunch.com',
      avatar: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    date: '2024-01-09T16:00:00Z',
    preview: 'Pitch your startup to top VCs and tech leaders at TechCrunch Disrupt! Early bird registration ends this Friday. Student teams get special pricing and mentorship...',
    isImportant: true,
    isRead: false,
    priority: 'medium',
    tags: [
      { label: 'Startup Competition', category: 'contests' },
      { label: 'TechCrunch', category: 'events' },
      { label: 'Pitch', category: 'events' }
    ]
  },
  {
    id: '8',
    subject: 'NSF Graduate Research Fellowship Program - Application Tips',
    sender: {
      name: 'National Science Foundation',
      email: 'grfp@nsf.gov',
      avatar: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    date: '2024-01-08T13:20:00Z',
    preview: 'The NSF GRFP provides three years of financial support for graduate study in STEM fields. Here are expert tips to strengthen your application...',
    isImportant: false,
    isRead: true,
    priority: 'medium',
    tags: [
      { label: 'Graduate Fellowship', category: 'scholarships' },
      { label: 'NSF', category: 'scholarships' },
      { label: 'Research Funding', category: 'scholarships' }
    ]
  },
  {
    id: '9',
    subject: 'GitHub Copilot Student Developer Pack - Free Access',
    sender: {
      name: 'GitHub Education',
      email: 'education@github.com',
      avatar: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=150&h-150&dpr=2'
    },
    date: '2024-01-07T12:10:00Z',
    preview: 'Get free access to GitHub Copilot and other premium developer tools through the GitHub Student Developer Pack. Plus, exclusive opportunities with partner companies...',
    isImportant: false,
    isRead: false,
    priority: 'low',
    tags: [
      { label: 'Developer Tools', category: 'opportunities' },
      { label: 'GitHub', category: 'opportunities' },
      { label: 'Free Access', category: 'opportunities' }
    ]
  },
  {
    id: '10',
    subject: 'AI for Good Global Summit - Student Ambassador Program',
    sender: {
      name: 'International Telecommunication Union',
      email: 'ai4good@itu.int',
      avatar: 'https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    date: '2024-01-06T09:35:00Z',
    preview: 'Join the UN AI for Good Global Summit as a student ambassador. Network with world leaders, participate in workshops, and showcase AI solutions for social impact...',
    isImportant: true,
    isRead: true,
    priority: 'high',
    tags: [
      { label: 'UN Summit', category: 'events' },
      { label: 'AI for Good', category: 'events' },
      { label: 'Ambassador Program', category: 'opportunities' }
    ]
  }
];