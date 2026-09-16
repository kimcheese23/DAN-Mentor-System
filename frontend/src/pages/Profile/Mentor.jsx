import { useState, useCallback, useEffect } from 'react';
import { authApi, endpoints } from '../../services/api';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export default function Mentor({ allSkills }) {
  const [mentorProfile, setMentorProfile] = useState(null);
  const [mentorSlots, setMentorSlots] = useState([]);
  const [showMentorModal, setShowMentorModal] = useState(false);

  const [mentorForm, setMentorForm] = useState({
    headline: '',
    mentoring_description: '',
    max_mentees: 1,
    expertise: []
  });
  const [newSlot, setNewSlot] = useState({ day_of_week: 0, start_time: '08:00', end_time: '10:00' });

  const loadMentorData = useCallback(async () => {
    try {
      const api = authApi();
      const res = await api.get(endpoints.mentor);
      setMentorProfile(res.data);
      setMentorForm({
        headline: res.data.headline || '',
        mentoring_description: res.data.mentoring_description || '',
        max_mentees: res.data.max_mentees || 1,
        accepting_mentees: res.data.accepting_mentees ?? true,
        expertise: res.data.expertise || []
      });

      const slotsRes = await api.get(endpoints.mentorAvailability);
      setMentorSlots(slotsRes.data || []);
    } catch {
      setMentorProfile(null);
    }
  }, [setMentorProfile, setMentorForm, setMentorSlots]);

  useEffect(() => {
    Promise.resolve().then(loadMentorData);
  }, [loadMentorData]);

  const saveMentorProfile = async (e) => {
    e.preventDefault();
    const api = authApi();
    if (mentorProfile) {
      await api.patch(endpoints.mentor, mentorForm);
    } else {
      await api.post(endpoints.mentor, mentorForm);
    }
    await loadMentorData();
    alert('Đã lưu thông tin Mentor!');
  };

  const submitMentorProfile = async () => {
    if (confirm('Bạn có chắc chắn muốn gửi hồ sơ cho Admin phê duyệt?')) {
      try {
        const api = authApi();
        if (mentorProfile) {
          await api.patch(endpoints.mentor, mentorForm);
        } else {
          await api.post(endpoints.mentor, mentorForm);
        }
        await api.post(endpoints.mentorSubmit);
        await loadMentorData();
        alert('Đã gửi hồ sơ thành công! Vui lòng chờ Admin phê duyệt.');
      } catch (err) {
        console.error(err);
        alert('Vui lòng nhập đầy đủ thông tin!');
      }
    }
  };

  const toggleMentorExpertise = (skillId) => {
    const current = mentorForm.expertise || [];
    const next = current.includes(skillId) ? current.filter(id => id !== skillId) : [...current, skillId];
    setMentorForm({ ...mentorForm, expertise: next });
  };

  const addSlot = async () => {
    if (!mentorProfile) {
      alert('Vui lòng điền thông tin và bấm "Gửi duyệt Admin" để tạo hồ sơ trước khi thêm lịch!');
      return;
    }
    const updated = [...mentorSlots, newSlot];
    setMentorSlots(updated);
    await authApi().put(endpoints.mentorAvailability, { slots: updated });
  };

  const removeSlot = async (index) => {
    if (!mentorProfile) return;
    const updated = mentorSlots.filter((_, i) => i !== index);
    setMentorSlots(updated);
    await authApi().put(endpoints.mentorAvailability, { slots: updated });
  };

  const getStatusBadge = (status) => {
    if (status === 'APPROVED') return <span className="badge bg-success">Đã phê duyệt</span>;
    if (status === 'REJECTED') return <span className="badge bg-danger">Bị từ chối</span>;
    return <span className="badge bg-warning text-dark">Chờ phê duyệt</span>;
  };

  return (
    <>
      {!mentorProfile ? (
        <button className="btn btn-outline-primary btn-sm" onClick={() => setShowMentorModal(true)}>
          Đăng ký Mentor
        </button>
      ) : (
        <div className="d-flex align-items-center gap-2">
          {getStatusBadge(mentorProfile.status)}
          <button className="btn btn-primary btn-sm" onClick={() => setShowMentorModal(true)}>
            Xem / Sửa hồ sơ Mentor
          </button>
        </div>
      )}

      {showMentorModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold m-0">Hồ sơ Mentor {mentorProfile && getStatusBadge(mentorProfile.status)}</h6>
                <button type="button" className="btn-close" onClick={() => setShowMentorModal(false)}></button>
              </div>

              {mentorProfile?.status === 'REJECTED' && mentorProfile.rejection_reason && (
                <div className="alert alert-danger p-2 small mb-3">
                  <strong>Lý do từ chối:</strong> {mentorProfile.rejection_reason}
                </div>
              )}

              <form onSubmit={saveMentorProfile}>
                <div>
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="acceptingMentees"
                      checked={mentorForm.accepting_mentees}
                      onChange={e => setMentorForm({ ...mentorForm, accepting_mentees: e.target.checked })}
                    />
                    <label className="form-check-label small fw-semibold m-0" htmlFor="acceptingMentees">
                      Nhận hướng dẫn Mentee
                    </label>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold m-0">Chức danh hiện tại</label>
                  <input className="form-control form-control-sm" placeholder="VD: Senior Python Developer tại ABC Corp" value={mentorForm.headline} onChange={e => setMentorForm({ ...mentorForm, headline: e.target.value })} required />
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-semibold m-0">Mô tả Mentoring</label>
                  <textarea className="form-control form-control-sm" rows="3" placeholder="Giới thiệu phong cách và định hướng hướng dẫn..." value={mentorForm.mentoring_description} onChange={e => setMentorForm({ ...mentorForm, mentoring_description: e.target.value })} required />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold m-0">Số Mentee tối đa</label>
                  <input type="number" min="1" className="form-control form-control-sm" value={mentorForm.max_mentees} onChange={e => setMentorForm({ ...mentorForm, max_mentees: parseInt(e.target.value) || 1 })} required />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold mb-1">Chuyên môn</label>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }} className="d-flex flex-wrap gap-1 p-2 border rounded">
                    {allSkills.map(s => {
                      const selected = (mentorForm.expertise || []).includes(s.id);
                      return (
                        <button key={s.id} type="button" className={`btn btn-xs ${selected ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => toggleMentorExpertise(s.id)}>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-top pt-3">
                  <h6 className="fw-bold small mb-2">Lịch rảnh</h6>
                  <div className="row g-1 mb-2">
                    <div className="col-4">
                      <select className="form-select form-select-sm" value={newSlot.day_of_week} onChange={e => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}>
                        {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-3"><input type="time" className="form-control form-control-sm" value={newSlot.start_time} onChange={e => setNewSlot({ ...newSlot, start_time: e.target.value })} /></div>
                    <div className="col-3"><input type="time" className="form-control form-control-sm" value={newSlot.end_time} onChange={e => setNewSlot({ ...newSlot, end_time: e.target.value })} /></div>
                    <div className="col-2"><button type="button" className="btn btn-sm btn-light text-primary" onClick={addSlot}>+ Thêm</button></div>
                  </div>

                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {mentorSlots.map((slot, idx) => (
                      <span key={idx} className="badge bg-light text-dark border d-inline-flex align-items-center gap-1 p-2">
                        {DAYS[slot.day_of_week]}: {slot.start_time} - {slot.end_time}
                        <button type="button" className="btn-close" onClick={() => removeSlot(idx)}></button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="modal-footer border-0 p-0 pt-2 d-flex justify-content-between">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowMentorModal(false)}>Đóng</button>
                  {mentorProfile?.status == 'APPROVED' ? (
                    <button className="btn btn-success btn-sm">Lưu</button>
                  ) : (
                    <button type="button" className="btn btn-sm btn-primary" onClick={submitMentorProfile}>
                      Gửi duyệt Admin
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}