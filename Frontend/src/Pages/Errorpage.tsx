import { Link } from "react-router-dom";

const Errorpage = () => {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full text-center">
        <div className="bg-paper-raised border-2 border-blueprint/20 rounded-lg p-10 shadow-[6px_6px_0px_0px_rgba(45,95,138,0.15)]">
          <div className="font-mono text-xs tracking-wide text-blueprint mb-3">
            SHEET NOT FOUND
          </div>

          <h1 className="font-display text-5xl text-ink mb-4">
            This page went missing from the desk.
          </h1>

          <p className="text-ink-soft mb-8 leading-relaxed">
            The room or page you're looking for doesn't exist, or the link's
            outdated.
          </p>

          <Link
            to="/"
            className="inline-block px-6 py-3 bg-amber hover:bg-amber-dark text-white font-medium rounded-md transition-colors"
          >
            Back to the desk
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Errorpage;
