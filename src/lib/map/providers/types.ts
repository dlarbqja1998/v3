export type MapCenter = {
	latitude: number;
	longitude: number;
};

export type MapMarker = {
	id: string;
	position: MapCenter;
	title: string;
	categorySlug: string;
};

export type MapPolygon = {
	id: string;
	points: MapCenter[];
};

export type MapProviderOptions = {
	center: MapCenter;
	zoom: number;
};

export type MapProvider = {
	init(container: HTMLElement, options: MapProviderOptions): Promise<void> | void;
	destroy(): void;
	moveTo(center: MapCenter, zoom?: number): void;
	addMarker(marker: MapMarker): void;
	removeMarker(markerId: string): void;
	drawPolygon(polygon: MapPolygon): void;
	clearLayer(layerId: string): void;
	onIdle(callback: () => void): void;
	onMarkerClick(callback: (markerId: string) => void): void;
};
