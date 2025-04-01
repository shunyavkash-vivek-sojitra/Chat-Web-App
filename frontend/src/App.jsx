import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
}
