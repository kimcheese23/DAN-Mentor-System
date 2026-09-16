import { useState, useEffect } from 'react';
import Pagination from './Pagination';
import { completeTask, createTask, getTasks, updateTask, deleteTask } from '../services/mentorshipService';

export const TaskList = ({ milestoneId, isMentor, onTaskUpdated }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks(milestoneId, page);
      setTasks(Array.isArray(data) ? data : data.results || []);
      setTotalPages(Array.isArray(data) ? 1 : Math.ceil((data.count || 0) / 8));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchTasks());
  }, [milestoneId, page]);

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTaskId) {
        await updateTask(editingTaskId, { title, description: desc, deadline: deadline || null });
        setEditingTaskId(null);
      } else {
        await createTask(milestoneId, { title, description: desc, deadline: deadline || null });
        setShowCreate(false);
      }
      setTitle(''); setDesc(''); setDeadline('');
      fetchTasks();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi lưu nhiệm vụ');
    }
  };

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDesc(task.description || '');
    setDeadline(task.deadline || '');
    setShowCreate(false);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhiệm vụ này?')) return;
    try {
      await deleteTask(taskId);
      fetchTasks();
      if (onTaskUpdated) onTaskUpdated();
    } catch {
      alert('Không thể xóa nhiệm vụ');
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await completeTask(taskId);
      fetchTasks();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi cập nhật');
    }
  };

  return (
    <div className="mt-3 ps-3 border-start border-2 border-primary">
      <div className="d-flex justify-content-between align-items-center mb-2">
        {isMentor && !editingTaskId && (
          <button
            className="btn btn-sm btn-primary py-0 px-2 rounded-pill"
            onClick={() => {
              setShowCreate(!showCreate);
              setTitle(''); setDesc(''); setDeadline('');
            }}
          >
            {showCreate ? 'Hủy' : 'Thêm nhiệm vụ'}
          </button>
        )}
      </div>

      {(showCreate || editingTaskId) && (
        <form onSubmit={handleSaveTask} className="p-2 mb-3 bg-white border rounded shadow-sm">
          <h6 className="small fw-bold text-primary mb-2">
            {editingTaskId ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}
          </h6>
          <input
            className="form-control form-control-sm mb-1"
            placeholder="Tiêu đề nhiệm vụ"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="form-control form-control-sm mb-1"
            placeholder="Mô tả công việc..."
            rows="2"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <input
            type="date"
            className="form-control form-control-sm mb-2"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div className="d-flex gap-1 justify-content-end">
            <button
              type="button"
              className="btn btn-sm btn-light border py-0"
              onClick={() => { setShowCreate(false); setEditingTaskId(null); }}
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-sm btn-success py-0 px-3">
              Lưu
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="spinner-border spinner-border-sm text-primary"></div>
      ) : tasks.length === 0 ? (
        <div className="text-muted small fst-italic">Chưa có nhiệm vụ nào trong chặng này.</div>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="mb-2 p-2 bg-light rounded-2 border-start border-3 border-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className={`fw-bold small ${task.is_done ? 'text-decoration-line-through text-muted' : ''}`}>
                  {task.title}
                </span>
                {task.deadline && (
                  <span className="text-muted ms-2">
                    (Hạn: {new Date(task.deadline).toLocaleDateString('vi-VN')})
                  </span>
                )}
                {task.description && <div className="text-secondary small mt-1">{task.description}</div>}
              </div>

              <div className="d-flex gap-1 align-items-center">
                {isMentor && !task.is_done && (
                  <>
                    <button
                      className="btn btn-sm btn-light text-secondary p-0 px-1"
                      title="Sửa"
                      onClick={() => startEdit(task)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger p-0 px-1"
                      title="Xóa"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Xóa
                    </button>
                    <button className="btn btn-sm btn-outline-primary py-0 px-2" onClick={() => handleComplete(task.id)}>
                      Hoàn thành
                    </button>
                  </>
                )}
                {task.is_done && <span className="badge bg-success small">Đã xong</span>}
              </div>
            </div>
          </div>
        ))
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
      )}
    </div>
  );
};