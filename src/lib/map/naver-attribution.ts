type NaverLogoPositions<T> = {
	BOTTOM_LEFT: T;
	BOTTOM_RIGHT: T;
};

type NaverAttributionLink = {
	style: {
		transform: string;
		transition: string;
	};
};

type NaverAttributionRoot = {
	querySelector: (selector: string) => unknown;
};

type NaverAttributionObserver = {
	observe: () => void;
	disconnect: () => void;
};

type CreateNaverAttributionObserver = (
	callback: () => void
) => NaverAttributionObserver;

export function getNaverLogoControlPosition<T>(positions: NaverLogoPositions<T>): T {
	return positions.BOTTOM_RIGHT;
}

export function watchNaverAttributionLogo(
	root: NaverAttributionRoot,
	bottomOffset: number,
	createObserver: CreateNaverAttributionObserver
): () => void {
	const positionLogo = () => {
		const logoImage = root.querySelector('img[alt="NAVER"]') as {
			closest: (selector: string) => NaverAttributionLink | null;
		} | null;
		const logoLink = logoImage?.closest('a');
		if (!logoLink) return false;

		logoLink.style.transform = `translateY(-${Math.max(0, bottomOffset)}px)`;
		logoLink.style.transition = 'transform 200ms ease-out';
		return true;
	};

	if (positionLogo()) return () => undefined;

	const observer = createObserver(() => {
		if (!positionLogo()) return;
		observer.disconnect();
	});
	observer.observe();

	return () => observer.disconnect();
}
