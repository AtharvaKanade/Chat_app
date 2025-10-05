import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function Chat({ user }) {
  const [roomId, setRoomId] = useState('general');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoomName, setJoinRoomName] = useState('');
  const [joinRoomPassword, setJoinRoomPassword] = useState('');
  const [joinModalError, setJoinModalError] = useState('');
  const messagesContainerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await axios.get(`${API_BASE}/api/rooms`, {
          withCredentials: true,
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
        setRooms(res.data);
      } catch (_e) {}
    }
    loadRooms();
  }, [user]);
  const [roomToken, setRoomToken] = useState('');
  const [joinError, setJoinError] = useState('');
  const [roomMeta, setRoomMeta] = useState({ exists: false, isPrivate: false });
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = user?.token;
    const socket = io(API_BASE, { auth: { token } });
    socketRef.current = socket;
    socket.on('message:new', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('room:update', (payload) => {
      if (payload?.name === roomId) {
        setRoomMeta((prev) => ({ ...prev, isPrivate: !!payload.isPrivate }));
        setAuthorized(!payload.isPrivate ? true : false);
        if (payload.isPrivate) {
          setMessages([]);
        }
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Track whether user is at bottom to enable/disable auto-scroll
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
      autoScrollRef.current = atBottom;
      setAutoScroll(atBottom);
    };
    el.addEventListener('scroll', onScroll);
    // Initialize state based on starting position
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  function scrollToBottom(smooth) {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }

  // When messages change, auto-scroll if the user is at bottom
  useEffect(() => {
    if (autoScrollRef.current) {
      requestAnimationFrame(() => scrollToBottom(true));
    }
  }, [messages]);

  useEffect(() => {
    async function checkRoom() {
      try {
        const res = await axios.get(`${API_BASE}/api/rooms/${roomId}`, {
          withCredentials: true,
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
        setRoomMeta(res.data);
        setRoomToken('');
        if (!res.data.isPrivate) {
          setAuthorized(true);
          setIsPrivate(false);
        } else {
          setAuthorized(false);
          setIsPrivate(true);
        }
      } catch (_e) {
        setRoomMeta({ exists: false, isPrivate: false });
        setAuthorized(true);
      }
    }
    if (roomId) checkRoom();
  }, [roomId, user]);

  useEffect(() => {
    async function joinAndLoad() {
      try {
        let tokenForRoom = roomToken;
        if (isPrivate) {
          if (!tokenForRoom) {
            const jr = await axios.post(`${API_BASE}/api/rooms/join`, { name: roomId, password: roomPassword }, {
              withCredentials: true,
              headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
            });
            tokenForRoom = jr.data.token;
            setRoomToken(tokenForRoom);
          }
          setAuthorized(true);
        } else {
          setRoomToken('');
          setAuthorized(true);
        }

        socketRef.current?.emit('join', { roomId, roomToken: tokenForRoom, roomPassword: isPrivate ? roomPassword : undefined });

        const res = await axios.get(`${API_BASE}/api/messages/${roomId}`, {
          withCredentials: true,
          headers: {
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
            ...(tokenForRoom ? { 'x-room-token': tokenForRoom } : {}),
          },
        });
        setMessages(res.data);
        setJoinError('');
        // After initial load, jump to the latest (bottom)
        setTimeout(() => {
          scrollToBottom(false);
          autoScrollRef.current = true;
          setAutoScroll(true);
        }, 0);
      } catch (e) {
        setJoinError(e.response?.data?.error || 'Unable to load messages');
        setAuthorized(false);
      }
    }
    if (roomId && (!roomMeta.isPrivate || (roomMeta.isPrivate && roomPassword))) {
      joinAndLoad();
    } else {
      setMessages([]);
    }
  }, [roomId, isPrivate, roomPassword, user, roomMeta.isPrivate, roomToken]);

  function sendMessage(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    socketRef.current?.emit('message:send', { roomId, text: trimmed });
    setText('');
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <span>💬</span>
          <span>Chat Room: {roomId}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setCreateError('');
              setNewRoomName('');
              setNewRoomPrivate(false);
              setNewRoomPassword('');
              setShowCreateModal(true);
            }}
          >
            <span style={{ marginRight: 8 }}>➕</span> Create
          </button>

          <div className="room-selector" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>Room:</label>
            <span className={`room-badge ${roomMeta.isPrivate ? 'room-badge-lock' : ''}`}>
              {roomId} {roomMeta.isPrivate ? '🔒' : ''}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setJoinModalError('');
              setJoinRoomName('');
              setJoinRoomPassword('');
              setShowJoinModal(true);
            }}
          >
            Join Room
          </button>

          

          <div className="user-info">
            <span>👤</span>
            <span>{user.username}</span>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="auth-title" style={{ margin: 0 }}>Create Room</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Room name</label>
                <input
                  className="form-input"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Unique room name"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="form-label" style={{ margin: 0 }}>Protected</label>
                <input type="checkbox" checked={newRoomPrivate} onChange={(e) => setNewRoomPrivate(e.target.checked)} />
              </div>
              {newRoomPrivate && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    placeholder="Room password"
                  />
                </div>
              )}
              {createError && <div className="alert alert-error">{createError}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  setCreateError('');
                  try {
                    const body = { name: newRoomName.trim(), isPrivate: newRoomPrivate, password: newRoomPrivate ? newRoomPassword : '' };
                    if (!body.name) {
                      setCreateError('Room name is required');
                      return;
                    }
                    await axios.post(`${API_BASE}/api/rooms/upsert`, body, {
                      withCredentials: true,
                      headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
                    });
                    const list = await axios.get(`${API_BASE}/api/rooms`, {
                      withCredentials: true,
                      headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
                    });
                    setRooms(list.data);
                    setRoomId(body.name);
                    setShowCreateModal(false);
                  } catch (err) {
                    setCreateError(err.response?.data?.error || 'Failed to create room');
                  }
                }}
              >
                <span style={{ marginRight: 8 }}>➕</span> Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="auth-title" style={{ margin: 0 }}>Join Room</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Room name</label>
                <input
                  className="form-input"
                  value={joinRoomName}
                  onChange={(e) => setJoinRoomName(e.target.value)}
                  placeholder="Existing room name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password (if protected)</label>
                <input
                  className="form-input"
                  type="password"
                  value={joinRoomPassword}
                  onChange={(e) => setJoinRoomPassword(e.target.value)}
                  placeholder="Room password (optional)"
                />
              </div>
              {joinModalError && <div className="alert alert-error">{joinModalError}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setShowJoinModal(false)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  setJoinModalError('');
                  const target = joinRoomName.trim();
                  if (!target) {
                    setJoinModalError('Room name is required');
                    return;
                  }
                  try {
                    const meta = await axios.get(`${API_BASE}/api/rooms/${encodeURIComponent(target)}`, {
                      withCredentials: true,
                      headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
                    });
                    if (!meta.data.exists) {
                      setJoinModalError('Room does not exist');
                      return;
                    }
                    if (meta.data.isPrivate) {
                      const jr = await axios.post(`${API_BASE}/api/rooms/join`, { name: target, password: joinRoomPassword }, {
                        withCredentials: true,
                        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
                      });
                      setRoomPassword(joinRoomPassword);
                      setRoomToken(jr.data.token);
                      setIsPrivate(true);
                      setAuthorized(true);
                    } else {
                      setRoomPassword('');
                      setRoomToken('');
                      setIsPrivate(false);
                      setAuthorized(true);
                    }
                    setRoomId(target);
                    setShowJoinModal(false);
                  } catch (err) {
                    setJoinModalError(err.response?.data?.error || 'Failed to join room');
                  }
                }}
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chat-messages" ref={messagesContainerRef}>
        {!authorized && (
          <div className="messages-container">
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              This room is protected. Enter the correct password to view messages.
            </div>
          </div>
        )}
        {joinError && (
          <div className="messages-container">
            <div className="alert alert-error" style={{ marginBottom: 16 }}>{joinError}</div>
          </div>
        )}
        <div className="messages-container">
          {messages.map((m) => {
            const normalizedSenderId = typeof m.senderId === 'string' ? m.senderId : (m.senderId?._id || '');
            const isOwn = normalizedSenderId === user.id;
            const displayName = isOwn
              ? user.username
              : (m.senderUsername || (typeof m.senderId === 'object' ? m.senderId?.username : m.senderId) || 'User');
            const avatarText = (displayName || 'U').charAt(0).toUpperCase();

            return (
              <div key={m._id} className={`message ${isOwn ? 'own-message' : ''}`}>
                <div className="message-avatar">{avatarText}</div>

                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">{displayName}</span>
                    <span className="message-time">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="message-bubble">{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chat-input-container">
        <form
          className="chat-input-form"
          onSubmit={sendMessage}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey && isPrivate) {
              // attempt to join protected room via token first
              e.preventDefault();
            }
          }}
        >
          <textarea
            className="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />
          <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
            <span style={{ marginRight: 8 }}>📤</span>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}


