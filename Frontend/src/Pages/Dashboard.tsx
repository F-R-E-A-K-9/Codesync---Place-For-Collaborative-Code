import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Dashboard = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  async function handleCreateRoom() {
    if (!roomName.trim()) {
      toast.error("Give your session a name first");
      return;
    }
    const token = localStorage.getItem("authorization");
    try {
      setCreating(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}api/v1/create-room`,
        { roomname: roomName },
        { headers: { authorization: token } },
      );
      toast.success(response.data.message);
      navigate(`/Codeeditor/${response.data.roomId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinRoom() {
    if (!roomId.trim()) {
      toast.error("Enter a session ID first");
      return;
    }
    const token = localStorage.getItem("authorization");
    try {
      setJoining(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}api/v1/join-room/${roomId}`,
        { headers: { authorization: token } },
      );
      toast.success(response.data.message);
      navigate(`/Codeeditor/${roomId}`);
    } catch (err: any) {
      if (err.response?.data?.isExpired) {
        localStorage.removeItem("authorization");
        localStorage.removeItem("username");
        navigate("/");
      }
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setJoining(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("authorization");
    localStorage.removeItem("username");
    navigate("/");
  }
  return (
    <div className="min-h-screen bg-paper font-sans text-ink relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.4] bg-[linear-gradient(rgba(45,95,138,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(45,95,138,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-blueprint/15">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm border-2 border-blueprint flex items-center justify-center">
            <div className="w-2 h-2 bg-amber rounded-full" />
          </div>
          <span className="font-display text-xl text-ink">CodeSync</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-ink-soft hover:text-rust transition-colors"
        >
          Sign out
        </button>
      </nav>

      <div className="relative z-10 px-6 md:px-12 py-16 max-w-[900px] mx-auto">
        <div className="font-mono text-xs text-blueprint mb-3 tracking-wide">
          WORKSPACE
        </div>
        <h1 className="font-display text-4xl text-ink mb-2">
          Start a session, or join one.
        </h1>
        <p className="text-ink-soft mb-12">
          Signed in as {localStorage.getItem("username") || "you"}.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1 — Create */}
          <div className="bg-paper-raised border-2 border-blueprint/20 rounded-lg p-7 shadow-[6px_6px_0px_0px_rgba(45,95,138,0.1)]">
            <div className="w-9 h-9 rounded-md bg-blueprint-soft flex items-center justify-center mb-5">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2D5F8A"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <h2 className="font-medium text-lg text-ink mb-1">New session</h2>
            <p className="text-sm text-ink-soft mb-5">
              Spin up an empty room and share the ID with someone.
            </p>

            <label className="text-xs text-ink-soft block mb-1.5">
              Session name
            </label>
            <input
              type="text"
              placeholder="e.g. mock-interview-1"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full border border-blueprint/25 rounded-md px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-blueprint mb-4"
            />

            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="w-full py-3 bg-amber hover:bg-amber-dark disabled:opacity-60 text-white rounded-md font-medium transition-colors"
            >
              {creating ? "Creating..." : "Create session"}
            </button>
          </div>

          {/* Card 2 — Join */}
          <div className="bg-paper-raised border-2 border-blueprint/20 rounded-lg p-7 shadow-[6px_6px_0px_0px_rgba(45,95,138,0.1)]">
            <div className="w-9 h-9 rounded-md bg-blueprint-soft flex items-center justify-center mb-5">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2D5F8A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
            </div>
            <h2 className="font-medium text-lg text-ink mb-1">
              Join a session
            </h2>
            <p className="text-sm text-ink-soft mb-5">
              Enter the ID your host shared with you.
            </p>

            <label className="text-xs text-ink-soft block mb-1.5">
              Session ID
            </label>
            <input
              type="text"
              placeholder="e.g. 7GX4Q"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full border border-blueprint/25 rounded-md px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-blueprint mb-4"
            />

            <button
              onClick={handleJoinRoom}
              disabled={joining}
              className="w-full py-3 bg-paper border-2 border-blueprint text-blueprint hover:bg-blueprint-soft disabled:opacity-60 rounded-md font-medium transition-colors"
            >
              {joining ? "Joining..." : "Join session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
