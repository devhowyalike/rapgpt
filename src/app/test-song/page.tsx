/**
 * Test page for AI Song Generation feature
 * This page allows testing song generation and playback without creating a full battle
 * DELETE THIS FILE BEFORE PRODUCTION DEPLOYMENT
 */

import { getAllBattles } from "@/lib/battle-storage";
import { TestSongClient } from "./test-song-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function TestSongPage() {
  // Require authentication for test page
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Get all battles and find a completed one
  const allBattles = await getAllBattles();

  // First try to find one created by current user
  let completedBattle = allBattles.find(
    (b) => b.status === "completed" && b.creator?.userId === userId
  );

  // FOR TESTING ONLY: If no battles created by user, use ANY completed battle
  // This bypasses the creator check - API will still reject, but you can test UI
  const isUsingOtherUserBattle = !completedBattle;
  if (!completedBattle) {
    completedBattle = allBattles.find((b) => b.status === "completed");
  }

  if (!completedBattle) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Test Song Generation</h1>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 font-bold mb-2">
              No completed battles found in the database.
            </p>
            <p className="text-sm text-gray-300">
              You need at least one completed battle to test this feature.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <Link
              href="/new-battle"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Create New Battle
            </Link>
            <p className="text-xs text-gray-500">
              After creating a battle, complete all 3 rounds, then return to
              this test page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if this battle already has a generated song (with valid audioUrl)
  const hasGeneratedSong = !!completedBattle.generatedSong?.audioUrl;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
          <h1 className="text-3xl font-bold mb-2">
            🧪 Test Song Generation Feature
          </h1>
          <p className="text-yellow-400 text-sm">
            This is a test page for QA purposes. DELETE before production
            deployment.
          </p>
        </div>

        {/* Warning if using someone else's battle */}
        {isUsingOtherUserBattle && (
          <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-4">
            <p className="text-orange-400 font-bold mb-2">
              ⚠️ Testing with another user's battle
            </p>
            <p className="text-sm text-gray-300">
              You don't own this battle, so the API will reject song generation
              attempts. You can still test the UI components. To test full
              functionality, create your own completed battle.
            </p>
          </div>
        )}

        {/* Battle Info */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Testing with Battle:</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>ID:</strong> {completedBattle.id}
            </p>
            <p>
              <strong>Title:</strong> {completedBattle.title}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="text-green-400">{completedBattle.status}</span>
            </p>
            <p>
              <strong>Personas:</strong> {completedBattle.personas.left.name} vs{" "}
              {completedBattle.personas.right.name}
            </p>
            <p>
              <strong>Verses:</strong> {completedBattle.verses.length} total
            </p>
            <p>
              <strong>Has Generated Song:</strong>{" "}
              {hasGeneratedSong ? (
                <span className="text-green-400">Yes ✓</span>
              ) : (
                <span className="text-gray-400">No</span>
              )}
            </p>
          </div>
          <Link
            href={`/battle/${completedBattle.id}`}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            View Battle Page
          </Link>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Testing Instructions:</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Test Song Generator:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-300">
                <li>Select a beat style (G-Funk, Boom-Bap, or Trap)</li>
                <li>Click "Generate Song"</li>
                <li>Wait 1-3 minutes for generation</li>
                <li>Song will appear in player below when complete</li>
              </ul>
            </div>
            <div>
              <strong>2. Test Song Player:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-300">
                <li>Mock player shown below (if no real song generated)</li>
                <li>Test play/pause controls</li>
                <li>Test seek functionality</li>
                <li>Test volume control</li>
                <li>Test download button</li>
              </ul>
            </div>
            <div>
              <strong>3. Environment Check:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-300">
                <li>
                  Ensure SUNO_API_KEY is set in .env.local (
                  {process.env.SUNO_API_KEY ? (
                    <span className="text-green-400">✓ Set</span>
                  ) : (
                    <span className="text-red-400">✗ Missing</span>
                  )}
                  )
                </li>
                <li>
                  Database migration must be run (
                  {hasGeneratedSong ||
                  completedBattle.generatedSong === null ? (
                    <span className="text-green-400">✓ Schema OK</span>
                  ) : (
                    <span className="text-yellow-400">? Check schema</span>
                  )}
                  )
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Client Components */}
        <TestSongClient battle={completedBattle} />

        {/* API Endpoint Test */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">API Endpoint:</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-400">
              POST /api/battle/{completedBattle.id}/generate-song
            </p>
            <div className="bg-gray-950 rounded p-3 font-mono text-xs overflow-x-auto">
              <pre>{`{
  "beatStyle": "g-funk" | "boom-bap" | "trap"
}`}</pre>
            </div>
          </div>
        </div>

        {/* Delete Warning */}
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 font-bold">⚠️ REMEMBER:</p>
          <p className="text-sm text-gray-300 mt-2">
            Delete this test page (src/app/test-song/page.tsx) before deploying
            to production!
          </p>
        </div>
      </div>
    </div>
  );
}
