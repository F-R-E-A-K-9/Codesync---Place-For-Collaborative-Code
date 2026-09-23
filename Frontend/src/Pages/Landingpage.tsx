import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Landingpage = () => {
  const isLoggedIn = !!localStorage.getItem("authorization");
  const [isSignup, setIsSignup] = useState(true);
  const navigate = useNavigate();

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formdata = new FormData(e.currentTarget);
    const content = Object.fromEntries(formdata);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}api/v1/signup`,
        content,
      );
      toast.success(response.data.message);
      setIsSignup(false);
    } catch (err: any) {
      const errors = err.response?.data?.message;
      if (
        typeof errors === "object" &&
        errors !== null &&
        !Array.isArray(errors)
      ) {
        Object.entries(errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            toast.error(`${field}: ${messages[0]}`);
          }
        });
      } else if (typeof errors === "string") {
        toast.error(errors);
      } else {
        toast.error("Something went wrong");
      }
    }
  }

  async function handleSignin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formdata = new FormData(e.currentTarget);
    const content = Object.fromEntries(formdata);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}api/v1/signin`,
        content,
      );
      localStorage.setItem("authorization", response.data.token);
      localStorage.setItem("username", response.data.username);
      toast.success(response.data.message);
      navigate("/Dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  }
  return (
    <div className="min-h-screen bg-paper font-sans text-ink relative overflow-x-hidden">
      {/* Subtle blueprint grid — sirf background texture, functional feel */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.4] bg-[linear-gradient(rgba(45,95,138,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(45,95,138,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-blueprint/15">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm border-2 border-blueprint flex items-center justify-center">
            <div className="w-2 h-2 bg-amber rounded-full" />
          </div>
          <span className="font-display text-xl text-ink">CodeSync</span>
        </div>
        <a
          href="#how"
          className="text-sm text-ink-soft hover:text-blueprint transition-colors"
        >
          How it works
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 grid md:grid-cols-2 gap-12 px-6 md:px-12 py-16 md:py-24 max-w-[1200px] mx-auto items-center">
        {/* Left: headline + auth card */}
        <div>
          <div className="font-mono text-xs text-blueprint mb-4 tracking-wide">
            FOR PAIRS & INTERVIEWS
          </div>
          <h1 className="font-display text-[clamp(32px,5vw,52px)] leading-[1.08] text-ink mb-5">
            Draft code together, in real time.
          </h1>
          <p className="text-ink-soft text-base leading-relaxed mb-10 max-w-[420px]">
            One shared workspace for pairing sessions and technical interviews —
            write, run, and talk through code without switching tabs.
          </p>

          {/* Auth Card */}
          <div className="bg-paper-raised border-2 border-blueprint/20 rounded-lg p-6 max-w-[380px] shadow-[6px_6px_0px_0px_rgba(45,95,138,0.12)]">
            {isLoggedIn ? (
              <div className="text-center py-2">
                <p className="text-ink-soft text-sm mb-4">
                  Signed in as{" "}
                  <span className="text-ink font-medium">
                    {localStorage.getItem("username")}
                  </span>
                </p>
                <button
                  onClick={() => navigate("/Dashboard")}
                  className="w-full py-3 bg-amber hover:bg-amber-dark text-white rounded-md font-medium transition-colors"
                >
                  Go to your workspace
                </button>
              </div>
            ) : (
              <>
                <div className="flex border-b border-blueprint/15 mb-5">
                  <button
                    onClick={() => setIsSignup(true)}
                    className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${isSignup ? "border-amber text-ink" : "border-transparent text-ink-soft"}`}
                  >
                    Create account
                  </button>
                  <button
                    onClick={() => setIsSignup(false)}
                    className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${!isSignup ? "border-amber text-ink" : "border-transparent text-ink-soft"}`}
                  >
                    Sign in
                  </button>
                </div>

                {isSignup ? (
                  <form
                    className="flex flex-col gap-3.5"
                    onSubmit={handleSignup}
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-ink-soft">Username</label>
                      <input
                        name="username"
                        type="text"
                        placeholder="e.g. rahul_dev"
                        className="border border-blueprint/25 rounded-md px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-blueprint"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-ink-soft">Email</label>
                      <input
                        name="email"
                        type="text"
                        placeholder="you@example.com"
                        className="border border-blueprint/25 rounded-md px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-blueprint"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-ink-soft">Password</label>
                      <input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="border border-blueprint/25 rounded-md px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-blueprint"
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-1 py-3 bg-amber hover:bg-amber-dark text-white rounded-md font-medium transition-colors"
                    >
                      Create account
                    </button>
                  </form>
                ) : (
                  <form
                    className="flex flex-col gap-3.5"
                    onSubmit={handleSignin}
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-ink-soft">Email</label>
                      <input
                        name="email"
                        type="text"
                        placeholder="you@example.com"
                        className="border border-blueprint/25 rounded-md px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-blueprint"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-ink-soft">Password</label>
                      <input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="border border-blueprint/25 rounded-md px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-blueprint"
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-1 py-3 bg-amber hover:bg-amber-dark text-white rounded-md font-medium transition-colors"
                    >
                      Sign in
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right column — Part 2 me banayenge */}
        {/* Right: pinned blueprint sheet mockup */}
        <div className="relative hidden md:block">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber shadow-[0_2px_4px_rgba(0,0,0,0.2)] z-20" />

          <div className="bg-paper-raised border-2 border-blueprint/25 rounded-lg overflow-hidden rotate-[1.2deg] shadow-[10px_10px_0px_0px_rgba(45,95,138,0.1)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-blueprint/15">
              <span className="font-mono text-xs text-ink-soft">
                session.js
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                <span className="font-mono text-[10px] text-ink-soft">
                  2 editing
                </span>
              </div>
            </div>

            <div className="p-5 font-mono text-[13px] leading-[1.9] text-ink-soft">
              <div>
                <span className="text-blueprint">function</span>{" "}
                <span className="text-ink">mergeSort</span>(arr) {"{"}
              </div>
              <div className="pl-4">
                <span className="text-blueprint">if</span> (arr.length {"<="} 1){" "}
                <span className="text-blueprint">return</span> arr;
                <span className="inline-block w-[6px] h-[15px] bg-amber/70 ml-1 align-middle animate-pulse" />
              </div>
              <div className="pl-4 text-ink-soft/40">
                // splitting the array...
              </div>
              <div>{"}"}</div>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 border-t border-blueprint/15 bg-blueprint-soft/40">
              <div className="w-5 h-5 rounded-full bg-blueprint text-white text-[10px] flex items-center justify-center font-medium">
                R
              </div>
              <div className="w-5 h-5 rounded-full bg-amber text-white text-[10px] flex items-center justify-center font-medium -ml-2 border border-paper-raised">
                A
              </div>
              <span className="text-xs text-ink-soft ml-1">
                Riya and Aman are in this room
              </span>
            </div>
          </div>

          {/* Taped note underneath, like an attached label */}
          <div className="mt-5 ml-8 inline-block bg-[#FBEFC9] border border-amber/30 px-4 py-2 rotate-[-1deg] text-xs text-ink-soft shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)]">
            Room ID: <span className="text-ink font-medium">7GX4Q</span> — share
            it to invite someone in
          </div>
        </div>
      </section>
      {/* Right: pinned blueprint sheet mockup */}
      <div className="relative hidden md:block">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber shadow-[0_2px_4px_rgba(0,0,0,0.2)] z-20" />

        <div className="bg-paper-raised border-2 border-blueprint/25 rounded-lg overflow-hidden rotate-[1.2deg] shadow-[10px_10px_0px_0px_rgba(45,95,138,0.1)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-blueprint/15">
            <span className="font-mono text-xs text-ink-soft">session.js</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sage" />
              <span className="font-mono text-[10px] text-ink-soft">
                2 editing
              </span>
            </div>
          </div>

          <div className="p-5 font-mono text-[13px] leading-[1.9] text-ink-soft">
            <div>
              <span className="text-blueprint">function</span>{" "}
              <span className="text-ink">mergeSort</span>(arr) {"{"}
            </div>
            <div className="pl-4">
              <span className="text-blueprint">if</span> (arr.length {"<="} 1){" "}
              <span className="text-blueprint">return</span> arr;
              <span className="inline-block w-[6px] h-[15px] bg-amber/70 ml-1 align-middle animate-pulse" />
            </div>
            <div className="pl-4 text-ink-soft/40">
              // splitting the array...
            </div>
            <div>{"}"}</div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 border-t border-blueprint/15 bg-blueprint-soft/40">
            <div className="w-5 h-5 rounded-full bg-blueprint text-white text-[10px] flex items-center justify-center font-medium">
              R
            </div>
            <div className="w-5 h-5 rounded-full bg-amber text-white text-[10px] flex items-center justify-center font-medium -ml-2 border border-paper-raised">
              A
            </div>
            <span className="text-xs text-ink-soft ml-1">
              Riya and Aman are in this room
            </span>
          </div>
        </div>

        {/* Taped note underneath, like an attached label */}
        <div className="mt-5 ml-8 inline-block bg-[#FBEFC9] border border-amber/30 px-4 py-2 rotate-[-1deg] text-xs text-ink-soft shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)]">
          Room ID: <span className="text-ink font-medium">7GX4Q</span> — share
          it to invite someone in
        </div>
      </div>
    </div>
  );
};

export default Landingpage;
