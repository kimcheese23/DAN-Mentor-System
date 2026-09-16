import ImageShow from '../../components/ImageShow';
import { useAuth } from '../../contexts/AuthContext';

export default function ConversationList({
  conversations,
  selected,
  onSelect
}) {
  const { user } = useAuth();

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
      <div className="card-header bg-white border-bottom py-3 px-3">
        <h5 className="fw-bold mb-0 text-primary">
          <i className="bi bi-chat-left-dots-fill me-2"></i>Cuộc trò chuyện
        </h5>
      </div>

      <div className="card-body p-2 overflow-auto" style={{ maxHeight: '650px' }}>
        {conversations.length === 0 ? (
          <div className="text-center text-muted py-4">Chưa có cuộc trò chuyện nào</div>
        ) : (
          conversations.map(item => {
            const isMentor = item.mentor === user?.id;
            const partnerName = isMentor ? item.mentee_name : item.mentor_name;
            const partnerAvatar = isMentor ? item.mentee_avatar : item.mentor_avatar;
            const isSelected = selected?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`d-flex align-items-center p-3 mb-1 rounded-3 transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-light-hover text-dark'
                }`}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <ImageShow 
                  src={partnerAvatar}
                  name={partnerName}
                  size={42}
                  className="me-3 flex-shrink-0"
                />

                <div className="flex-grow-1 overflow-hidden">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="mb-0 fw-semibold text-truncate" style={{ fontSize: '0.95rem' }}>
                      {partnerName || 'Người dùng'}
                    </h6>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}