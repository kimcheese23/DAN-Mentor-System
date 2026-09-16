import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cancelMentorship } from "../services/mentorshipService";
import FeedbackModal from "./FeedbackModal";

export const MentorshipCard = ({ 
  item = {}, 
  currentRole = 'mentee', 
  onStatusChanged = () => {}, 
  onSelect = () => {} 
}) => {
  const nav = useNavigate();
  const [showFBModal, setShowFBModal] = useState(false);
  if (!item || !item.id) return null;
  const partnerName = currentRole === 'mentee' ? item.mentor_name : item.mentee_name;
  const partnerRoleLabel = currentRole === 'mentee' ? 'Mentor' : 'Mentee';

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge bg-primary">Đang hoạt động</span>;
      case 'COMPLETED':
        return <span className="badge bg-success">Đã hoàn thành</span>;
      case 'CANCELLED':
        return <span className="badge bg-danger">Đã hủy</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const handleGoToRoadmap = () => {
    onSelect(item.id);
    nav(`/my-mentorship/${item.id}/roadmap`);
  };

  const handleCancel = async () => {
    if (!window.confirm(`Bạn có chắc muốn hủy kết nối với ${partnerName}?`)) return;
    try {
      await cancelMentorship(item.id);
      alert('Đã hủy kết nối thành công.');
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi hủy kết nối');
    }
  };

  return (
    <>
      <div className="card shadow-sm border-0 mb-3 rounded-3 h-100">
        <div className="card-body d-flex flex-column justify-content-between">
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted fw-bold">
                {partnerRoleLabel}: {partnerName || 'Chưa cập nhật'}
              </small>
              {renderStatusBadge(item.status)}
            </div>

            <h6 className="card-title fw-bold mb-1">
              Mục tiêu: {item.goal || 'Chưa cập nhật mục tiêu cụ thể.'}
            </h6>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
            <small className="text-muted">
              Bắt đầu: {item.started_at ? new Date(item.started_at).toLocaleDateString('vi-VN') : 'N/A'}
            </small>
            
            <div className="d-flex gap-2">
              {item.status === 'ACTIVE' && (
                <button 
                  className="btn btn-outline-danger btn-sm rounded-pill px-3"
                  onClick={handleCancel}
                >
                  Hủy kết nối
                </button>
              )}

              {item.status != 'ACTIVE' && currentRole === 'mentee' && !item.is_reviewed && (
                <button 
                  className="btn btn-warning btn-sm rounded-pill px-3" 
                  onClick={() => setShowFBModal(true)}
                >
                  Đánh giá Mentor
                </button>
              )}

              <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={handleGoToRoadmap}>
                Xem lộ trình
              </button>
            </div>
          </div>
        </div>
      </div>

      <FeedbackModal
        show={showFBModal}
        handleClose={() => setShowFBModal(false)}
        mentorshipId={item.id}
        onSuccess={() => {
          if (onStatusChanged) onStatusChanged();
        }}
      />
    </>
  );
};