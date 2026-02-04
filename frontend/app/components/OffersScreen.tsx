"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBanner } from "./ErrorBanner";
import { OfferCard } from "./OfferCard";

type Offer = {
  id: string;
  restaurant_name: string;
  start_time: string;
  end_time: string;
  discount_percent: number;
  created_at: string;
};

type OffersResponse = {
  enable_smart_recommendations: boolean;
  server_time: string;
  offers: Offer[];
};

function getApiBaseUrl() {
  const envValue = process.env.NEXT_PUBLIC_API_BASE_URL;
  return envValue && envValue.length > 0 ? envValue : "http://localhost:4000";
}

function formatIsoForInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function toIsoFromDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

async function readBackendError(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const json = (await res.json()) as unknown;
      if (json && typeof json === "object") {
        const errorValue = (json as { error?: unknown }).error;
        const detailsValue = (json as { details?: unknown }).details;

        const lines: string[] = [];
        if (typeof errorValue === "string" && errorValue.length > 0) lines.push(errorValue);

        if (Array.isArray(detailsValue)) {
          for (const item of detailsValue) {
            if (!item || typeof item !== "object") continue;
            const field = (item as { field?: unknown }).field;
            const message = (item as { message?: unknown }).message;
            if (typeof message === "string" && message.length > 0) {
              if (typeof field === "string" && field.length > 0) lines.push(`- ${field}: ${message}`);
              else lines.push(`- ${message}`);
            }
          }
        }

        if (lines.length > 0) return lines.join("\n");
      }
    } catch {}
  }

  try {
    const text = await res.text();
    return text.length > 0 ? text : "Unknown error response.";
  } catch {
    return "Unknown error response.";
  }
}

