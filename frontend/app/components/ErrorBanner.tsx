"use client";

export function ErrorBanner({
  title,
  message,
  onRetry
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            <div className="rounded-lg bg-red-100 p-2">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-red-900">{title}</h3>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-red-800 bg-white/50 rounded-lg p-3 border border-red-200">
              {message}
            </div>
          </div>
        </div>
        
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="flex-shrink-0 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-bold text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}