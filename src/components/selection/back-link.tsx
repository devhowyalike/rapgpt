"use client";

interface BackLinkProps {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function BackLink({
  href,
  onClick,
  disabled = false,
  children,
}: BackLinkProps) {
  if (onClick) {
    return (
      <div className="mt-4">
        <button
          onClick={onClick}
          disabled={disabled}
          className="text-gray-500 hover:text-gray-300 transition-colors text-sm font-semibold tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {children}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <a
        href={href}
        className="text-gray-500 hover:text-gray-300 transition-colors text-sm font-semibold tracking-wide uppercase"
      >
        {children}
      </a>
    </div>
  );
}
