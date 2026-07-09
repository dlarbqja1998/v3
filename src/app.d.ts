// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Window {
		naver?: {
			maps: {
				Event: {
					addListener: (target: unknown, eventName: string, listener: () => void) => unknown;
				};
				LatLng: new (latitude: number, longitude: number) => unknown;
				Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
				Marker: new (options: Record<string, unknown>) => {
					setMap: (map: unknown | null) => void;
				};
				Point: new (x: number, y: number) => unknown;
				Position: {
					BOTTOM_LEFT: unknown;
				};
				Size: new (width: number, height: number) => unknown;
			};
		};
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
