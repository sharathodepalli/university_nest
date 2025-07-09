import React from "react";

interface VerificationBadgeProps {
  isVerified: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  onClick,
  size = "md",
  showText = true,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (isVerified) {
    return (
      <div className="inline-flex items-center space-x-1">
        {/* Instagram-style verification checkmark */}
        <div className="relative">
          <svg
            className={`${sizeClasses[size]} text-blue-500`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.29 16.29L5.7 12.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.59 7.59c-.38.39-1.02.39-1.41 0z" />
          </svg>
          {/* White checkmark */}
          <svg
            className={`absolute inset-0 ${sizeClasses[size]} text-white`}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        {showText && (
          <span
            className={`font-medium text-blue-600 ${textSizeClasses[size]}`}
          >
            Verified
          </span>
        )}
      </div>
    );
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors ${textSizeClasses[size]}`}
      >
        <div className={`${sizeClasses[size]} text-gray-400`}>
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3"
            />
          </svg>
        </div>
        {showText && (
          <span className="font-medium text-gray-600">Get Verified</span>
        )}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1">
      <div className={`${sizeClasses[size]} text-gray-400`}>
        <svg
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      {showText && (
        <span className={`text-gray-500 ${textSizeClasses[size]}`}>
          Unverified
        </span>
      )}
    </div>
  );
};
