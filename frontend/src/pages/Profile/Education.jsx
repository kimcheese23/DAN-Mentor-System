import { useState } from 'react';
import { authApi, endpoints } from '../../services/api';

export default function Education({ educations, onReload }) {
    const [eduForm, setEduForm] = useState(null);

    const saveEdu = async (e) => {
        e.preventDefault();
        const payload = {
            ...eduForm,
            start_year: eduForm.start_year ? parseInt(eduForm.start_year, 10) : null,
            end_year: eduForm.end_year ? parseInt(eduForm.end_year, 10) : null,
        };

        try {
            if (eduForm.id) {
                await authApi().put(`${endpoints.education}${eduForm.id}/`, payload);
            } else {
                await authApi().post(endpoints.education, payload);
            }
            setEduForm(null);
            onReload();
            alert('Đã lưu thông tin học vấn thành công!');
        } catch (err) {
            console.error(err);
            alert('Không thể lưu thông tin học vấn!');
        }
    };

    const deleteEdu = async (id) => {
        if (confirm('Xóa học vấn này?')) {
            try {
                await authApi().delete(`${endpoints.education}${id}/`);
                onReload();
                alert('Đã xóa học vấn!');
            } catch (err){
                console.error(err);
                alert('Không thể xóa học vấn này!');
            }
        }
    };

    return (
        <div className="card border-0 shadow-sm p-3 mb-3">
            <div className="d-flex justify-content-between mb-2">
                <h6 className="fw-bold m-0">Học vấn</h6>
                <button
                    className="btn btn-sm btn-light text-primary"
                    onClick={() => setEduForm({ institution: '', degree: '', major: '', start_year: '', end_year: '' })}
                >
                    + Thêm
                </button>
            </div>

            {eduForm && (
                <form onSubmit={saveEdu} className="bg-light p-2 rounded mb-2 row g-2">
                    <div className="col-3">Trường</div>
                    <div className="col-9"><input className="form-control form-control-sm" placeholder="Trường" value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} required /></div>
                    <div className="col-3">Bằng cấp</div>
                    <div className="col-9"><input className="form-control form-control-sm" placeholder="Bằng cấp" value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} /></div>
                    <div className="col-3">Ngành học</div>
                    <div className="col-9"><input className="form-control form-control-sm" placeholder="Ngành" value={eduForm.major} onChange={e => setEduForm({ ...eduForm, major: e.target.value })} /></div>
                    <div className="col-3">Năm bắt đầu</div>
                    <div className="col-9"><input className="form-control form-control-sm" type="number" placeholder="Năm Bắt đầu" value={eduForm.start_year || ''} onChange={e => setEduForm({ ...eduForm, start_year: e.target.value })} /></div>
                    <div className="col-3">Năm kết thúc</div>
                    <div className="col-9"><input className="form-control form-control-sm" type="number" placeholder="Năm Kết thúc" value={eduForm.end_year || ''} onChange={e => setEduForm({ ...eduForm, end_year: e.target.value })} /></div>
                    <div className="col-12 text-end">
                        <button type="button" className="btn btn-sm me-1" onClick={() => setEduForm(null)}>Hủy</button>
                        <button className="btn btn-success btn-sm">Lưu</button>
                    </div>
                </form>
            )}

            {(Array.isArray(educations) ? educations : []).map(e => (
                <div key={e.id} className="d-flex justify-content-between align-items-center border-bottom py-1">
                    <div>
                        <div className="fw-semibold small">{e.institution}</div>
                        <div className="text-muted extra-small">{e.degree} {e.major && `- ${e.major}`} ({e.start_year}-{e.end_year || 'Nay'})</div>
                    </div>
                    <div>
                        <button className="btn btn-link btn-sm p-0 me-2" onClick={() => setEduForm(e)}>Sửa</button>
                        <button className="btn btn-link btn-sm p-0 text-danger" onClick={() => deleteEdu(e.id)}>Xóa</button>
                    </div>
                </div>
            ))}
        </div>
    );
}