// =============================================================================
// Chat.jsx — Chat messages and guess input component
// =============================================================================

import { useEffect, useRef, useState } from "react";
import "./Chat.css";

export default function Chat({ messages, onSendMessage, isDrawer, status }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const isPlaying = status === "playing";
  const disabled = isDrawer && isPlaying;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span className="chat-title">Chat & Guesses</span>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg) => {
          let className = "chat-message ";
          if (msg.type === "system") className += "type-system";
          else if (msg.type === "close") className += "type-close";
          else if (msg.type === "correct") className += "type-correct";
          else className += "type-chat";

          return (
            <div key={msg.id} className={className}>
              {msg.type === "chat" && (
                <span className="chat-author">{msg.playerName}:</span>
              )}
              {msg.message}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            className="chat-input"
            type="text"
            placeholder={
              disabled 
                ? "You're drawing! Shhh..." 
                : "Type your guess here..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            autoComplete="off"
            maxLength={100}
          />
          <button 
            type="submit" 
            className="btn btn-primary chat-send-btn"
            disabled={disabled || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
