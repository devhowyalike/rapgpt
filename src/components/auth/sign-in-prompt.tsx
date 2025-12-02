import Link from "next/link";

interface SignInPromptProps {
  message?: string;
  className?: string;
}

export function SignInPrompt({ 
  message = "Sign in to participate",
  className = ""
}: SignInPromptProps) {
  return (
    <div className={`text-center py-3 ${className}`}>
      <p className="text-gray-400 text-sm mb-3">
        {message}
      </p>
      <Link
        href="/sign-in"
        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors text-sm font-medium"
      >
        Sign In
      </Link>
    </div>
  );
}

