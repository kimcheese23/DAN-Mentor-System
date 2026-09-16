import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api, { endpoints } from "../services/api";
import { cancelRequest, getRequests } from "../services/mentorshipService";
import MySpinner from "../components/MySpinner";
import ImageShow from "../components/ImageShow";
import SendRequestModal from "../components/SendRequestModal";
import FeedbackList from "../components/FeedbackList";

export default function MentorDetail({ onOpenAuth }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("about");
  const [showModal, setShowModal] = useState(false);
  const [reqId, setReqId] = useState(null);
  const [canceling, setCanceling] = useState(false);

  const fetchMentor = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${endpoints.mentorDetail(id)}`);
      const data = res.data;
      setMentor(data);

      if (user && data) {
        const sent = await getRequests("sent", "PENDING");
        const reqList = Array.isArray(sent) ? sent : (sent.results || []);

        const uId = String(typeof data.user === "object" ? data.user?.id : data.user || "");
        const pId = String(data.id || id || "");

        const active = reqList.find((r) => {
          const rUser = String(r.mentor_user_id || r.mentor_id || r.mentor?.id || r.mentor || "");
          const rProf = String(r.mentor_profile_id || r.mentor_profile?.id || r.mentor_profile || "");
          return (uId && rUser === uId) || (pId && rProf === pId);
        });

        setReqId(active ? active.id : null);
      }
    } catch (err) {
      console.error("Lỗi fetchMentor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      Promise.resolve().then(() => fetchMentor());
    }
  }, [id, user?.id]);

  if (loading) return <MySpinner />;
  if (!mentor) {
    return (
      <div className="container py-5 text-center">
        <h5 className="text-muted mb-3">Không tìm thấy thông tin Mentor</h5>
        <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => nav(-1)}>
          &larr; Quay lại
        </button>
      </div>
    );
  }

  const isFull = !mentor.accepting_mentees || mentor.current_mentees >= mentor.max_mentees;
  const mentorUserId = mentor.user_id || (typeof mentor.user === "object" ? mentor.user?.id : mentor.user);
    console.log("Dữ liệu mentor nhận được:", mentor);

  const handleOpenModal = () => {
    if (!user) {
      if (window.confirm("Bạn cần đăng nhập để gửi lời mời kết nối. Đăng nhập ngay?")) {
        sessionStorage.setItem("redirect_after_login", window.location.pathname);
        onOpenAuth?.(false);
      }
      return;
    }
    if (user.id === mentorUserId) return alert("Bạn không thể gửi yêu cầu cho chính mình.");
    setShowModal(true);
  };

  const handleCancelRequest = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy yêu cầu kết nối này?")) return;
    setCanceling(true);
    try {
      await cancelRequest(reqId);
      setReqId(null);
      alert("Đã hủy yêu cầu thành công.");
    } catch (err) {
      alert(err?.response?.data?.detail || "Không thể hủy yêu cầu vào lúc này");
    } finally {
      setCanceling(false);
    }
  };

  const renderSection = (items, icon, renderContent, emptyText) =>
    !items?.length ? (
      <p className="text-muted small m-0">{emptyText}</p>
    ) : (
      items.map((item, idx) => (
        <div key={item.id || idx} className="d-flex gap-3 mb-3">
          <div className="bg-light rounded-circle p-2 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 38, height: 38 }}>
            {icon}
          </div>
          <div>{renderContent(item)}</div>
        </div>
      ))
    );

  return (
    <div className="bg-light py-4 min-vh-100">
      <div className="container">
        <button className="btn btn-link text-decoration-none p-0 mb-3 text-secondary" onClick={() => nav(-1)}>
          &larr; Quay lại
        </button>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 text-center mb-4">
              <div className="d-flex justify-content-center mb-3">
                <ImageShow src={mentor.avatar} name={mentor.full_name} size={100} shape="circle" />
              </div>

              <h5 className="fw-bold mb-1">{mentor.full_name}</h5>
              <p className="text-primary small fw-semibold mb-3">{mentor.headline || "Mentor"}</p>

              <div className="bg-light p-3 rounded-3 mb-3 text-start small">
                <div className="d-flex justify-content-between mb-1">
                  <span>Số Mentee đã nhận</span>
                  <span className="fw-bold">{mentor.current_mentees || 0} / {mentor.max_mentees || 0}</span>
                </div>
                <div className={`fw-medium ${isFull ? "text-danger" : "text-success"}`}>
                  {isFull ? "Đã đủ số lượng nhận" : "Sẵn sàng nhận Mentee"}
                </div>
              </div>

              <button
                className={`btn w-100 fw-bold py-2 rounded-3 shadow-sm ${reqId ? "btn-outline-danger" : "btn-primary"}`}
                disabled={reqId ? canceling : isFull}
                onClick={reqId ? handleCancelRequest : handleOpenModal}
              >
                {reqId ? (canceling ? "Đang xử lý..." : "Hủy yêu cầu kết nối") : "Gửi yêu cầu kết nối"}
              </button>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h6 className="fw-bold mb-3">Kỹ năng chuyên môn</h6>
              <div className="d-flex flex-wrap gap-2">
                {mentor.expertise?.length ? (
                  mentor.expertise.map((s) => (
                    <span key={s.id || s.name} className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-2 px-2 py-1">
                      {s.name}
                    </span>
                  ))
                ) : (
                  <span className="text-muted small">Chưa cập nhật</span>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="card-header bg-white border-bottom p-0 d-flex">
                {[
                  { key: "about", label: "Giới thiệu" },
                  { key: "reviews", label: "Đánh giá" },
                  { key: "availability", label: "Lịch rảnh" },
                ].map((t) => (
                  <button
                    key={t.key}
                    className={`btn rounded-0 py-3 px-4 border-0 fw-bold fs-6 ${tab === t.key ? "text-primary border-bottom border-primary border-3" : "text-secondary"}`}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="card-body p-4">
                {tab === "about" && (
                  <>
                    <div className="mb-4">
                      <h6 className="fw-bold mb-2">Về Mentor</h6>
                      <p className="text-secondary small m-0" style={{ whiteSpace: "pre-line" }}>
                        {mentor.mentoring_description || "Chưa có mô tả chi tiết."}
                      </p>
                    </div>
                    <hr className="my-4 opacity-10" />
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Kinh nghiệm làm việc</h6>
                      {renderSection(mentor.careers, "💼", (c) => (
                        <>
                          <h6 className="mb-0 fw-bold fs-6">{c.position}</h6>
                          <div className="small text-muted">Nơi làm việc: {c.company}</div>
                          <div className="small text-muted">Mô tả: {c.description}</div>
                        </>
                      ), "Chưa cập nhật kinh nghiệm.")}
                    </div>
                    <hr className="my-4 opacity-10" />
                    <div>
                      <h6 className="fw-bold mb-3">Học vấn & Bằng cấp</h6>
                      {renderSection(mentor.educations, "🎓", (e) => (
                        <>
                          <h6 className="mb-0 fw-bold fs-6">{e.institution}</h6>
                          <div className="small text-muted">{e.degree} - {e.major}</div>
                          <small className="text-secondary">{e.start_year} - {e.end_year}</small>
                        </>
                      ), "Chưa cập nhật học vấn.")}
                    </div>
                  </>
                )}

                {tab === "reviews" && <FeedbackList mentorId={mentorUserId} />}

                {tab === "availability" && (
                  <div className="row g-2">
                    {mentor.availability?.length ? (
                      mentor.availability.map((a, idx) => (
                        <div key={a.id || idx} className="col-md-3">
                          <div className="p-2 border rounded-3 bg-light">
                            <span className="fw-bold d-block small mb-1">{a.day_of_week_display}</span>
                            <small className="text-primary fw-medium">🕒 {a.start_time} - {a.end_time}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted small">Chưa thiết lập lịch rảnh.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SendRequestModal
        show={showModal}
        mentor={mentor}
        onClose={() => setShowModal(false)}
        onSuccess={(res) => {
          alert("Đã gửi lời mời thành công!");
          const newId = res?.request_id || res?.id;
          if (newId) setReqId(newId);
          fetchMentor();
        }}
      />
    </div>
  );
}