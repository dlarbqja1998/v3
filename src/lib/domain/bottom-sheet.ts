export type BottomSheetDetent = 'collapsed' | 'medium' | 'expanded';

export type BottomSheetHeights = Record<BottomSheetDetent, number>;
export type ResultPanelKind = 'event' | 'facility';

const DETENTS: BottomSheetDetent[] = ['collapsed', 'medium', 'expanded'];
export const COLLAPSED_HEIGHT = 104;
const EXPANDED_VIEWPORT_RATIO = 5 / 6;
const SWIPE_VELOCITY_THRESHOLD = 0.45;

export function getResultPanelInitialDetent(_kind: ResultPanelKind): BottomSheetDetent {
	return 'medium';
}

export function getBottomSheetHeights(
	viewportHeight: number,
	navigationHeight: number
): BottomSheetHeights {
	const safeViewportHeight = Math.max(0, viewportHeight);
	const safeNavigationHeight = Math.max(0, navigationHeight);
	const availableHeight = Math.max(0, safeViewportHeight - safeNavigationHeight);
	const collapsed = Math.min(COLLAPSED_HEIGHT, availableHeight);
	const medium = Math.min(availableHeight, Math.max(collapsed, availableHeight / 2));
	const expanded = Math.min(
		availableHeight,
		Math.max(medium, safeViewportHeight * EXPANDED_VIEWPORT_RATIO - safeNavigationHeight)
	);

	return { collapsed, medium, expanded };
}

export function getWeatherWidgetBottomOffset(
	viewportHeight: number,
	navigationHeight: number,
	gap: number
): number {
	const safeNavigationHeight = Math.max(0, navigationHeight);
	const safeGap = Math.max(0, gap);
	const collapsedHeight = getBottomSheetHeights(viewportHeight, safeNavigationHeight).collapsed;

	return safeNavigationHeight + collapsedHeight + safeGap;
}

export function getMapAttributionBottomOffset(
	viewportHeight: number,
	navigationHeight: number
): number {
	const safeNavigationHeight = Math.max(0, navigationHeight);
	return safeNavigationHeight + getBottomSheetHeights(viewportHeight, safeNavigationHeight).collapsed;
}

export function clampBottomSheetHeight(height: number, heights: BottomSheetHeights): number {
	return Math.min(heights.expanded, Math.max(heights.collapsed, height));
}

export function resolveBottomSheetDetent(
	height: number,
	velocityY: number,
	currentDetent: BottomSheetDetent,
	heights: BottomSheetHeights
): BottomSheetDetent {
	if (Math.abs(velocityY) >= SWIPE_VELOCITY_THRESHOLD) {
		return getNextBottomSheetDetent(currentDetent, velocityY < 0 ? 'up' : 'down');
	}

	let closestDetent = currentDetent;
	let closestDistance = Math.abs(height - heights[currentDetent]);

	for (const detent of DETENTS) {
		const distance = Math.abs(height - heights[detent]);
		if (distance < closestDistance) {
			closestDetent = detent;
			closestDistance = distance;
		}
	}

	return closestDetent;
}

export function getNextBottomSheetDetent(
	detent: BottomSheetDetent,
	direction: 'up' | 'down'
): BottomSheetDetent {
	const currentIndex = DETENTS.indexOf(detent);
	const offset = direction === 'up' ? 1 : -1;
	const nextIndex = Math.min(DETENTS.length - 1, Math.max(0, currentIndex + offset));

	return DETENTS[nextIndex];
}
