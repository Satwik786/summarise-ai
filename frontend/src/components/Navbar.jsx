export default function Navbar({ status }) {
  const statusColor = {
    Ready: "bg-emerald-500",
    Recording: "bg-red-500",
    Processing: "bg-amber-500",
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-[72px] w-full items-center justify-between px-8">

        {/* Brand */}
        <div className="flex items-center gap-3">

          {/* SR Brand Mark */}
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-br
              from-emerald-300
              via-cyan-500
              to-violet-600
              shadow-sm
            "
          >
            <span className="text-sm font-bold tracking-tight text-white">
              SR
            </span>
          </div>

          {/* Brand Text */}
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">
              <span
                className="
                  bg-gradient-to-r
                  from-emerald-400
                  via-cyan-500
                  to-blue-600
                  bg-clip-text
                  text-transparent
                "
              >
                Summa
              </span>

              <span
                className="
                  bg-gradient-to-r
                  from-violet-600
                  via-fuchsia-500
                  to-orange-400
                  bg-clip-text
                  text-transparent
                "
              >
                Rise
              </span>
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              AI Meeting Assistant
            </p>
          </div>

        </div>


        {/* Application status */}
        <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              statusColor[status] || "bg-slate-400"
            }`}
          />

          <span className="text-sm font-medium text-slate-700">
            {status}
          </span>
        </div>

      </div>
    </header>
  );
}