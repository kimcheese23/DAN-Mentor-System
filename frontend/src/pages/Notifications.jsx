import { useState, useEffect } from "react";
import { getRequests, acceptRequest, rejectRequest, cancelRequest } from "../services/mentorshipService";
import MySpinner from "../components/MySpinner";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";

export default function NotificationsPage() {
    const [tab, setTab] = useState("received");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionId, setActionId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const nav = useNavigate();

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                if (tab === "received" || tab === "sent") {
                    const res = await getRequests( tab, null, currentPage);
                    const list = Array.isArray(res) ? res : (res?.results || []);
                    const totalItems = Array.isArray(res) ? res.length : (res?.count || 0);
                    const pageSize = 8;

                    setItems(list.map((r) => ({ ...r, type: "mentorship_request" })));
                    setTotalPages(Math.ceil(totalItems / pageSize) || 1);
                }
            } catch (err) {
                console.error("Lỗi lấy thông báo:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [tab, currentPage]);

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setCurrentPage(1);
    };

    const handleAction = async (id, actionFn, newStatus) => {
        setActionId(id);
        try {
            await actionFn(id);
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
        } catch (err) {
            alert(err?.response?.data?.detail || "Lỗi xử lý hệ thống");
        } finally {
            setActionId(null);
        }
    };

    const handleNavigateToMentor = (item) => {
  const profileId = item.mentor_profile_id || item.mentor_profile?.id || item.mentor_profile;

  if (profileId) {
    nav(`/mentor-detail/${profileId}`, { 
      state: { from: `/notifications?tab=${tab}&page=${currentPage}` } 
    });
  } else {
    console.warn("Chưa có thông tin mentor trong dữ liệu");
  }
};

    const statusBadges = {
        ACCEPTED: <span className="badge bg-success-subtle text-success border">Đã chấp nhận</span>,
        REJECTED: <span className="badge bg-danger-subtle text-danger border">Đã từ chối</span>,
        CANCELLED: <span className="badge bg-secondary-subtle text-secondary border">Đã hủy</span>,
    };

    return (
        <div className="bg-light py-4">
            <div className="container max-w-lg">
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-2">
                    <h4 className="fw-bold m-0">Thông báo</h4>

                    <div className="btn-group bg-white p-1 rounded-pill border shadow-sm">
                        <button
                            className={`btn btn-sm rounded-pill px-3 fw-bold ${tab === "received" ? "btn-primary" : "border-0 text-secondary"}`}
                            onClick={() => handleTabChange("received")}
                        >
                            Yêu cầu đã nhận
                        </button>
                        <button
                            className={`btn btn-sm rounded-pill px-3 fw-bold ${tab === "sent" ? "btn-primary" : "border-0 text-secondary"}`}
                            onClick={() => handleTabChange("sent")}
                        >
                            Yêu cầu đã gửi
                        </button>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 p-3">
                    {loading ? (
                        <MySpinner />
                    ) : !items.length ? (
                        <div className="text-center text-muted py-5">
                            Chưa có thông báo nào.
                        </div>
                    ) : (
                        <>
                            <div className="d-flex flex-column gap-3">
                                {items.map((item) => {
                                    const isReceived = tab === "received";
                                    const targetName = isReceived ? item.mentee_name : item.mentor_name;
                                    const isPending = item.status === "PENDING";

                                    return (
                                        <div
                                            key={item.id}
                                            className="p-3 border rounded-3 bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
                                        >
                                            {item.type === "mentorship_request" && (
                                                <>
                                                    <div className="d-flex align-items-start gap-3">
                                                        <div
                                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 cursor-pointer"
                                                            style={{ width: 44, height: 44, cursor: "pointer" }}
                                                            onClick={() => !isReceived && handleNavigateToMentor(item)}
                                                        >
                                                            {targetName?.[0]?.toUpperCase() || "U"}
                                                        </div>

                                                        <div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <h6
                                                                    className={`fw-bold m-0 fs-6 ${!isReceived ? "text-primary cursor-pointer" : ""}`}
                                                                    style={{ cursor: !isReceived ? "pointer" : "default" }}
                                                                    onClick={() => !isReceived && handleNavigateToMentor(item)}
                                                                >
                                                                    {targetName}
                                                                </h6>
                                                                <small className="text-muted">
                                                                    {new Date(item.created_at).toLocaleDateString("vi-VN")}
                                                                </small>
                                                            </div>

                                                            <p className="text-secondary small m-0 mt-1">
                                                                {isReceived
                                                                    ? "đã gửi cho bạn một lời mời kết nối Mentorship."
                                                                    : "Bạn đã gửi lời mời kết nối Mentorship tới Mentor này."}
                                                            </p>

                                                            {item.goal && (
                                                                <div className="bg-light p-2 rounded small mt-2">
                                                                    <strong>Mục tiêu:</strong> {item.goal}
                                                                </div>
                                                            )}
                                                            {item.message && (
                                                                <div className="bg-light p-2 rounded small mt-1">
                                                                    <strong>Lời nhắn:</strong> {item.message}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex-shrink-0 ms-auto ms-md-0">
                                                        {isPending ? (
                                                            isReceived ? (
                                                                <div className="d-flex gap-2">
                                                                    <button
                                                                        className="btn btn-primary btn-sm rounded-2 fw-bold px-3"
                                                                        disabled={actionId === item.id}
                                                                        onClick={() => handleAction(item.id, acceptRequest, "ACCEPTED")}
                                                                    >
                                                                        {actionId === item.id ? "Xử lý..." : "Đồng ý"}
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-light text-dark border btn-sm rounded-2 fw-bold px-3"
                                                                        disabled={actionId === item.id}
                                                                        onClick={() => handleAction(item.id, rejectRequest, "REJECTED")}
                                                                    >
                                                                        Từ chối
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm rounded-2 fw-bold px-3"
                                                                    disabled={actionId === item.id}
                                                                    onClick={() => {
                                                                        if (window.confirm("Bạn muốn hủy yêu cầu này?")) {
                                                                            handleAction(item.id, cancelRequest, "CANCELLED");
                                                                        }
                                                                    }}
                                                                >
                                                                    {actionId === item.id ? "Đang hủy..." : "Hủy yêu cầu"}
                                                                </button>
                                                            )
                                                        ) : (
                                                            statusBadges[item.status]
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <Pagination
                                page={currentPage}
                                totalPages={totalPages}
                                onPageChange={(p) => setCurrentPage(p)}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}