import { useState } from "react";
import { sendRequest } from "../services/mentorshipService";

export default function SendRequestModal({ show, onClose, mentor, onSuccess }) {
  const [goal, setGoal] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!show || !mentor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await sendRequest({
        mentor_profile_id: mentor.id,
        goal,
        message,
      });
      setGoal("");
      setMessage("");
      onSuccess?.(res);
      onClose();
    } catch (err) {
      const detailErr = err?.response?.data?.detail;
      setError(typeof detailErr === "string" ? detailErr : "Gửi yêu cầu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block tab-modal-backdrop" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">Gửi yêu cầu kết nối</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body py-3">
              <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                  style={{ width: "42px", height: "42px" }}
                >
                  {mentor.full_name?.[0]?.toUpperCase() || "M"}
                </div>
                <div>
                  <h6 className="fw-bold m-0">{mentor.full_name}</h6>
                  <small className="text-muted">{mentor.headline || "Mentor"}</small>
                </div>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <div className="mb-3">
                <label className="form-label small fw-bold">Mục tiêu của bạn (*)</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="Ví dụ: Định hướng học lập trình Web, Review CV..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="form-label small fw-bold">Lời nhắn giới thiệu</label>
                <textarea
                  className="form-control rounded-3"
                  rows={3}
                  placeholder="Giới thiệu bản thân và mong muốn của bạn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-light text-secondary rounded-3 fw-bold"
                onClick={onClose}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-3 px-4 fw-bold"
                disabled={loading}
              >
                {loading ? "Đang gửi..." : "Gửi lời mời"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}