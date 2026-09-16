import ImageShow from '../../components/ImageShow';
import { authApi, endpoints } from '../../services/api';

export default function PersonalInfo({ user, setUser }) {
    const uploadAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await authApi().patch(endpoints.me, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser({ ...user, avatar: res.data.avatar });
            alert('Đã cập nhật ảnh đại diện!');
        } catch (err) {
            console.error(err);
            alert('Lỗi cập nhật ảnh!');
        }
    };

    const saveUser = async (e) => {
        e.preventDefault();
        await authApi().patch(endpoints.me, { full_name: user.full_name, phone: user.phone });
        alert('Đã cập nhật thông tin!');
    };

    return (
        <div className="card border-0 shadow-sm p-3 mb-3">
            <h6 className="fw-bold mb-3">Thông tin cá nhân</h6>
            <div className="d-flex flex-column align-items-center mb-3">
                <ImageShow
                    src={user.avatar}
                    name={user.full_name}
                    size={120}
                    shape="circle"
                    className="mb-2"
                />
                <label className="btn btn-sm btn-outline-secondary" style={{ cursor: 'pointer' }}>
                    Đổi ảnh
                    <input type="file" accept="image/*" hidden onChange={uploadAvatar} />
                </label>
            </div>
            <form onSubmit={saveUser} className="row g-2">
                <div className="col-3">Email</div>
                <div className="col-9">
                    <input className="form-control form-control-sm bg-light" value={user.email} disabled />
                </div>
                <div className="col-3">Họ và tên</div>
                <div className="col-9">
                    <input
                        className="form-control form-control-sm"
                        placeholder="Họ tên"
                        value={user.full_name}
                        onChange={e => setUser({ ...user, full_name: e.target.value })}
                    />
                </div>
                <div className="col-3">Số điện thoại</div>
                <div className="col-9">
                    <input
                        className="form-control form-control-sm"
                        placeholder="SĐT"
                        value={user.phone || ''}
                        onChange={e => setUser({ ...user, phone: e.target.value })}
                    />
                </div>
                <div className="col-12 text-end">
                    <button className="btn btn-success btn-sm mt-1">Lưu</button>
                </div>
            </form>
        </div>
    );
}