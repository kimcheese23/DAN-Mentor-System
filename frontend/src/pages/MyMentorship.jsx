import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMentorships } from '../services/mentorshipService';
import { MentorshipCard } from '../components/MentorshipCard';
import Pagination from '../components/Pagination';

export const MyMentorship = ({ onSelect }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const role = searchParams.get('role') || 'mentee';
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const statusTabs = [
    { key: '', label: 'Tất cả' },
    { key: 'ACTIVE', label: 'Đang hoạt động' },
    { key: 'COMPLETED', label: 'Đã hoàn thành' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  useEffect(() => {
    const fetchMentorships = async () => {
      setLoading(true);
      try {
        const data = await getMentorships(role, status, page);
        if (Array.isArray(data)) {
          setMentorships(data);
          setTotalPages(1);
        } else {
          setMentorships(data.results || []);
          const count = data.count || 0;
          setTotalPages(Math.ceil(count / 8));
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách mentorship:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorships();
  }, [role, status, page]);

  const updateParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) updated.set(key, value);
      else updated.delete(key);
    });
    setSearchParams(updated);
  };

  const handleRoleChange = (newRole) => {
    updateParams({ role: newRole, status: '', page: 1 });
  };

  const handleStatusChange = (newStatus) => {
    updateParams({ status: newStatus, page: 1 });
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
  };

  return (
    <div className="container py-4">
      <div className="bg-light p-1 rounded-3 mb-4 d-flex" style={{ maxWidth: '400px' }}>
        <button
          className={`btn flex-fill rounded-3 fw-bold ${role === 'mentee' ? 'btn-white shadow-sm text-primary' : 'text-secondary'}`}
          onClick={() => handleRoleChange('mentee')}
        >
          Tôi là Mentee
        </button>
        <button
          className={`btn flex-fill rounded-3 fw-bold ${role === 'mentor' ? 'btn-white shadow-sm text-primary' : 'text-secondary'}`}
          onClick={() => handleRoleChange('mentor')}
        >
          Tôi là Mentor
        </button>
      </div>

      <div className="d-flex gap-2 mb-4 overflow-auto pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            className={`btn btn-sm rounded-pill px-3 ${status === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handleStatusChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : mentorships.length === 0 ? (
        <div className="alert alert-light text-center border">
          Bạn chưa có kết nối nào ở đây.
        </div>
      ) : (
        <>
          <div className="row g-3">
            {mentorships.map((item) => (
              <div key={item.id} className="col-12 col-md-6 col-lg-4">
                <MentorshipCard
                  item={item}
                  currentRole={role}
                  currentStatus={status}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};