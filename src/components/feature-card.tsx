import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: ReactNode;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "bg-gray-900/30 border border-gray-800 rounded-lg p-6 w-[calc(50%-12px)] lg:w-[calc(100%/3-16px)] xl:w-[calc(20%-19.2px)]",
        className
      )}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
