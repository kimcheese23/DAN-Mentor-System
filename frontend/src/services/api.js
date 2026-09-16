import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const endpoints = {
  login: '/auth/login/',
  google: '/auth/google/login/',
  logout: '/auth/logout/',
  me: '/auth/me/',
  register: '/auth/register/',
  education: '/profile/educations/',
  career: '/profile/careers/',
  skill: '/profile/skills/',
  mySkill: '/profile/me/skills/',
  mentor: '/profile/mentor/',
  mentorSubmit: '/profile/mentor/submit/',
  mentorAvailability: '/profile/mentor/availability/',
  mentorsDiscovery: '/profile/mentors/',
  recommendMentors: '/profile/mentors/recommend/',
  mentorDetail: (id) => `/profile/mentors/${id}/`,

  mentorships: '/mentorship/mentorships/',
  requests: '/mentorship/requests/',
  
  mentorshipDetail: (id) => `/mentorship/mentorships/${id}/`,
  mentorshipProgress: (id) => `/mentorship/mentorships/${id}/progress/`,
  milestones: (mentorshipId) => `/mentorship/mentorships/${mentorshipId}/milestones/`,
  milestoneDetail: (id) => `/mentorship/milestones/${id}/`,
  tasks: (milestoneId) => `/mentorship/milestones/${milestoneId}/tasks/`,
  taskDetail: (id) => `/mentorship/tasks/${id}/`,
  completeTask: (taskId) => `/mentorship/tasks/${taskId}/complete/`,

  schedules: (mentorshipId) => `/mentorship/mentorships/${mentorshipId}/schedules/`,
  scheduleDetail: (id) => `/mentorship/schedules/${id}/`,
  cancelSchedule: (id) => `/mentorship/schedules/${id}/cancel/`,
  completeSchedule: (id) => `/mentorship/schedules/${id}/complete/`,
  mySchedules: '/mentorship/my-schedules/',

  createFeedback: (mentorshipId) => `/mentorship/mentorships/${mentorshipId}/feedback/`,
  mentorFeedbacks: (mentorId) => `/mentorship/mentors/${mentorId}/feedbacks/`,

  chatConversations: '/chat/conversations/',
  chatMessages: (id) => `/chat/conversations/${id}/messages/`,
};

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = () => api;
export default api;