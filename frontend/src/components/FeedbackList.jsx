import { useState, useEffect, useCallback } from 'react';
import { getMentorFeedbacks } from '../services/feedbackService';
import Pagination from './Pagination';

export default function FeedbackList({ mentorId }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ total_feedbacks: 0, average_rating: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadFeedbacks = useCallback(async () => {
    if (!mentorId) return;
    setLoading(true);
    try {
      const res = await getMentorFeedbacks(mentorId, page);
      setStats(res.stats || { total_feedbacks: 0, average_rating: 0 });
      setFeedbacks(Array.isArray(res.results) ? res.results : (Array.isArray(res) ? res : []));
      
      if (res.total_pages) {
        setTotalPages(res.total_pages);
      } else if (res.count) {
        setTotalPages(Math.ceil(res.count / 8)); 
      }
    } catch (err) {
      console.error('Lỗi tải đánh giá:', err);
    } finally {
      setLoading(false);
    }
  }, [mentorId, page]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Đánh giá từ Mentee</h5>
        <div className="text-end">
          <span className="fs-4 fw-bold text-warning">⭐ {stats.average_rating || 0}</span>
          <small className="text-muted d-block">({stats.total_feedbacks || 0} đánh giá)</small>
        </div>
      </div>

      {loading ? (
        <p className="text-muted small">Đang tải đánh giá...</p>
      ) : feedbacks.length === 0 ? (
        <p className="text-muted small">Mentor chưa có đánh giá nào.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {feedbacks.map((fb, idx) => {
            const starCount = Math.round(Number(fb.rating) || 5);

            return (
              <div key={fb.id || idx} className="border-bottom pb-2">
                <div className="d-flex justify-content-between">
                  <strong className="small">
                    {fb.mentee || "Mentee"} | {"⭐".repeat(starCount)}
                  </strong>
                </div>
                <p className="small text-secondary mb-1">{fb.comment || 'Không có bình luận.'}</p>
                <small className="text-muted micro">
                  {fb.created_at ? new Date(fb.created_at).toLocaleDateString('vi-VN') : ''}
                </small>
              </div>
            );
          })}

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      )}
    </>
  );
}