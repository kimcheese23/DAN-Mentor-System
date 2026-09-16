import { useState, useEffect } from 'react';
import { authApi, endpoints } from '../../services/api';

import PersonalInfo from './PersonalInfo';
import Skill from './Skill';
import Education from './Education';
import Career from './Career';
import Mentor from './Mentor';
import { Modal, Button } from 'react-bootstrap';
import FeedbackList from '../../components/FeedbackList';

export default function Profile() {
  const [user, setUser] = useState({ full_name: '', phone: '', email: '' });
  const [educations, setEducations] = useState([]);
  const [careers, setCareers] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [mySkillIds, setMySkillIds] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const loadData = async () => {
    const api = authApi();

    const results = await Promise.allSettled([
      api.get(endpoints.me),
      api.get(endpoints.education),
      api.get(endpoints.career),
      api.get(endpoints.skill),
      api.get(endpoints.mySkill)
    ]);

    const [uRes, eRes, cRes, sRes, msRes] = results;

    if (uRes.status === 'fulfilled') {
      setUser(uRes.value.data || {});
    }

    if (eRes.status === 'fulfilled') {
      const data = eRes.value.data;
      setEducations(Array.isArray(data) ? data : (data.results || []));
    }

    if (cRes.status === 'fulfilled') {
      const data = cRes.value.data;
      setCareers(Array.isArray(data) ? data : (data.results || []));
    }

    if (sRes.status === 'fulfilled') {
      const data = sRes.value.data;
      setAllSkills(Array.isArray(data) ? data : (data.results || []));
    }

    if (msRes.status === 'fulfilled') {
      const data = msRes.value.data;
      const list = Array.isArray(data) ? data : (data.results || []);

      const ids = list.map(item => {
        if (typeof item === 'number') return item;
        if (item.skill && typeof item.skill === 'object') return item.skill.id;
        if (item.skill_id) return item.skill_id;
        return item.id;
      }).filter(Boolean);

      setMySkillIds(ids);
    }
  };

  useEffect(() => {
    Promise.resolve().then(loadData);
  }, []);

  const toggleSkill = async (skillId) => {
    const nextIds = mySkillIds.includes(skillId)
      ? mySkillIds.filter(id => id !== skillId)
      : [...mySkillIds, skillId];
    setMySkillIds(nextIds);
    await authApi().put(endpoints.mySkill, { skill_ids: nextIds });
  };

  return (
    <div className="container py-4" style={{ maxWidth: '750px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0">Hồ sơ cá nhân</h4>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => setShowFeedbackModal(true)}
          >
            ⭐ Xem đánh giá
          </Button>

          <Mentor allSkills={allSkills} />
        </div>
      </div>
      <Modal 
        show={showFeedbackModal} 
        onHide={() => setShowFeedbackModal(false)} 
        centered 
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Đánh giá về tôi</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {user.id && <FeedbackList mentorId={user.id} />}
        </Modal.Body>
      </Modal>

      <PersonalInfo user={user} setUser={setUser} />
      <Skill
        allSkills={allSkills}
        mySkillIds={mySkillIds}
        onToggleSkill={toggleSkill}
      />
      <Education educations={educations} onReload={loadData} />
      <Career careers={careers} onReload={loadData} />
    </div>
  );
}