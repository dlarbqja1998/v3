import type { BottomNavigationKey } from '$lib/domain/bottom-navigation';

export type NavigationDecision =
	| { kind: 'allow' }
	| { kind: 'login-required'; href: '/login?next=/my'; delayMs: 1000 };

export function getNavigationDecision(
	key: BottomNavigationKey,
	isAuthenticated: boolean
): NavigationDecision {
	if (key === 'my' && !isAuthenticated) {
		return {
			kind: 'login-required',
			href: '/login?next=/my',
			delayMs: 1000
		};
	}

	return { kind: 'allow' };
}
