import api, { endpoints } from "./api";

export const sendRequest = async (payload) => {
  const res = await api.post(endpoints.requests, payload);
  return res.data;
};

export const getRequests = async (type, status, page = 1) => {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (status) params.append("status", status);
  if (page) params.append("page", page);

  const res = await api.get(`${endpoints.requests}?${params.toString()}`);
  return res.data;
};

export const acceptRequest = async (id) => {
  const res = await api.post(`${endpoints.requests}${id}/accept/`);
  return res.data;
};

export const rejectRequest = async (id) => {
  const res = await api.post(`${endpoints.requests}${id}/reject/`);
  return res.data;
};

export const cancelRequest = async (id) => {
  const res = await api.post(`${endpoints.requests}${id}/cancel/`);
  return res.data;
};

export const getMentorships = async (role, status, page = 1) => {
  const params = new URLSearchParams();
  if (role) params.append("role", role);
  if (status) params.append("status", status);
  if (page) params.append("page", page);

  const res = await api.get(`${endpoints.mentorships}?${params.toString()}`);
  return res.data;
};

export const getMentorshipDetail = async (id) => {
  const res = await api.get(endpoints.mentorshipDetail(id));
  return res.data;
};

export const cancelMentorship = async (id) => {
  const res = await api.post(`/mentorship/mentorships/${id}/cancel/`);
  return res.data;
};

export const completeMentorship = async (id) => {
  const res = await api.post(`/mentorship/mentorships/${id}/complete/`);
  return res.data;
};

export const getMentorshipProgress = async (id) => {
  const res = await api.get(endpoints.mentorshipProgress(id));
  return res.data;
};

export const getMilestones = async (mentorshipId, page = 1) => {
  const res = await api.get(`${endpoints.milestones(mentorshipId)}?page=${page}`);
  return res.data;
};

export const createMilestone = async (mentorshipId, data) => {
  const res = await api.post(endpoints.milestones(mentorshipId), data);
  return res.data;
};

export const updateMilestone = async (id, data) => {
  const res = await api.patch(endpoints.milestoneDetail(id), data);
  return res.data;
};

export const deleteMilestone = async (id) => {
  const res = await api.delete(endpoints.milestoneDetail(id));
  return res.data;
};

export const getTasks = async (milestoneId, page = 1) => {
  const res = await api.get(`${endpoints.tasks(milestoneId)}?page=${page}`);
  return res.data;
};

export const createTask = async (milestoneId, data) => {
  const res = await api.post(endpoints.tasks(milestoneId), data);
  return res.data;
};

export const completeTask = async (taskId) => {
  const res = await api.post(endpoints.completeTask(taskId));
  return res.data;
};

export const updateTask = async (id, data) => {
  const res = await api.patch(endpoints.taskDetail(id), data);
  return res.data;
};

export const deleteTask = async (id) => {
  const res = await api.delete(endpoints.taskDetail(id));
  return res.data;
};