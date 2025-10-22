export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-stage-darker to-stage-dark flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl font-bold flex items-end justify-center gap-4">
          <span className="bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Loading Battle
          </span>
          <div className="flex items-end space-x-2 pb-2">
            <div
              className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
