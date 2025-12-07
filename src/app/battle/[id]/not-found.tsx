import Link from "next/link";
import { MicOff } from "lucide-react";
import { RapGPTLogo } from "@/components/rapgpt-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BattleNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 mx-auto gap-8 bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full">
        <RapGPTLogo size="lg" animated />

        <Card className="w-[90vw] max-w-md text-center border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-white/5 ring-1 ring-white/10">
                <MicOff className="w-10 h-10 text-gray-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bebas text-white tracking-wide">
              Battle Not Found
            </CardTitle>
            <CardDescription className="text-gray-400 text-lg text-pretty">
              The beat has dropped...but not here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-8">
            <p className="text-gray-500 text-pretty">
              This battle might have been deleted, or the link is incorrect.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                variant="default"
                size="lg"
                className="bg-white text-black hover:bg-gray-200 font-bold"
              >
                <Link href="/new-battle">Start New Battle</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
              >
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
