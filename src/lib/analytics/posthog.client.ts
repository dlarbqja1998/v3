import type { AnalyticsEventName } from './events';

export const ANALYTICS_USER_MARKER_KEY = 'golabau:posthog-identified-user';

export type PostHogClient = {
	capture(eventName: string, properties?: Record<string, unknown>): void;
	identify(distinctId: string, properties?: Record<string, unknown>): void;
	reset(): void;
};

export type AnalyticsStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type AnalyticsUser = {
	id: string | number;
	role: string;
	isOnboarded: boolean;
	nickname?: string | null;
};

export function isPosthogProductionHost(hostname: string) {
	return hostname === 'golabau.com' || hostname === 'www.golabau.com';
}

export function captureEvent(
	client: PostHogClient | undefined,
	eventName: AnalyticsEventName,
	properties: Record<string, unknown> = {}
) {
	client?.capture(eventName, properties);
}

export function createPageViewProperties(url: URL) {
	return { path: url.pathname };
}

export function syncAnalyticsUser(
	user: AnalyticsUser | null,
	client: PostHogClient | undefined,
	storage: AnalyticsStorage
) {
	if (!client) return;

	const previousUserId = storage.getItem(ANALYTICS_USER_MARKER_KEY);
	if (!user) {
		if (previousUserId) {
			client.reset();
			storage.removeItem(ANALYTICS_USER_MARKER_KEY);
		}
		return;
	}

	const userId = String(user.id);
	if (previousUserId === userId) return;

	client.identify(userId, {
		user_role: user.role,
		onboarding_completed: user.isOnboarded
	});
	storage.setItem(ANALYTICS_USER_MARKER_KEY, userId);
}

function getBrowserClient(): PostHogClient | undefined {
	if (typeof window === 'undefined' || !isPosthogProductionHost(window.location.hostname)) {
		return undefined;
	}
	return window.posthog;
}

export function track(eventName: AnalyticsEventName, properties: Record<string, unknown> = {}) {
	captureEvent(getBrowserClient(), eventName, properties);
}

export function trackPageView(url: URL) {
	track('$pageview', createPageViewProperties(url));
}

export function syncBrowserAnalyticsUser(user: AnalyticsUser | null) {
	if (typeof window === 'undefined') return;
	syncAnalyticsUser(user, getBrowserClient(), window.localStorage);
}
