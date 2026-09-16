import { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { createSchedule } from '../services/scheduleService';

export default function ScheduleModal({ show, handleClose, mentorshipId, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    note: '',
    start_time: '',
    end_time: '',
    meeting_link: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      setError('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      setLoading(false);
      return;
    }

    try {
      await createSchedule(mentorshipId, formData);
      setFormData({ title: '', note: '', start_time: '', end_time: '', meeting_link: '' });
      onSuccess(); 
      handleClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể tạo lịch hẹn. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold fs-5">Tạo lịch hẹn mentoring mới</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Tiêu đề buổi hẹn <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="title"
              placeholder="VD: Buổi 1 - Review CV và định hướng công việc"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">Thời gian bắt đầu <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">Thời gian kết thúc <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Link Video Call (Google Meet, Zoom,...)</Form.Label>
            <Form.Control
              type="url"
              name="meeting_link"
              placeholder="https://meet.google.com/xyz-abc-def"
              value={formData.meeting_link}
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              Nhập link phòng họp online nếu buổi hẹn diễn ra trực tuyến. Nếu không, bạn có thể để trống.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Ghi chú</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="note"
              placeholder="Ghi chú về chủ đề sẽ trao đổi, câu hỏi cần giải đáp..."
              value={formData.note}
              onChange={handleChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo lịch hẹn'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}