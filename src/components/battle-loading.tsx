export function BattleLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-stage-darker to-stage-dark flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-3xl md:text-5xl lg:text-6xl font-bold flex items-end justify-center gap-2 md:gap-3">
          <span className="bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text animate-pulse inline-block pb-1">
            Loading
          </span>
          <div className="flex items-end space-x-1 md:space-x-2 pb-1 md:pb-1">
            <div
              className="w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 md:w-3 md:h-3 bg-purple-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