export function OffersScreen() {
  const [enableSmartRecommendations, setEnableSmartRecommendations] = useState(false);
  const [data, setData] = useState<OffersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const [createRestaurantName, setCreateRestaurantName] = useState("Golden Spoon");
  const [createDiscountPercent, setCreateDiscountPercent] = useState<number>(25);
  const [createStartTime, setCreateStartTime] = useState(() => formatIsoForInput(now.toISOString()));
  const [createEndTime, setCreateEndTime] = useState(() =>
    formatIsoForInput(new Date(now.getTime() + 60 * 60 * 1000).toISOString())
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [createIsSubmitting, setCreateIsSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const createClientValidationError = useMemo(() => {
    if (createRestaurantName.trim().length === 0) return "Restaurant name is required.";
    if (!Number.isFinite(createDiscountPercent)) return "Discount percent must be a number.";
    if (createDiscountPercent < 0 || createDiscountPercent > 100) return "Discount percent must be between 0 and 100.";

    const startIso = toIsoFromDatetimeLocal(createStartTime);
    const endIso = toIsoFromDatetimeLocal(createEndTime);
    if (!startIso || !endIso) return "Start and end time are required.";
    if (new Date(startIso).getTime() > new Date(endIso).getTime()) return "Start time must be before end time.";
    return null;
  }, [createDiscountPercent, createEndTime, createRestaurantName, createStartTime]);

  const offersUrl = useMemo(() => {
    const url = new URL("/offers", getApiBaseUrl());
    url.searchParams.set("enable_smart_recommendations", String(enableSmartRecommendations));
    return url.toString();
  }, [enableSmartRecommendations]);

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(offersUrl, { cache: "no-store" });
      if (!res.ok) {
        const message = await readBackendError(res);
        throw new Error(`Backend responded with ${res.status}.\n${message}`);
      }
      const json = (await res.json()) as OffersResponse;
      setData(json);
      setLastUpdatedAt(new Date().toISOString());
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      const hint = `Cannot load offers from ${offersUrl}. Make sure the backend is running.`;
      setError(`${hint}\n${message}`);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [offersUrl]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  const submitOffer = useCallback(async () => {
    setCreateIsSubmitting(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      if (createClientValidationError) {
        throw new Error(createClientValidationError);
      }
      const startIso = toIsoFromDatetimeLocal(createStartTime);
      const endIso = toIsoFromDatetimeLocal(createEndTime);
      if (!startIso || !endIso) {
        throw new Error("Please provide a valid start and end time.");
      }

      const res = await fetch(new URL("/offers", getApiBaseUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_name: createRestaurantName,
          start_time: startIso,
          end_time: endIso,
          discount_percent: createDiscountPercent
        })
      });

      if (!res.ok) {
        const message = await readBackendError(res);
        throw new Error(`Create failed (${res.status}).\n${message}`);
      }

      await loadOffers();
      setCreateSuccess("Offer created successfully.");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setCreateIsSubmitting(false);
    }
  }, [createClientValidationError, createDiscountPercent, createEndTime, createRestaurantName, createStartTime, loadOffers]);

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Header Section */}
        <header className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-2.5">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">Restaurant Offers</h1>
              </div>
              <p className="mt-3 text-sm sm:text-base text-[var(--muted)] max-w-2xl">
                Manage and view active restaurant offers. Smart recommendations sort by highest discount percentage.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSmartRecommendations}
                  onChange={(e) => setEnableSmartRecommendations(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[var(--foreground)]">Smart Recommendations</span>
              </label>
              <button
                type="button"
                onClick={() => void loadOffers()}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                Backend URL
              </div>
              <div className="mt-2 break-all text-sm font-medium text-[var(--foreground)]">{getApiBaseUrl()}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Server Time
              </div>
              <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{data?.server_time ?? "—"}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-green-50 to-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Last Updated
              </div>
              <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : "—"}
              </div>
            </div>
          </div>
        </header>

        {/* Create Offer Section */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-2">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Create New Offer</h2>
              <p className="text-sm text-[var(--muted)]">Add a new restaurant offer to the system</p>
            </div>
          </div>

          {createError ? (
            <div className="mb-6">
              <ErrorBanner title="Failed to create offer" message={createError} />
            </div>
          ) : null}
          
          {createSuccess ? (
            <div className="mb-6 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm font-bold text-emerald-900">Success</div>
              </div>
              <div className="mt-1 text-sm text-emerald-800">{createSuccess}</div>
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Restaurant Name
              </label>
              <input
                value={createRestaurantName}
                onChange={(e) => setCreateRestaurantName(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="e.g. Golden Spoon Restaurant"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Discount Percentage
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={createDiscountPercent}
                onChange={(e) => setCreateDiscountPercent(e.target.value === "" ? Number.NaN : Number(e.target.value))}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="0-100"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Start Time
              </label>
              <input
                type="datetime-local"
                value={createStartTime}
                onChange={(e) => setCreateStartTime(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                End Time
              </label>
              <input
                type="datetime-local"
                value={createEndTime}
                onChange={(e) => setCreateEndTime(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <div className="flex items-start gap-2 text-sm">
              {createClientValidationError ? (
                <>
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium text-amber-700">{createClientValidationError}</span>
                </>
              ) : (
                <>
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[var(--muted)]">Times are converted to ISO format using server time</span>
                </>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => void submitOffer()}
              disabled={createIsSubmitting || Boolean(createClientValidationError)}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 text-sm font-bold text-white hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              {createIsSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Offer...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Offer
                </span>
              )}
            </button>
          </div>
        </section>

        {error ? <ErrorBanner title="Failed to load offers" message={error} onRetry={() => void loadOffers()} /> : null}

        {/* Active Offers Section */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-2">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Active Offers</h2>
            </div>
            
            <div className="rounded-full bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 text-sm font-bold text-blue-700 border border-blue-200">
              {data ? `${data.offers.length} ${data.offers.length === 1 ? "Offer" : "Offers"}` : "—"}
            </div>
          </div>

          <div>
            {!isLoading && !error && data && data.offers.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-base font-semibold text-gray-700">No Active Offers</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Create your first offer above with a time window that includes the current server time.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data?.offers ?? []).map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}