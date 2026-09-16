import { useState, useEffect } from 'react';
import axios from 'axios';
import { endpoints } from '../services/api';

export default function AuthModal({ show, handleClose, isLoginInitial = true, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(isLoginInitial);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setloading] = useState(false);

  useEffect(() => {
    setIsLogin(isLoginInitial);
    setError('');
  }, [isLoginInitial, show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setloading(true);

    const url = isLogin
      ? `http://localhost:8000/api${endpoints.login}`
      : `http://localhost:8000/api${endpoints.register}`;

    const payload = isLogin
      ? { email, password }
      : { email, password, full_name: fullName };

    try {
      const res = await axios.post(url, payload);
      if (isLogin) {
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        if (typeof onLoginSuccess === 'function') {
          await onLoginSuccess();
        }
        handleClose();
      } else {
        setIsLogin(true);
      }
    } catch (err) {
      console.log("Axios error:", err);
      if (err.response) {
        const data = err.response.data;
        if (data.password) setError("Mật khẩu phải nhiều hơn 6 ký tự.");
        else if (data.email) setError("Email đã được sử dụng.");
        else if (data.detail) setError("Email hoặc mật khẩu không chính xác.");
        else setError("Có lỗi xảy ra, vui lòng thử lại.");
      } else if (err.request) {
        setError("Không nhận được phản hồi từ server.");
      } else {
        setError("Có lỗi xảy ra khi gửi yêu cầu.");
      }
    } finally {
      setloading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `http://localhost:8000/accounts/${provider}/login/?process=login`;
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>

          <div className="modal-body p-4">
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="mb-3">
                  <label className="form-label small text-secondary">Họ và tên</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label small text-secondary">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-secondary">Mật khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold mb-3" disabled={loading}>
                {loading ? (
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  isLogin ? 'Đăng nhập' : 'Tạo tài khoản'
                )}
              </button>
            </form>

            <div className="position-relative my-3 text-center">
              <hr className="text-muted" />
              <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                hoặc
              </span>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              onClick={() => handleSocialLogin('google')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Đăng nhập bằng Google</span>
            </button>
          </div>

          <div className="modal-footer border-0 justify-content-center pb-4">
            <button
              type="button"
              className="btn btn-link text-decoration-none p-0"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}