"use client";

type Offer = {
  id: string;
  restaurant_name: string;
  start_time: string;
  end_time: string;
  discount_percent: number;
  created_at: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <li className="card-hover group rounded-xl border-2 border-[var(--border)] bg-gradient-to-br from-white to-slate-50 p-5 shadow-md hover:border-blue-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-5 w-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-bold text-[var(--foreground)] truncate group-hover:text-blue-600 transition-colors">
              {offer.restaurant_name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <span className="font-mono">{offer.id}</span>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <div className="rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 shadow-lg">
            <div className="text-center">
              <div className="text-xl font-black text-white leading-none">{offer.discount_percent}%</div>
              <div className="text-[10px] font-bold text-white/90 uppercase tracking-wide mt-0.5">OFF</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-lg bg-white/80 p-3 border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="rounded-lg bg-green-100 p-1.5">
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Starts</div>
            <div className="mt-0.5 text-sm font-semibold text-[var(--foreground)]" title={offer.start_time}>
              {formatDateTime(offer.start_time)}
            </div>
          </div>
        </div>
        
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="rounded-lg bg-red-100 p-1.5">
              <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Ends</div>
            <div className="mt-0.5 text-sm font-semibold text-[var(--foreground)]" title={offer.end_time}>
              {formatDateTime(offer.end_time)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </li>
  );
}