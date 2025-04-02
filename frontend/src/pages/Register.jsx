import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", { autoConnect: false });

export default function Register() {
  const navigate = useNavigate();
  const [userID, setUserID] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    const storedUsername = localStorage.getItem("username");

    if (storedUserID && storedUsername) {
      if (!socket.connected) {
        socket.connect(); // Connect only if not already connected
        socket.emit("join", storedUserID, storedUsername);
        console.log(`📡 Rejoined: ${storedUsername} (${storedUserID})`);
      }
      navigate("/chat");
    }
  }, [navigate]);

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:5000/register", {
        userID,
        username,
      });

      localStorage.setItem("userID", res.data.userID);
      localStorage.setItem("username", res.data.username);

      if (!socket.connected) {
        socket.connect();
        socket.emit("join", res.data.userID, res.data.username);
        console.log(
          `📡 New user joined: ${res.data.username} (${res.data.userID})`
        );
      }

      navigate("/chat");
    } catch (error) {
      alert(error.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="register">
      <h1>Register</h1>
      <input
        type="text"
        placeholder="User ID"
        value={userID}
        onChange={(e) => setUserID(e.target.value)}
      />
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button className="register-btn" onClick={handleRegister}>
        Register
      </button>
    </div>
  );
}
