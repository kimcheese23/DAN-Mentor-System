import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TaskList } from '../components/TaskList';
import Pagination from '../components/Pagination';
import { MilestoneModal } from '../components/MilestoneModal';
import {
  deleteMilestone, getMentorshipDetail, getMentorshipProgress,
  getMilestones, cancelMentorship, completeMentorship
} from '../services/mentorshipService';
import ScheduleModal from '../components/ScheduleModal';
import { Button } from 'react-bootstrap';

export const Roadmap = () => {
  const { id: mentorshipId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const previousPage = useLocation().state?.from;
  const [milestones, setMilestones] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [mentorship, setMentorship] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openMilestoneId, setOpenMilestoneId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const isMentor = Number(user?.id) === Number(mentorship?.mentor);
  const isReadOnly = mentorship?.status !== 'ACTIVE';
  const partnerName = isMentor ? mentorship?.mentee_name : mentorship?.mentor_name;
  const partnerRole = isMentor ? 'Mentee' : 'Mentor';
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleRefreshSchedules = () => {
    console.log('Lịch hẹn đã tạo thành công, tiến hành làm mới danh sách!');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [detailRes, progressRes, milestoneRes] = await Promise.all([
        getMentorshipDetail(mentorshipId),
        getMentorshipProgress(mentorshipId),
        getMilestones(mentorshipId, page)
      ]);

      setMentorship(detailRes);
      setProgressData(progressRes.progress);

      const list = Array.isArray(milestoneRes) ? milestoneRes : milestoneRes.results || [];
      setMilestones(list);
      setTotalPages(Array.isArray(milestoneRes) ? 1 : Math.ceil((milestoneRes.count || 0) / 8));
      if (list.length > 0 && !openMilestoneId) setOpenMilestoneId(list[0].id);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    Promise.resolve().then(() => fetchData());
  }, [mentorshipId, page]);

  const handleBack = () => previousPage ? nav(previousPage) : (window.history.length > 2 ? nav(-1) : nav('/mentorships'));

  const handleAction = async (actionFn, msg) => {
    if (!window.confirm(msg)) return;
    try {
      await actionFn(mentorshipId);
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi thao tác'); }
  };

  const handleDeleteMilestone = (id) => handleAction(() => deleteMilestone(id), 'Xóa chặng này sẽ xóa tất cả task bên trong. Tiếp tục?');

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none p-0 mb-3 text-secondary" onClick={handleBack}>&larr; Quay lại</button>

      {mentorship?.status === 'COMPLETED' && <div className="alert alert-success py-2"> <strong>Đã hoàn thành!</strong> Lộ trình ở chế độ chỉ xem.</div>}
      {mentorship?.status === 'CANCELLED' && <div className="alert alert-secondary py-2"><strong>Đã bị hủy!</strong> Lộ trình ở chế độ chỉ xem.</div>}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Lộ trình Mentoring</h4>
        {!isReadOnly && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => handleAction(cancelMentorship, 'Hủy kết nối này?')}>Hủy kết nối</button>
            {isMentor && <button className="btn btn-success btn-sm rounded-pill" onClick={() => handleAction(completeMentorship, 'Xác nhận hoàn thành?')}>Hoàn thành Mentoring</button>}
          </div>
        )}
      </div>
      {mentorship && (
      <div>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <p>
              {partnerRole}: {partnerName || 'Đang tải...'}
              <br />
              Mục tiêu: {mentorship.goal || 'Chưa cập nhật mục tiêu cụ thể.'}
            </p>
            <p className="small text-muted">
              Ngày bắt đầu: {mentorship.started_at ? new Date(mentorship.started_at).toLocaleDateString('vi-VN') : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    )}

    <div>
      <Button 
        variant="primary" 
        onClick={() => setShowScheduleModal(true)}
        className="d-flex align-items-center gap-2"
      >Tạo lịch hẹn
      </Button>

      <ScheduleModal
        show={showScheduleModal}
        handleClose={() => setShowScheduleModal(false)}
        mentorshipId={mentorshipId}
        onSuccess={handleRefreshSchedules}
      />
    </div>

      {progressData && (
        <div className="card shadow-sm border-0 mb-4 p-3 rounded-3">
          <div className="d-flex justify-content-between mb-2"><span className="fw-bold text-primary">Tiến độ</span><span>{progressData.progress}%</span></div>
          <div className="progress mb-2" style={{ height: '10px' }}>
            <div className="progress-bar bg-success" style={{ width: `${progressData.progress}%` }}></div>
          </div>
          <div className="d-flex justify-content-around text-center small pt-2 border-top">
            <div>Tổng nhiệm vụ: <strong>{progressData.total_tasks}</strong></div>
            <div>Nhiệm vụ đã hoàn thành: <strong className="text-success">{progressData.completed_tasks}</strong></div>
            <div>Đang thực hiện: <strong className="text-primary">{progressData.pending_tasks}</strong></div>
          </div>
        </div>
      )}

      {!isReadOnly && (
        <div className="d-flex gap-2">
          {isMentor && <button className="btn btn-primary btn-sm rounded-pill" onClick={() => { setEditingMilestone(null); setShowModal(true); }}>Tạo chặng mới</button>}
        </div>
      )}

      {loading ? <div className="text-center py-4"><div className="spinner-border text-primary"></div></div> : milestones.map((ms) => (
        <div key={ms.id} className="card shadow-sm border-0 mb-3 rounded-3">
          <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }} onClick={() => setOpenMilestoneId(
              openMilestoneId === ms.id ? null : ms.id)}>
            <div>
              <h6 className="fw-bold text-primary mb-0">Chặng {ms.order}: {ms.title}</h6>
              <small className="text-secondary">{ms.description}</small>
            </div>
            <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
              {isMentor && !isReadOnly && (
                <>
                  <button className="btn btn-sm btn-light border py-0" onClick={() => { setEditingMilestone(ms); setShowModal(true); }}>Sửa</button>
                  <button className="btn btn-sm btn-outline-danger py-0" onClick={() => handleDeleteMilestone(ms.id)}>Xóa</button>
                </>
              )}
            </div>
          </div>
          {openMilestoneId === ms.id && (
            <div className="card-body pt-0 border-top">
              <TaskList milestoneId={ms.id} isMentor={isMentor} isReadOnly={isReadOnly} onTaskUpdated={fetchData} />
            </div>
          )}
        </div>
      ))}

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
      <MilestoneModal isOpen={showModal} mentorshipId={mentorshipId} onClose={() => setShowModal(false)} editingMilestone={editingMilestone} onSuccess={fetchData} />
    </div>
  );
};