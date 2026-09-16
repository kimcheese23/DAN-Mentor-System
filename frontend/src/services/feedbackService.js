import api, { endpoints } from './api';

export const createFeedback = async (mentorshipId, data) => {
  const res = await api.post(endpoints.createFeedback(mentorshipId), data);
  return res.data;
};

export const getMentorFeedbacks = async (mentorId, page = 1) => {
  const res = await api.get(`${endpoints.mentorFeedbacks(mentorId)}?page=${page}`);
  return res.data;
};