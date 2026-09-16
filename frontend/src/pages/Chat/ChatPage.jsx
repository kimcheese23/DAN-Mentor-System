import { useEffect, useState } from "react";
import api, { endpoints } from "../../services/api";
import MySpinner from "../../components/MySpinner";
import ConversationList from "./ConversationList";
import MessageBox from "./MessageBox";

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadConversations = async () => {
    try {
      const res = await api.get(endpoints.chatConversations);
      const data = res.data.results || res.data;
      setConversations(data);

      if (data.length > 0) {
        setSelected(data[0]);
      }
    } catch (err) {
      console.error("Lỗi danh sách cuộc trò chuyện:", err);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    Promise.resolve().then(() => loadConversations());
  }, []);

  if (loading) return <MySpinner />;

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-4 col-md-5">
          <ConversationList
            conversations={conversations}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <div className="col-lg-8 col-md-7">
          {selected ? (
            <MessageBox conversation={selected} />
          ) : (
            <div>
              <i className="bi bi-chat-square-text display-4 mb-3"></i>
              <p>Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}