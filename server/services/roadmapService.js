const fs = require('fs');
const path = require('path');

const PROCESSED_DIR = path.join(__dirname, '..', '..', 'Datasets', 'processed');

const generateRoadmap = (targetRole, studentSkills = []) => {
  const normalizedRole = (targetRole || 'Full Stack Developer').toLowerCase();

  const phases = [
    {
      phaseNumber: 1,
      phaseName: 'Foundation & Core Fundamentals',
      durationWeeks: 6,
      focusAreas: ['Data Structures & Algorithms', 'Version Control (Git)', 'Core Programming'],
      milestones: [
        {
          id: 'm-1-1',
          title: 'Master Linear & Non-linear Data Structures',
          description: 'Arrays, Linked Lists, Trees, Graphs, Hash Maps in your primary language.',
          skillsGained: ['Data Structures', 'Algorithms', 'Complexity Analysis'],
          completed: true,
          recommendedCourses: ['Algorithms, Part I (Princeton)', 'Data Structures Specialization (Coursera)']
        },
        {
          id: 'm-1-2',
          title: 'Professional Git & GitHub Workflows',
          description: 'Branching, PRs, Merge Conflict resolution, and CI/CD basics.',
          skillsGained: ['Git', 'GitHub', 'CI/CD Basics'],
          completed: true,
          recommendedCourses: ['Version Control with Git (Meta)']
        }
      ]
    },
    {
      phaseNumber: 2,
      phaseName: 'Domain Specialization & Applied Technologies',
      durationWeeks: 8,
      focusAreas: normalizedRole.includes('data') || normalizedRole.includes('ai') || normalizedRole.includes('ml')
        ? ['Pandas & NumPy', 'Machine Learning Models', 'Feature Engineering']
        : ['Frontend Frameworks (React)', 'Backend API Architecture (Node.js)', 'Databases (SQL & MongoDB)'],
      milestones: [
        {
          id: 'm-2-1',
          title: 'Build Full-fledged Full-Stack Application',
          description: 'Design RESTful APIs, JWT Auth, Database schema, and dynamic reactive UI.',
          skillsGained: ['React', 'Node.js', 'Express', 'MongoDB'],
          completed: false,
          recommendedCourses: ['Full-Stack Web Development with React Specialization']
        },
        {
          id: 'm-2-2',
          title: 'State Management & Async API Pipelines',
          description: 'Implement complex state with Redux/Zustand and optimized caching.',
          skillsGained: ['State Management', 'REST APIs', 'Web Optimization'],
          completed: false,
          recommendedCourses: ['Advanced React and Redux']
        }
      ]
    },
    {
      phaseNumber: 3,
      phaseName: 'Advanced Architecture, Cloud & Deployment',
      durationWeeks: 6,
      focusAreas: ['Docker & Containerization', 'Cloud Deployment (AWS/Vercel)', 'System Design'],
      milestones: [
        {
          id: 'm-3-1',
          title: 'Containerize and Deploy to Cloud Architecture',
          description: 'Write Dockerfiles, orchestrate with Docker Compose, deploy to AWS ECS/EC2.',
          skillsGained: ['Docker', 'AWS', 'Linux'],
          completed: false,
          recommendedCourses: ['AWS Certified Cloud Practitioner Essentials']
        },
        {
          id: 'm-3-2',
          title: 'System Design and High-Availability Engineering',
          description: 'Load balancing, database sharding, caching with Redis, microservices patterns.',
          skillsGained: ['System Design', 'Redis', 'Microservices'],
          completed: false,
          recommendedCourses: ['Scalable Microservices with Kubernetes']
        }
      ]
    },
    {
      phaseNumber: 4,
      phaseName: 'Placement Readiness & Mock Technical Interviews',
      durationWeeks: 4,
      focusAreas: ['LeetCode Medium/Hard Problems', 'Resume Polish', 'Mock Interviews'],
      milestones: [
        {
          id: 'm-4-1',
          title: 'Solve 150+ Curated DSA Questions',
          description: 'Focus on Dynamic Programming, Graphs, Two Pointers, and Binary Search.',
          skillsGained: ['Problem Solving', 'Competitive Programming'],
          completed: false,
          recommendedCourses: ['Master the Coding Interview: Data Structures + Algorithms']
        },
        {
          id: 'm-4-2',
          title: 'Resume ATS Optimization & Alumni Referral Prep',
          description: 'Align resume with job descriptions, connect with 5+ alumni for referrals.',
          skillsGained: ['Resume Strategy', 'Networking', 'Behavioral Interviews'],
          completed: false,
          recommendedCourses: ['Career Success Specialization']
        }
      ]
    }
  ];

  return {
    targetRole,
    estimatedDurationMonths: 6,
    totalMilestones: 8,
    completedMilestones: 2,
    progressPercentage: 25,
    phases
  };
};

module.exports = { generateRoadmap };
