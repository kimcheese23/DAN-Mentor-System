import api, { endpoints } from './api';

export const getSchedules = async (mentorshipId, page = 1) => {
  const res = await api.get(`${endpoints.schedules(mentorshipId)}?page=${page}`);
  return res.data;
};

export const getMySchedules = async (page = 1, status = '') => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (status) params.append('status', status);

  const res = await api.get(`${endpoints.mySchedules}?${params.toString()}`);
  return res.data;
};

export const createSchedule = async (mentorshipId, data) => {
  const res = await api.post(endpoints.schedules(mentorshipId), data);
  return res.data;
};

export const updateSchedule = async (id, data) => {
  const res = await api.patch(endpoints.scheduleDetail(id), data);
  return res.data;
};

export const cancelSchedule = async (id) => {
  const res = await api.post(endpoints.cancelSchedule(id));
  return res.data;
};

export const completeSchedule = async (id) => {
  const res = await api.post(endpoints.completeSchedule(id));
  return res.data;
};