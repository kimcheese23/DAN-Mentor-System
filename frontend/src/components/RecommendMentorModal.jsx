import { useState } from "react";

export default function RecommendMentorModal({show, onClose, allSkills, onSubmit}) {
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  if (!show) return null;

  const categories = ["All", ...Array.from(
      new Set(allSkills.map(s => s.category).filter(Boolean))
    )
  ];

  const modalSkills = allSkills.filter(s => {
    const matchCategory = activeCategory === "All" || s.category === activeCategory;
    const matchSearch = s.name.toLowerCase().includes(skillSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  const toggleSkill = (skillId) => {
    if (selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds(
        selectedSkillIds.filter(
          id => id !== skillId
        )
      );
    } else {
      setSelectedSkillIds([...selectedSkillIds, skillId]);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{
        background: "rgba(0,0,0,0.5)"
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content p-3">
          <div className="d-flex justify-content-between mb-2">
            <h5 className="fw-bold">
              Chọn kỹ năng muốn học
            </h5>
            <button className="btn-close" onClick={onClose}/>
          </div>

          <input
            className="form-control mb-2"
            placeholder="Tìm kỹ năng..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
          />

          <div className="d-flex gap-1 overflow-auto mb-2">
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn btn-sm ${activeCategory === cat ? "btn-dark" : "btn-light" }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            className="border rounded p-2 d-flex flex-wrap gap-1"
            style={{maxHeight: "250px", overflowY: "auto"}}
          >
            {modalSkills.map(skill => {
              const selected = selectedSkillIds.includes(skill.id);

              return (
                <button
                  key={skill.id}
                  className={`btn btn-sm ${selected ? "btn-primary" : "btn-outline-secondary" }`}
                  onClick={() => toggleSkill(skill.id)}
                >
                  {skill.name}
                </button>
              );
            })}
          </div>

          <div className="text-end mt-3">
            <button
              className="btn btn-success"
              onClick={() => onSubmit(selectedSkillIds)}
            >
              Tìm Mentor phù hợp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}