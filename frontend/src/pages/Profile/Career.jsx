import { useState } from 'react';
import { authApi, endpoints } from '../../services/api';

export default function CareerSection({ careers, onReload }) {
  const [careerForm, setCareerForm] = useState(null);

  const saveCareer = async (e) => {
    e.preventDefault();
    if (careerForm.id) {
      await authApi().put(`${endpoints.career}${careerForm.id}/`, careerForm);
    } else {
      await authApi().post(endpoints.career, careerForm);
    }
    setCareerForm(null);
    onReload();
  };

  const deleteCareer = async (id) => {
    if (confirm('Xóa kinh nghiệm này?')) {
      await authApi().delete(`${endpoints.career}${id}/`);
      onReload();
    }
  };

  return (
    <div className="card border-0 shadow-sm p-3 mb-3">
      <div className="d-flex justify-content-between mb-2">
        <h6 className="fw-bold m-0">Kinh nghiệm</h6>
        <button 
          className="btn btn-sm btn-light text-primary" 
          onClick={() => setCareerForm({ company: '', position: '', description: '' })}
        >
          + Thêm
        </button>
      </div>

      {careerForm && (
        <form onSubmit={saveCareer} className="bg-light p-2 rounded mb-2 row g-2">
          <div className="col-3">Tên Công ty</div>
          <div className="col-9"><input className="form-control form-control-sm" placeholder="Công ty" value={careerForm.company} onChange={e => setCareerForm({ ...careerForm, company: e.target.value })} required /></div>
          <div className="col-3">Vị trí làm việc</div>
          <div className="col-9"><input className="form-control form-control-sm" placeholder="Vị trí" value={careerForm.position} onChange={e => setCareerForm({ ...careerForm, position: e.target.value })} required /></div>
          <div className="col-3">Mô tả công việc</div>
          <div className="col-12"><input className="form-control form-control-sm" placeholder="Mô tả" value={careerForm.description} onChange={e => setCareerForm({ ...careerForm, description: e.target.value })} /></div>
          <div className="col-12 text-end">
            <button type="button" className="btn btn-sm me-1" onClick={() => setCareerForm(null)}>Hủy</button>
            <button className="btn btn-success btn-sm">Lưu</button>
          </div>
        </form>
      )}

      {(Array.isArray(careers) ? careers : []).map(c => (
        <div key={c.id} className="d-flex justify-content-between align-items-center border-bottom py-1">
          <div>
            <div className="fw-semibold small">{c.position} - <span className="text-muted">{c.company}</span></div>
            <div className="text-muted extra-small">{c.description}</div>
          </div>
          <div>
            <button className="btn btn-link btn-sm p-0 me-2" onClick={() => setCareerForm(c)}>Sửa</button>
            <button className="btn btn-link btn-sm p-0 text-danger" onClick={() => deleteCareer(c.id)}>Xóa</button>
          </div>
        </div>
      ))}
    </div>
  );
}