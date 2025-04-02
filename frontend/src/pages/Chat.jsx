import { useState, useEffect } from "react";
import axios from "axios";
import socketIOClient from "socket.io-client";

const socket = socketIOClient("http://localhost:5000");

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [isGroup, setIsGroup] = useState(false);

  useEffect(() => {
    const fetchUsersAndGroups = async () => {
      const usersRes = await axios.get("http://localhost:5000/users");
      const groupsRes = await axios.get("http://localhost:5000/groups");
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
    };

    fetchUsersAndGroups();

    socket.on("update-users", (updatedUsers) => setUsers(updatedUsers));
    socket.on("update-groups", (updatedGroups) => setGroups(updatedGroups));
  }, []);

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    const username = localStorage.getItem("username");

    if (userID && username) {
      socket.emit("join", userID, username);
    }
  }, []);

  useEffect(() => {
    socket.on("receive-message", (message) => {
      if (
        (message.receiverID === selectedChat?._id && !isGroup) ||
        (isGroup && message.groupID === selectedChat?._id)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => socket.off("receive-message");
  }, [selectedChat, isGroup]);

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !selectedChat) return;

    const messageData = {
      senderID: localStorage.getItem("userID"),
      senderUsername: localStorage.getItem("username"),
      message: currentMessage,
      ...(isGroup
        ? { groupID: selectedChat._id }
        : { receiverID: selectedChat._id }),
    };

    socket.emit(isGroup ? "send-group-message" : "send-message", messageData);
    setMessages([
      ...messages,
      { ...messageData, senderUsername: "You", _id: Date.now() },
    ]);
    setCurrentMessage("");
  };

  return (
    <div className="app">
      <div className="sidebar">
        <h3>Users</h3>
        <ul className="user-list">
          {users.map((user) => (
            <li
              key={user._id}
              onClick={() => {
                setSelectedChat(user);
                setIsGroup(false);
                setMessages([]);
              }}
              className={
                selectedChat?._id === user._id && !isGroup ? "active" : ""
              }
            >
              {user.username}
            </li>
          ))}
        </ul>

        <h3>Groups</h3>
        <ul className="user-list">
          {groups.map((group) => (
            <li
              key={group._id}
              onClick={() => {
                setSelectedChat(group);
                setIsGroup(true);
                setMessages([]);
              }}
              className={
                selectedChat?._id === group._id && isGroup ? "active" : ""
              }
            >
              {group.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="chat">
        <div className="chat-header">
          {selectedChat
            ? isGroup
              ? `Group: ${selectedChat.name}`
              : `Chat with ${selectedChat.username}`
            : "Select a chat"}
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

        {selectedChat && (
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
