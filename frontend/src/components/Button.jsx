export default function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-indigo-600 hover:bg-indigo-500 text-white",

    danger:
      "bg-red-600 hover:bg-red-500 text-white",

    secondary:
      "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}