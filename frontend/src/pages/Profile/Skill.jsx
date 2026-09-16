import { useState } from 'react';

export default function Skill({ allSkills, mySkillIds, onToggleSkill }) {
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(allSkills.map(s => s.category).filter(Boolean)))];
  
  const modalSkills = allSkills.filter(s => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    const matchSearch = s.name.toLowerCase().includes(skillSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <div className="card border-0 shadow-sm p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold m-0">Kỹ năng cá nhân</h6>
          <button className="btn btn-sm btn-light text-primary" onClick={() => setShowSkillModal(true)}>+ Thêm</button>
        </div>
        <div className="d-flex flex-wrap gap-1">
          {mySkillIds.length > 0 ? mySkillIds.map(id => {
            const skill = allSkills.find(s => s.id === id);
            return skill ? (
              <span key={id} className="badge bg-primary d-inline-flex align-items-center gap-1 p-2">
                {skill.name}
                <button type="button" className="btn-close btn-close-white" onClick={() => onToggleSkill(id)}></button>
              </span>
            ) : null;
          }) : <span className="text-muted small">Chưa chọn kỹ năng nào.</span>}
        </div>
      </div>

      {showSkillModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content p-3">
              <div className="d-flex justify-content-between mb-2">
                <h6 className="fw-bold m-0">Chọn Kỹ Năng</h6>
                <button type="button" className="btn-close" onClick={() => setShowSkillModal(false)}></button>
              </div>
              <input type="text" className="form-control form-control-sm mb-2" placeholder="Tìm kỹ năng..." value={skillSearch} onChange={e => setSkillSearch(e.target.value)} />
              <div className="d-flex gap-1 overflow-x-auto pb-2 mb-2">
                {categories.map(cat => (
                  <button key={cat} type="button" className={`btn btn-sm ${activeCategory === cat ? 'btn-dark' : 'btn-light'}`} onClick={() => setActiveCategory(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }} className="d-flex flex-wrap gap-1 p-1 border rounded mb-2">
                {modalSkills.map(s => {
                  const selected = mySkillIds.includes(s.id);
                  return (
                    <button key={s.id} type="button" className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => onToggleSkill(s.id)}>
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <div className="text-end">
                <button className="btn btn-sm btn-success px-3" onClick={() => setShowSkillModal(false)}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}