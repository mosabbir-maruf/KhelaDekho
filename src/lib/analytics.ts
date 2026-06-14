export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function isAnalyticsEnabled(): boolean {
  return !!GA_MEASUREMENT_ID;
}

type EventParams = {
  stream_type?: string;
  channel_name?: string;
  channel_key?: string;
  match_id?: string;
  team1?: string;
  team2?: string;
  search_query?: string;
  result_count?: number;
  form_type?: string;
  link_url?: string;
  link_text?: string;
};

type EventName =
  | "stream_view"
  | "match_view"
  | "search"
  | "form_submit"
  | "external_link_click";

export function event(action: EventName, params?: EventParams) {
  if (typeof window === "undefined" || !isAnalyticsEnabled()) return;
  window.gtag("event", action, params);
}
