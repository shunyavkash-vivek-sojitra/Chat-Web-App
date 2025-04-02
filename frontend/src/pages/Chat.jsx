import { useState, useEffect } from "react";
import axios from "axios";
import socketIOClient from "socket.io-client";

const socket = socketIOClient("http://localhost:5000");

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await axios.get("http://localhost:5000/users");
      setUsers(res.data);
    };

    fetchUsers();
    socket.on("update-users", (users) => {
      setUsers(users);
    });
  }, []);

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    const username = localStorage.getItem("username");

    if (userID && username) {
      socket.emit("join", userID, username);
    }
  }, []);

  const handleSendMessage = () => {
    if (selectedUser && currentMessage.trim()) {
      const messageData = {
        senderID: localStorage.getItem("userID"),
        receiverID: selectedUser.userID,
        senderUsername: localStorage.getItem("username"),
        message: currentMessage,
      };

      socket.emit("send-message", messageData);
      setMessages([
        ...messages,
        { ...messageData, senderUsername: "You", _id: Date.now() },
      ]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    socket.on("receive-message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => socket.off("receive-message");
  }, []);

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>Users</h3>
        <ul className="user-list">
          {users.map((user) => (
            <li
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={selectedUser?._id === user._id ? "active" : ""}
            >
              {user.username}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Window */}
      <div className="chat">
        <div className="chat-header">
          {selectedUser
            ? `Chat with ${selectedUser.username}`
            : "Select a user"}
        </div>

        <div className="messages">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${
                msg.senderUsername === "You" ? "sent" : "received"
              }`}
            >
              <strong>{msg.senderUsername}:</strong> {msg.message}
            </div>
          ))}
        </div>

        {/* Input Container */}
        {selectedUser && (
          <div className="input-container">
            <input
              type="text"
              placeholder="Type a message"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
}
