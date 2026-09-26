import { Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const languageOptions: Record<string, { monaco: string; jdoodle: string; versionIndex: string; extension: string }> = {
  javascript: { monaco: "javascript", jdoodle: "nodejs", versionIndex: "4", extension: "js" },
  python: { monaco: "python", jdoodle: "python3", versionIndex: "4", extension: "py" },
  c: { monaco: "c", jdoodle: "c", versionIndex: "5", extension: "c" },
  cpp: { monaco: "cpp", jdoodle: "cpp17", versionIndex: "1", extension: "cpp" },
  java: { monaco: "java", jdoodle: "java", versionIndex: "4", extension: "java" },
};

const Codeeditor = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [websocket, setWebsocket] = useState<WebSocket>();
  const [uname, setUname] = useState<string>();
  const [content, setContent] = useState<string>("// write your code here");
  const [executedOutput, setExecutedOutput] = useState<string>();
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [language, setLanguage] = useState<string>("javascript");

  const editorRef = useRef<any>(null);
  const isReceivingRef = useRef(false);
  const isChatOpenRef = useRef(isChatOpen);
  const debounceRef = useRef<any>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep ref synced, clear unread badge when chat opens
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  // Mount: fetch saved content + open websocket
  useEffect(() => {
    async function fetchRoom() {
      try {
        const token = localStorage.getItem("authorization");
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}api/v1/join-room/${roomId}`,
          { headers: { authorization: token } },
        );
        const fetched = response.data.content;
        if (fetched && fetched.trim() !== "") setContent(fetched);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Something went wrong");
        if (err.response?.data?.isExpired) {
          localStorage.removeItem("authorization");
          localStorage.removeItem("username");
          navigate("/");
        } else {
          navigate("/Dashboard");
        }
      }
    }
    fetchRoom();

    const username = localStorage.getItem("username") || "Peer";
    setUname(username);

    const ws = new WebSocket(`${import.meta.env.VITE_WEBSOCKET_URL}`);
    setWebsocket(ws);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { roomId, username },
        }),
      );
    };

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);

      if (parsed.type === "join") {
        if (parsed.payload.username) {
          toast.info(`${parsed.payload.username} joined the session`);
        }
      } else if (parsed.type === "code") {
        const incoming = parsed.payload.content;
        if (editorRef.current && editorRef.current.getValue() !== incoming) {
          isReceivingRef.current = true;
          editorRef.current.setValue(incoming);
          setTimeout(() => {
            isReceivingRef.current = false;
          }, 50);
        }
      } else if (parsed.type === "room_users") {
        setRoomUsers(parsed.userspresent);
      } else if (parsed.type === "chat") {
        const { username, message } = parsed.payload;
        setMessages((prev) => [...prev, `${username} : ${message}`]);
        if (!isChatOpenRef.current) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, []);

  async function storeInDB(value: string) {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}api/v1/save-code`,
        {
          croomId: roomId,
          content: value,
        },
        {
          headers: { authorization: localStorage.getItem("authorization") },
        },
      );
    } catch (err) {
      console.log("Autosave failed:", err);
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    if (isReceivingRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value) {
      debounceRef.current = setTimeout(() => storeInDB(value), 5000);
    }

    websocket?.send(
      JSON.stringify({
        type: "code",
        payload: { roomId, content: value },
      }),
    );
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme("blueprint-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5B6472", fontStyle: "italic" },
        { token: "keyword", foreground: "2D5F8A" },
        { token: "string", foreground: "5C8A66" },
        { token: "number", foreground: "C97D1D" },
      ],
      colors: {
        "editor.background": "#F7F7F3",
        "editor.foreground": "#1B2430",
        "editorLineNumber.foreground": "#B9C2CC",
        "editorLineNumber.activeForeground": "#2D5F8A",
        "editorCursor.foreground": "#E0932C",
        "editor.selectionBackground": "#DCE7EF",
      },
    });
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  async function handleRun() {
    try {
      setRunning(true);
      const token = localStorage.getItem("authorization");
      const liveCode = editorRef.current
        ? editorRef.current.getValue()
        : content;
      const selected = languageOptions[language];

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}api/v1/run-code`,
        {
          content: liveCode,
          language: selected.jdoodle,
          versionindex: selected.versionIndex,
        },
        {
          headers: { authorization: token },
        },
      );

      setExecutedOutput(response.data.output);
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      setExecutedOutput(
        errorData?.message || err.message || "Execution failed",
      );
    } finally {
      setRunning(false);
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const text = chatInputRef.current?.value;
    if (!text) return;

    chatInputRef.current!.value = "";
    setMessages((prev) => [...prev, `You : ${text}`]);

    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(
        JSON.stringify({
          type: "chat",
          payload: { message: text, roomId, username: uname },
        }),
      );
    }
  };
  return (
    <div className="min-h-screen h-screen bg-paper font-sans text-ink flex flex-col overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.4] bg-[linear-gradient(rgba(45,95,138,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(45,95,138,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* ── Title block header ── */}
      <div className="relative z-10 flex items-stretch border-b-2 border-blueprint/25 bg-paper-raised shrink-0">
        <button
          onClick={() => navigate("/Dashboard")}
          className="flex items-center gap-2 px-5 border-r border-blueprint/15 hover:bg-blueprint-soft/40 transition-colors"
        >
          <div className="w-6 h-6 rounded-sm border-2 border-blueprint flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 bg-amber rounded-full" />
          </div>
        </button>

        <div className="flex flex-col justify-center px-5 border-r border-blueprint/15">
          <span className="font-mono text-[10px] text-ink-soft tracking-wide">
            SHEET
          </span>
          <span className="font-mono text-sm text-blueprint">{roomId}</span>
        </div>

        <div className="hidden md:flex flex-col justify-center px-5 border-r border-blueprint/15 flex-1">
          <span className="font-mono text-[10px] text-ink-soft tracking-wide">
            COLLABORATORS
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            {roomUsers.map((user, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full text-white text-[9px] flex items-center justify-center font-medium -ml-1.5 first:ml-0 border border-paper-raised ${i % 2 === 0 ? "bg-blueprint" : "bg-amber"}`}
                title={user}
              >
                {user.charAt(0).toUpperCase()}
              </div>
            ))}
            <span className="text-xs text-ink-soft ml-2">
              {roomUsers.length || 1} here
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5">
          <span className="w-2 h-2 rounded-full bg-sage" />
          <span className="font-mono text-[10px] text-ink-soft tracking-wide">
            LIVE
          </span>
        </div>
      </div>

      {/* ── Main stage: editor + output ── */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0 overflow-y-auto md:overflow-hidden">
        {/* Editor panel */}
        <div className="flex flex-col bg-paper-raised border-2 border-blueprint/20 rounded-lg overflow-hidden shadow-[6px_6px_0px_0px_rgba(45,95,138,0.08)] flex-1 md:flex-[60] h-[45vh] md:h-full">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-blueprint/15">
            <span className="font-mono text-xs text-ink-soft">
              session.{languageOptions[language].extension}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="font-mono text-xs bg-paper border border-blueprint/25 rounded px-2 py-1 text-ink-soft focus:outline-none focus:border-blueprint cursor-pointer"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
              <span className="font-mono text-[10px] text-sage bg-sage/10 border border-sage/25 rounded px-2 py-0.5">
                syncing
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              theme="blueprint-light"
              language={languageOptions[language].monaco}
              value={content}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorMount}
              onChange={handleEditorChange}
              options={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                lineHeight: 22,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                minimap: { enabled: false },
                renderLineHighlight: "none",
                overviewRulerBorder: false,
              }}
            />
          </div>
        </div>

        {/* Output panel */}
        <div className="flex flex-col bg-paper-raised border-2 border-blueprint/20 rounded-lg overflow-hidden shadow-[6px_6px_0px_0px_rgba(45,95,138,0.08)] flex-1 md:flex-[40] h-[35vh] md:h-full">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-blueprint/15">
            <span className="font-mono text-xs text-ink-soft">output</span>
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1.5 bg-amber hover:bg-amber-dark disabled:opacity-60 text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {running ? "Running..." : "Run"}
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap break-all">
            {executedOutput ? (
              <span className="text-ink">{executedOutput}</span>
            ) : (
              <span className="text-ink-soft/50 italic">
                Run your code to see the output here.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Chat widget ── */}
      {!isChatOpen ? (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-amber hover:bg-amber-dark text-white px-5 py-3 rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] font-medium text-sm transition-colors"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Notes
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rust text-white text-[10px] flex items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <div className="fixed bottom-6 right-6 z-[100] w-[calc(100vw-32px)] md:w-[320px] max-h-[420px] flex flex-col bg-[#FBEFC9] border border-amber/40 rounded-sm shadow-[5px_5px_0px_0px_rgba(0,0,0,0.12)] rotate-[-0.6deg] overflow-hidden">
          {/* Header — looks like a taped label strip */}
          <div className="flex items-center justify-between px-4 py-3 bg-amber/15 border-b border-amber/30">
            <span className="font-mono text-xs text-ink tracking-wide">
              SESSION NOTES
            </span>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-ink-soft hover:text-rust text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2 min-h-[180px] max-h-[260px]">
            {messages.length === 0 ? (
              <p className="text-ink-soft/60 text-xs italic m-auto text-center">
                No notes yet — say something.
              </p>
            ) : (
              <>
                {messages.map((m, i) => {
                  const isMe = m.startsWith("You :");
                  return (
                    <div
                      key={i}
                      className={`text-sm leading-snug px-3 py-2 rounded-sm max-w-[85%] break-words ${isMe ? "self-end bg-blueprint text-white" : "self-start bg-white/70 text-ink border border-amber/20"}`}
                    >
                      {m}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-amber/25">
            <input
              ref={chatInputRef}
              onKeyDown={handleChatKeyDown}
              type="text"
              placeholder="Write a note, press Enter..."
              className="w-full bg-white/70 border border-amber/25 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-amber"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Codeeditor;