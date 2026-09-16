import { useState, useEffect } from 'react';
import { createMilestone, updateMilestone } from '../services/mentorshipService';

export const MilestoneModal = ({ isOpen, mentorshipId, onClose, editingMilestone, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(1);

  useEffect(() => {
    if (editingMilestone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(editingMilestone.title || '');
      setDescription(editingMilestone.description || '');
      setOrder(editingMilestone.order || 1);
    } else {
      setTitle(''); setDescription(''); setOrder(1);
    }
  }, [editingMilestone, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { title, description, order: Number(order) };
    try {
      if (editingMilestone) await updateMilestone(editingMilestone.id, payload);
      else await createMilestone(mentorshipId, payload);
      onClose();
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi lưu chặng');
    }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-bold">{editingMilestone ? 'Sửa chặng' : 'Tạo chặng mới'}</h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <input className="form-control form-control-sm mb-2" type="number" placeholder="Thứ tự" required value={order} onChange={(e) => setOrder(e.target.value)} />
              <input className="form-control form-control-sm mb-2" placeholder="Tên chặng" required value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea className="form-control form-control-sm mb-2" rows="2" placeholder="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-sm btn-success">Lưu chặng</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};