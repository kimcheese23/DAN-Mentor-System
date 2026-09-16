import ScheduleSection from '../components/ScheduleSection';

export const SchedulePage = () => {
  return (
    <div className="container py-4">
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Quản lý Lịch hẹn</h4>
        <p className="text-muted small mb-0">Lên lịch và theo dõi các buổi trao đổi giữa Mentor và Mentee</p>
      </div>

      <div className="card border-0 shadow-sm p-3 rounded-3">

        <ScheduleSection />
      </div>
    </div>
  );
};