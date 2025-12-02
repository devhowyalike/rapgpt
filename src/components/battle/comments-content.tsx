/**
 * Comments content - used in both desktop sidebar and mobile drawer
 * Renders comments list and input form. Parent controls scroll behavior.
 */

"use client";

import { SignInPrompt } from "@/components/auth/sign-in-prompt";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Comment } from "@/lib/shared";

interface CommentsContentProps {
  comments: Comment[];
  onComment: (content: string) => void;
  isArchived?: boolean;
  battleStatus?: string;
}

export function CommentsContent({
  comments,
  onComment,
  isArchived = false,
  battleStatus,
}: CommentsContentProps) {
  const { user, isLoaded } = useUser();
  const [comment, setComment] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastCommentCountRef = useRef(comments.length);

  // Auto-scroll to bottom when a new comment is added
  useEffect(() => {
    // Only scroll if comments were added (not on initial load or removal)
    if (comments.length > lastCommentCountRef.current) {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    lastCommentCountRef.current = comments.length;
  }, [comments.length]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    onComment(comment.trim());
    setComment("");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Archived Message */}
      {isArchived && (
        <div className="bg-gray-800 rounded-lg p-3 mx-4 mt-4 mb-0 shrink-0">
          <p className="text-center text-white text-sm">
            {battleStatus === "paused"
              ? "Comments are disabled for paused battles"
              : "Comments are disabled for archived battles"}
          </p>
        </div>
      )}

      {/* Comments List - scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
      >
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800 rounded-lg p-3"
            >
              <div className="flex items-start gap-2">
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt={c.username}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-white text-sm">
                      {c.username}
                    </span>
                    {c.round && (
                      <span className="text-xs text-gray-500">
                        Round {c.round}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mt-1 wrap-break-word">
                    {c.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Comment Input - fixed at bottom */}
      {!isArchived && (
        <div className="shrink-0 p-4 pb-6 md:pb-4 border-t border-gray-800 bg-gray-900">
          {isLoaded && !user ? (
            <SignInPrompt message="Sign in to leave a comment" />
          ) : (
            <form onSubmit={handleSubmitComment}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Drop a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
