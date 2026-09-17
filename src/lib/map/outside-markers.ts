import type { Place } from '$lib/domain/places';

export type OutsidePlaceCluster = {
	id: string;
	latitude: number;
	longitude: number;
	places: Place[];
};

/** 지도 확대 수준의 화면 픽셀 거리로 가까운 가게를 묶는다. 이동만 할 때 묶음은 유지된다. */
export function clusterOutsidePlaces(places: Place[], zoom: number, radius = 44): OutsidePlaceCluster[] {
	const world = 256 * 2 ** zoom;
	const groups: (OutsidePlaceCluster & { x: number; y: number })[] = [];
	for (const place of [...places].sort((a, b) => a.id.localeCompare(b.id))) {
		if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) continue;
		const latitude = Math.max(-85, Math.min(85, place.latitude));
		const sine = Math.sin(latitude * Math.PI / 180);
		const x = (place.longitude + 180) / 360 * world;
		const y = (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * world;
		const group = groups.find(item => Math.hypot(item.x - x, item.y - y) < radius);
		if (group) group.places.push(place);
		else groups.push({ id: place.id, latitude: place.latitude, longitude: place.longitude, x, y, places: [place] });
	}
	return groups.map(group => ({
		id: group.id,
		latitude: group.places.reduce((sum, place) => sum + place.latitude, 0) / group.places.length,
		longitude: group.places.reduce((sum, place) => sum + place.longitude, 0) / group.places.length,
		places: group.places
	}));
}

export function createOutsidePlaceMarker(cluster: OutsidePlaceCluster, selected: boolean, onSelect: () => void) {
	const button = document.createElement('button');
	button.type = 'button';
	button.dataset.outsideCluster = cluster.id;
	button.setAttribute('aria-label', cluster.places.length > 1 ? `가게 ${cluster.places.length}곳 모아보기` : cluster.places[0].name);
	button.setAttribute('aria-pressed', String(selected));
	button.style.cssText = 'width:44px;height:44px;padding:0;display:grid;place-items:center;border:0;background:transparent;cursor:pointer;font-family:inherit;';
	const face = document.createElement('span');
	face.style.cssText = `width:${selected ? 30 : 26}px;height:${selected ? 30 : 26}px;display:grid;place-items:center;border:1px solid var(--color-brand);border-radius:50%;background:${selected ? 'var(--color-brand)' : '#fff'};color:${selected ? '#fff' : 'var(--color-brand)'};font-size:12px;font-weight:700;box-shadow:0 1px 2px #2413180b;`;
	if (cluster.places.length > 1) face.textContent = String(cluster.places.length);
	else {
		const icon = document.createElement('span');
		const name = cluster.places[0].categorySlug === 'cafe' ? 'cafe' : 'food';
		icon.style.cssText = `width:16px;height:16px;background:currentColor;mask:url('/24 icon/${name}.svg') center/contain no-repeat;-webkit-mask:url('/24 icon/${name}.svg') center/contain no-repeat;`;
		icon.setAttribute('aria-hidden', 'true');
		face.append(icon);
	}
	button.append(face);
	button.addEventListener('click', event => { event.stopPropagation(); onSelect(); });
	return button;
}

export function createCommercialZoneLabel(name: string, count: number, onSelect: () => void) {
	const button = document.createElement('button');
	button.type = 'button';
	button.dataset.commercialZoneLabel = name;
	button.setAttribute('aria-label', `${name} ${count}곳 보기`);
	button.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:7px;width:100px;height:44px;padding:0;border:0;background:transparent;color:#241318;font-family:inherit;cursor:pointer;white-space:nowrap;';
	const face = document.createElement('span');
	face.style.cssText = 'display:flex;align-items:center;gap:7px;min-height:34px;padding:0 10px;border:1px solid var(--color-brand);border-radius:10px;background:#fff;font-size:13px;font-weight:700;box-shadow:0 1px 3px #2413180a;';
	const label = document.createElement('span');
	label.textContent = name;
	const total = document.createElement('span');
	total.textContent = String(count);
	total.style.cssText = 'font-size:11px;font-weight:400;color:#75666a;';
	face.append(label, total);
	button.append(face);
	button.addEventListener('click', event => { event.stopPropagation(); onSelect(); });
	return button;
}
