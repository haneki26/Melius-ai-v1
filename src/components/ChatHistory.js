import React from 'react';

function ChatHistory({ isOpen, onClose, chats, currentChatId, onLoadChat, onNewChat, onDeleteChat }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group chats by date
  const grouped = chats.reduce((acc, chat) => {
    const label = formatDate(chat.updated_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(chat);
    return acc;
  }, {});

  return (
    <>
      {isOpen && <div className="log-overlay" onClick={onClose} />}

      <div className={`chat-history-panel ${isOpen ? 'chat-history-panel--open' : ''}`}>
        <div className="chat-history-header">
          <div>
            <p className="log-panel-eyebrow">Conversations</p>
            <h2 className="log-panel-title">Chat History</h2>
          </div>
          <button className="log-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* New chat button */}
        <div className="chat-history-new">
          <button className="chat-history-new-btn" onClick={onNewChat}>
            <span>✦</span> New chat
          </button>
        </div>

        <div className="chat-history-content">
          {chats.length === 0 ? (
            <div className="log-empty">
              <span className="log-empty-icon">💬</span>
              <p className="log-empty-title">No chats yet</p>
              <p className="log-empty-desc">Your conversations will be saved here automatically.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([label, groupChats]) => (
              <div key={label} className="chat-history-group">
                <p className="chat-history-group-label">{label}</p>
                {groupChats.map(chat => (
                  <div
                    key={chat.id}
                    className={`chat-history-item ${currentChatId === chat.id ? 'chat-history-item--active' : ''}`}
                  >
                    <button
                      className="chat-history-item-btn"
                      onClick={() => onLoadChat(chat.id)}
                    >
                      <span className="chat-history-item-icon">💬</span>
                      <span className="chat-history-item-title">{chat.title}</span>
                    </button>
                    <button
                      className="chat-history-item-delete"
                      onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                      title="Delete chat"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default ChatHistory;