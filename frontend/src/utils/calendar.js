export const makeGoogleCalendarLink = (schedule) => {
  if (!schedule) return '#';
  const { title, note, start_time, end_time, meeting_link } = schedule;

  const formatTime = (dateStr) => {
    return new Date(dateStr).toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const start = formatTime(start_time);
  const end = formatTime(end_time);

  const details = encodeURIComponent(
    `${note || ''}\n\nLink Video Call: ${meeting_link || 'Chưa có'}`
  );
  const location = encodeURIComponent(meeting_link || 'Online');
  const text = encodeURIComponent(title);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
};