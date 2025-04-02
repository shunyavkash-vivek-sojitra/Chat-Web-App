import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    const username = localStorage.getItem("username");

    if (userID && username) {
      navigate("/chat");
    }
  }, [navigate]);

  const [userID, setUserID] = useState("");
  const [username, setUsername] = useState("");

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:5000/register", {
        userID,
        username,
      });

      localStorage.setItem("userID", res.data.userID);
      localStorage.setItem("username", res.data.username);
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
