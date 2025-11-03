"use client";

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function ActionButton({
  onClick,
  disabled = false,
  children,
}: ActionButtonProps) {
  return (
    <div className="text-center mt-2 md:mt-7 pb-2 md:pb-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          px-8 md:px-12 lg:px-16 py-3 md:py-4 rounded-lg font-black text-lg md:text-xl lg:text-2xl tracking-wider
          transition-all duration-300 transform
          ${
            !disabled
              ? "bg-linear-to-r from-yellow-400 via-orange-500 to-red-600 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.8)] text-white"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          }
        `}
      >
        {children}
      </button>
    </div>
  );
}
