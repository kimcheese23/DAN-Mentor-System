import { useState } from 'react';
import { createFeedback } from '../services/feedbackService';

export default function FeedbackModal({ show, handleClose, mentorshipId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createFeedback(mentorshipId, { rating: Number(rating), comment });
      alert('Gửi đánh giá thành công!');
      
      // Reset form sau khi gửi thành công
      setComment('');
      setRating(5);
      
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-3 shadow">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Đánh giá Mentor</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Đánh giá</label>
                <select 
                  className="form-select" 
                  value={rating} 
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Rất tốt)</option>
                  <option value={4}>⭐⭐⭐⭐ (Tốt)</option>
                  <option value={3}>⭐⭐⭐ (Bình thường)</option>
                  <option value={2}>⭐⭐ (Tệ)</option>
                  <option value={1}>⭐ (Rất tệ)</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Nhận xét</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Chia sẻ trải nghiệm của bạn về Mentor này..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm rounded-pill" 
                onClick={handleClose}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-sm rounded-pill" 
                disabled={submitting}
              >
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}