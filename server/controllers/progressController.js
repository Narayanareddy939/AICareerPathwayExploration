const { successResponse, errorResponse } = require('../utils/response');

const getStudentProgress = (req, res) => {
  try {
    const progressData = {
      overallReadiness: 78,
      completedCoursesCount: 4,
      skillsAcquiredCount: 12,
      milestonesCompletedCount: 5,
      weeklyGoalTargetHours: 15,
      weeklyGoalCompletedHours: 12,
      timeline: [
        { month: 'Month 1', readiness: 42, skills: 4 },
        { month: 'Month 2', readiness: 55, skills: 7 },
        { month: 'Month 3', readiness: 68, skills: 10 },
        { month: 'Current', readiness: 78, skills: 12 }
      ],
      skillProficiency: [
        { skill: 'Data Structures & Algorithms', level: 85 },
        { skill: 'Python Programming', level: 90 },
        { skill: 'Full Stack Development', level: 75 },
        { skill: 'Machine Learning Basics', level: 70 },
        { skill: 'Cloud & Docker Deployment', level: 60 }
      ],
      recentActivities: [
        { id: 1, text: 'Completed Milestone: Master Graph Algorithms', date: '2 days ago' },
        { id: 2, text: 'Passed Mock Assessment: System Design Basics', date: '5 days ago' },
        { id: 3, text: 'Enrolled in: Deep Learning Specialization', date: '1 week ago' }
      ]
    };
    return successResponse(res, progressData, 'Progress data retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = { getStudentProgress };
