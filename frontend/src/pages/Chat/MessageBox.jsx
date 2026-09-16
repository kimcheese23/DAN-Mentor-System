import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { endpoints } from '../../services/api';
import ImageShow from '../../components/ImageShow';

export default function MessageBox({ conversation }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    const isMentor = conversation.mentor === user?.id;
    const partnerName = isMentor ? conversation.mentee_name : conversation.mentor_name;
    const partnerAvatar = isMentor ? conversation.mentee_avatar : conversation.mentor_avatar;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const res = await api.get(
                    endpoints.chatMessages(conversation.id)
                );
                setMessages(res.data.results || res.data);
            } catch (err) {
                console.error("Lỗi tải tin nhắn:", err);
            }
        };

        const token = localStorage.getItem('access_token');

        const socket = new WebSocket(
            `ws://127.0.0.1:8000/ws/chat/${conversation.id}/?token=${token}`
        );

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages(prev => [...prev, data]);
        };

        socketRef.current = socket;

        loadMessages();

        return () => {
            socket.close();
        };
    }, [conversation.id]);

    const sendMessage = () => {
        if (!content.trim() || !socketRef.current) return;
        if (socketRef.current.readyState !== WebSocket.OPEN) return;

        socketRef.current.send(JSON.stringify({ content }));
        setContent('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column" style={{ height: '550px' }}>
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center">
                <ImageShow
                    src={partnerAvatar}
                    name={partnerName}
                    size={35}
                    shape="circle"
                />
                <div>
                    <h6 className="mb-0 fw-bold">{partnerName}</h6>
                </div>
            </div>

            <div className="card-body p-4 overflow-auto flex-grow-1 bg-light">
                {messages.map((msg, index) => {
                    const isMe = msg.sender === user?.id || msg.sender_id === user?.id;
                    return (
                        <div
                            key={msg.id || msg.message_id || index}
                            className={`d-flex flex-column mb-3 ${isMe ? 'align-items-end' : 'align-items-start'}`}
                        >
                            <div
                                className={`p-3 rounded-4 shadow-sm position-relative style-bubble ${isMe
                                    ? 'bg-primary text-white rounded-bottom-end-0'
                                    : 'bg-white text-dark rounded-bottom-start-0 border'
                                    }`}
                                style={{ maxWidth: '70%', wordBreak: 'break-word' }}
                            >
                                {!isMe && msg.sender_name && (
                                    <div className="fw-bold mb-1 text-primary" style={{ fontSize: '0.75rem' }}>
                                        {msg.sender_name}
                                    </div>
                                )}
                                <div style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{msg.content}</div>
                            </div>

                            {msg.created_at && (
                                <small className="text-muted mt-1 px-1" style={{ fontSize: '0.7rem' }}>
                                    {new Date(msg.created_at).toLocaleString('vi-VN', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric', 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </small>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="card-footer bg-white border-top p-3">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control border-0 bg-light rounded-pill px-4"
                        placeholder="Nhập tin nhắn..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ boxShadow: 'none' }}
                    />
                    <button
                        className="btn btn-primary ms-2 d-flex align-items-center justify-content-center"
                        onClick={sendMessage}
                        disabled={!content.trim()}
                        style={{ width: '42px', height: '42px' }}
                    >Gửi
                    </button>
                </div>
            </div>
        </div>
    );
}