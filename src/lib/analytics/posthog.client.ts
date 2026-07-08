import type { AnalyticsEventName } from './events';

export function track(eventName: AnalyticsEventName, properties: Record<string, unknown> = {}) {
	if (typeof window === 'undefined') {
		return;
	}

	window.dispatchEvent(
		new CustomEvent('golabau:analytics', {
			detail: {
				eventName,
				properties
			}
		})
	);
}
