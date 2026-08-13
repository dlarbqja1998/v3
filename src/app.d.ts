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
				Map: new (element: HTMLElement, options: Record<string, unknown>) => {
					getCenter: () => { lat: () => number; lng: () => number };
					getZoom: () => number;
					panTo?: (center: unknown) => void;
					setCenter: (center: unknown) => void;
					setZoom: (zoom: number) => void;
				};
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
		interface Locals {
			user: {
				id: number;
				email: string;
				nickname: string | null;
				profileImg: string | null;
				isOnboarded: boolean;
				role: string;
				college: string | null;
				department: string | null;
				grade: string | null;
				gender: string | null;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				GOLABAU_CACHE?: {
					get(key: string): Promise<string | null>;
					put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
				};
				CACHE_CLEAR_SECRET?: string;
				ADMIN_SECRET_KEY?: string;
				KMA_SERVICE_KEY?: string;
			};
			context?: {
				waitUntil(promise: Promise<unknown>): void;
			};
		}
	}
}

export {};
