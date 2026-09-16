import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImageShow from './ImageShow';

export default function Navbar({ onOpenAuth }) {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
      <div className="container">
        <Link to="/" className="navbar-brand">MentorMe</Link>
        <div className="d-flex justify-content-center">
          <Nav variant="tabs" defaultActiveKey="/">
            <Nav.Item>
              <Nav.Link as={Link} to="/">Trang chủ</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/my-schedules">
                Lịch hẹn
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/my-mentorship">
                Hoạt động
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/chat">
                Tin nhắn
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/notifications">
                Thông báo
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>
        <div className="ms-auto">
          {user ? (
            <div className="d-flex align-items-center gap-3">
              <Nav.Link as={Link} to="/profile" className="p-0 d-flex align-items-center">
                <span className="fw-medium me-2">
                  Hồ sơ
                </span>
                <ImageShow
                  src={user.avatar}
                  name={user.full_name}
                  size={35}
                  shape="circle"
                />
              </Nav.Link>
              <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary" onClick={() => onOpenAuth(true)}>
                Đăng nhập
              </button>
              <button className="btn btn-primary" onClick={() => onOpenAuth(false)}>
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}