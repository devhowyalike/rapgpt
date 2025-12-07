import { SignIn } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-header";
import { APP_TITLE } from "@/lib/constants";

interface SignInPageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect_url } = await searchParams;

  return (
    <>
      <SiteHeader />
      <div className="min-h-dvh flex items-center justify-center bg-linear-to-br from-gray-900 via-purple-900 to-black p-4 pt-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-bebas text-6xl text-white mb-2">{APP_TITLE}</h1>
            <p className="text-gray-400 text-lg">
              Sign in to vote, comment, and create e-Beef battles
            </p>
          </div>

          <SignIn
            forceRedirectUrl={redirect_url}
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-gray-800/50 backdrop-blur-sm border border-purple-500/20",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton:
                  "bg-gray-700 hover:bg-gray-600 text-white border-gray-600",
                formButtonPrimary: "bg-purple-600 hover:bg-purple-700",
                footerActionLink: "text-purple-400 hover:text-purple-300",
                identityPreviewText: "text-white",
                formFieldLabel: "text-gray-300",
                formFieldInput: "bg-gray-700 border-gray-600 text-white",
                dividerLine: "bg-gray-600",
                dividerText: "text-gray-400",
              },
            }}
          />
        </div>
      </div>
    </>
  );
}
