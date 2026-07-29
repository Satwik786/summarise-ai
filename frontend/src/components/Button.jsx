export default function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700",

    danger:
      "border border-red-200 bg-white text-red-600 hover:bg-red-50",

    secondary:
      "border border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}