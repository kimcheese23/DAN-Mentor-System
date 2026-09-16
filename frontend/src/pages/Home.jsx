import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api, { endpoints } from "../services/api";
import MySpinner from "../components/MySpinner";
import ImageShow from "../components/ImageShow";
import Pagination from "../components/Pagination";
import { useNavigate, useSearchParams } from "react-router-dom";
import RecommendMentorModal from "../components/RecommendMentorModal";

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const ordering = searchParams.get("ordering") || "newest";

  const [filterSearch, setFilterSearch] = useState(search);
  const [mentors, setMentors] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [allSkills, setAllSkills] = useState([]);

  const handleApplyFilter = (e) => {
    e?.preventDefault();
    const params = Object.fromEntries([...searchParams]);
    if (filterSearch.trim()) {
      params.search = filterSearch.trim();
    } else {
      delete params.search;
    }
    params.page = "1";
    setSearchParams(params);
  };

  const handleOrderingChange = (newOrdering) => {
    const params = Object.fromEntries([...searchParams]);
    params.ordering = newOrdering;
    params.page = "1";
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = Object.fromEntries([...searchParams]);
    params.page = String(newPage);
    setSearchParams(params);
  };

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get(endpoints.skill);
        const data = res.data;
        setAllSkills(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSkills();

    const fetchMentors = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          ...(search && { search }),
          ...(ordering && { ordering }),
        };
        const res = await api.get(endpoints.mentorsDiscovery, { params });
        const data = res.data;
        const mentorList = Array.isArray(data) ? data : data.results || [];
        const totalItems = Array.isArray(data) ? data.length : data.count || 0;
        const pageSize = 8;

        setMentors(mentorList);
        setTotalPages(Math.ceil(totalItems / pageSize) || 1);
      } catch (err) {
        console.error("Lỗi lấy danh sách mentor:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [page, ordering, search, user]);

  const handleRecommendMentors = async (skillIds) => {
    try {
      const res = await api.post(
        endpoints.recommendMentors,
        { skill_ids: skillIds }
      );

      setRecommendations(res.data || []);
      setShowRecommendations(true);
      setShowRecommendModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="bg-primary py-5 text-center border-bottom">
        <div className="container py-4">
          <h1 className="display-4 fw-bold text-white">Kết nối Mentor & Mentee</h1>
          <p className="lead text-white">
            Tìm kiếm người hướng dẫn phù hợp để phát triển sự nghiệp của bạn.
          </p>
          <div className="container my-4" style={{ maxWidth: "800px" }}>
            <form onSubmit={handleApplyFilter} className="row g-2 bg-white p-2 rounded-4 shadow-sm align-items-center mb-4">
              <div className="col-md-7 col-12">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo tên Mentor, kỹ năng, định hướng, từ khóa..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </div>
              <div className="col-md-3 col-7">
                <select
                  className="form-select"
                  value={ordering}
                  onChange={(e) => handleOrderingChange(e.target.value)}
                >
                  <option value="newest">Mới cập nhật</option>
                  <option value="rating_desc">Đánh giá cao</option>
                </select>
              </div>
              <div className="col-md-2 col-5">
                <button type="submit" className="btn btn-primary w-100 fw-bold">
                  Tìm kiếm
                </button>
              </div>
            </form>

            {user ? (
              <div className="text-center">
                <button
                  className="btn btn-warning fw-bold px-4"
                  onClick={() => setShowRecommendModal(true)}
                >
                  Gợi ý Mentor
                </button>
              </div>
            ) : ('')}
          </div>
        </div>
      </div>

      <RecommendMentorModal
        show={showRecommendModal}
        onClose={() => setShowRecommendModal(false)}
        allSkills={allSkills}
        onSubmit={handleRecommendMentors}
      />
      <div className="container my-5">
        {showRecommendations && (
          <div className="mb-5">
            <h3 className="fw-bold mb-3">
              Mentor được đề xuất
            </h3>

            <div className="row">
              {recommendations.map(m => (
                <div className="col-md-3 mb-3" key={m.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <ImageShow
                        src={m.avatar}
                        name={m.full_name}
                        size={60}
                        shape="rounded"
                      />
                      <h6 className="mt-2 mb-1">{m.full_name}</h6>
                      <small className="text-muted">{m.headline}</small>
                      <p className="mt-2 mb-1">Phù hợp: {m.score}%</p>
                      <div className="d-flex flex-wrap gap-1">
                        {m.matched_skills.map(skill => (
                          <span key={skill} className="badge bg-success">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="card-footer bg-white">
                      <button
                        className="btn btn-outline-primary btn-sm w-100"
                        onClick={() =>
                          nav(`/mentor-detail/${m.id}`)
                        }
                      >
                        Xem chi tiết
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="container my-5">
        <h3 className="mb-4 fw-bold">Danh sách Mentor</h3>

        {loading ? (
          <MySpinner className="shadow bg-primary d-flex align-items-center" />
        ) : mentors.length === 0 ? (
          <p className="text-center text-muted">Không tìm thấy mentor nào phù hợp.</p>
        ) : (
          <>
            <div className="row gy-4 g-6">
              {mentors.map((m) => (
                <div className="col-12 col-sm-6 col-md-3" key={m.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <ImageShow
                          src={m.avatar}
                          name={m.full_name}
                          size={60}
                          shape="rounded"
                        />
                        <div>
                          <span>
                            Đánh giá: {m.average_rating ? `${m.average_rating} ⭐` : "Chưa có đánh giá"}
                          </span>
                          <p className="m-0 small text-muted">
                            Mentee: {m.current_mentees || 0}/{m.max_mentees || 0}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h6 className="fw-bold m-0 text-truncate" style={{ maxWidth: 140 }}>
                          {m.full_name}
                        </h6>
                        <small className="text-muted d-block text-truncate" style={{ maxWidth: 140 }}>
                          {m.headline || "Mentor"}
                        </small>
                      </div>

                      <p className="card-text small text-secondary line-clamp-2 mb-2">
                        {m.mentoring_description || "Chưa có mô tả."}
                      </p>

                      <div className="d-flex flex-wrap gap-1 mt-2">
                        {(m.expertise || []).map((skill) => (
                          <span key={skill.id} className="badge bg-light text-dark border">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="card-footer bg-white border-top-0 pt-0">
                      <button
                        className="btn btn-outline-primary btn-sm w-100 rounded-pill"
                        onClick={() => nav(`/mentor-detail/${m.id}`)}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}