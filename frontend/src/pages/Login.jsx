import { useState } from "react";
import axios from "axios";

export default function Login({ onLogin }) {
  const [userID, setUserID] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!userID || !username) {
      setError("User ID and Username required");
      return;
    }

    try {
      await axios.post("http://localhost:5000/register", { userID, username });
      localStorage.setItem("userID", userID);
      localStorage.setItem("username", username);
      onLogin(userID, username);
    } catch (err) {
      setError("Failed to register. Try a different User ID.", err);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p>{error}</p>}
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
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
