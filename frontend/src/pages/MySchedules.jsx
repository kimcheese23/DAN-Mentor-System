import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Nav } from 'react-bootstrap';
import { getMySchedules, cancelSchedule, completeSchedule } from '../services/scheduleService';
import MySpinner from '../components/MySpinner';
import Pagination from '../components/Pagination';
import { makeGoogleCalendarLink } from '../utils/calendar';

// Constant ánh ánh trạng thái sang Badge
const STATUS_BADGES = {
  SCHEDULED: { bg: 'primary', label: 'Đã lên lịch' },
  COMPLETED: { bg: 'success', label: 'Đã hoàn thành' },
  CANCELLED: { bg: 'danger', label: 'Đã hủy' },
};

// Helper format thời gian gọn gàng
const formatDateTime = (start, end) => {
  const sDate = new Date(start);
  const eDate = new Date(end);
  return {
    date: sDate.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: `${sDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${eDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  };
};

export default function MySchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(''); 
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMySchedules(page, status);
      setSchedules(data.results || data);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Lỗi lấy danh sách lịch hẹn:', err);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    Promise.resolve().then(() => fetchSchedules());
  }, [fetchSchedules]);

  const handleAction = async (actionFn, id, confirmMsg, errorMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try {
      await actionFn(id);
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.detail || errorMsg);
    }
  };

  return (
    <Container className="py-4">
      <h3 className="fw-bold mb-4">Quản lý lịch hẹn</h3>

      {/* Filter Tabs */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-2">
          <Nav variant="pills" activeKey={status} onSelect={(val) => { setStatus(val); setPage(1); }}>
            <Nav.Item><Nav.Link eventKey="">Tất cả</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="SCHEDULED">Sắp tới</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="COMPLETED">Đã hoàn thành</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="CANCELLED">Đã hủy</Nav.Link></Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {/* Content Section */}
      {loading ? (
        <MySpinner />
      ) : schedules.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3">
          <i className="bi bi-calendar-x display-4 text-muted" />
          <p className="mt-3 text-muted">Không tìm thấy lịch hẹn nào.</p>
        </div>
      ) : (
        <Row className="g-3">
          {schedules.map((item) => (
            <ScheduleCard 
              key={item.id} 
              item={item} 
              onComplete={(id) => handleAction(completeSchedule, id, null, 'Chưa thể đánh dấu hoàn thành.')}
              onCancel={(id) => handleAction(cancelSchedule, id, 'Bạn có chắc chắn muốn hủy lịch hẹn này?', 'Không thể hủy lịch hẹn.')}
            />
          ))}
        </Row>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </Container>
  );
}

function ScheduleCard({ item, onComplete, onCancel }) {
  const { date, time } = formatDateTime(item.start_time, item.end_time);
  const isScheduled = item.status === 'SCHEDULED';
  const badge = STATUS_BADGES[item.status] || { bg: 'secondary', label: item.status };

  return (
    <Col xs={12}>
      <Card className="border-0 shadow-sm h-100">
        <Card.Body className="p-3 p-md-4">
          <Row className="align-items-center g-3">
            <Col md={3} className="border-end-md">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-calendar-event text-primary fs-5" />
                <span className="fw-bold fs-6">{date}</span>
              </div>
              <div className="text-muted small ms-4">
                <i className="bi bi-clock me-1" />{time}
              </div>
            </Col>

            <Col md={5}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <h5 className="mb-0 fw-bold">{item.title}</h5>
                <Badge bg={badge.bg}>{badge.label}</Badge>
              </div>
              <div className="d-flex align-items-center gap-2 mb-2 text-secondary small">
                <i className="bi bi-person-circle" />
                <span>Buổi hẹn với: {item.partner_name || 'Đối tác'}</span>
              </div>
              {item.note && (
                <p className="text-muted small mb-0 text-truncate">
                  <i className="bi bi-chat-left-text me-1" /> Ghi chú: {item.note}
                </p>
              )}
            </Col>

            <Col md={4} className="d-flex flex-column gap-2 align-items-md-end justify-content-center">
              {isScheduled && (
                <>
                  <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                    {item.meeting_link && (
                      <Button href={item.meeting_link} target="_blank" rel="noreferrer" variant="primary" size="sm" className="d-flex align-items-center gap-1">
                        <i className="bi bi-camera-video-fill" /> Vào Video Call
                      </Button>
                    )}
                    <Button href={makeGoogleCalendarLink(item)} target="_blank" rel="noreferrer" variant="outline-danger" size="sm" className="d-flex align-items-center gap-1">
                      <i className="bi bi-google" /> Thêm Calendar
                    </Button>
                  </div>
                  <div className="d-flex gap-2 mt-1">
                    <Button variant="outline-success" size="sm" onClick={() => onComplete(item.id)}>Hoàn thành</Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => onCancel(item.id)}>Hủy lịch</Button>
                  </div>
                </>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Col>
  );
}