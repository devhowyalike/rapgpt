import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";
import { PersonaGallery } from "@/components/persona-gallery";
import { CreateBattleCTA } from "@/components/create-battle-cta";

export const metadata = {
  title: "The Roster | RapGPT",
  description:
    "Meet the MCs of RapGPT. Each AI rapper has their own unique flow, style, and personality.",
};

export default async function RosterPage() {
  const { sessionClaims } = await auth();
  const isAuthenticated = !!sessionClaims;

  return (
    <>
      <SiteHeader />

      {/* Hero Section */}
      <div className="bg-black pt-24 pb-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-b from-purple-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold font-(family-name:--font-bebas-neue) text-white mb-4 uppercase tracking-tight">
            The{" "}
            <span className="text-purple-500">
              MC<span className="text-[0.7em]">s</span>
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl text-pretty">
            Each AI persona brings their own unique flow, style, and personality
            to the battle, with new artists joining the roster all the time.
          </p>
        </div>
      </div>

      {/* Persona Gallery - Show all personas including alt costumes */}
      <div className="bg-black py-8">
        <PersonaGallery
          hideAltPersonas={false}
          hideHeader={true}
          showAllOnMobile={true}
        />
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-black flex flex-col items-center justify-center p-6 pt-0 pb-12">
        <div className="max-w-6xl mx-auto text-center space-y-6 w-full">
          <div className="flex justify-center">
            <CreateBattleCTA
              isAuthenticated={isAuthenticated}
              title="Pick Your Fighter"
            />
          </div>
        </div>
      </div>
    </>
  );
}
