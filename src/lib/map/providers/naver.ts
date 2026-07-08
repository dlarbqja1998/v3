import type { MapCenter, MapMarker, MapPolygon, MapProvider, MapProviderOptions } from './types';

export class NaverMapProvider implements MapProvider {
	#container: HTMLElement | null = null;
	#idleCallback: (() => void) | null = null;
	#markerClickCallback: ((markerId: string) => void) | null = null;

	init(container: HTMLElement, _options: MapProviderOptions) {
		this.#container = container;
		this.#idleCallback?.();
	}

	destroy() {
		this.#container = null;
	}

	moveTo(_center: MapCenter, _zoom?: number) {
		this.#idleCallback?.();
	}

	addMarker(_marker: MapMarker) {
		return;
	}

	removeMarker(_markerId: string) {
		return;
	}

	drawPolygon(_polygon: MapPolygon) {
		return;
	}

	clearLayer(_layerId: string) {
		return;
	}

	onIdle(callback: () => void) {
		this.#idleCallback = callback;
	}

	onMarkerClick(callback: (markerId: string) => void) {
		this.#markerClickCallback = callback;
	}

	emitMarkerClick(markerId: string) {
		this.#markerClickCallback?.(markerId);
	}
}
