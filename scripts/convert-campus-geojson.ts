import fs from 'node:fs';

type GeoJsonFeature = {
	properties?: Record<string, string | undefined>;
	geometry?: {
		type?: string;
		coordinates?: number[][][];
	};
};

type GeoJsonCollection = {
	features?: GeoJsonFeature[];
};

const inputPath = process.argv[2] ?? 'C:\\Users\\TEST OS\\Downloads\\export.geojson';
const displayNameOverrides: Record<string, string> = {
	'way/856399067': '문화융합관'
};

function slugifyCampusName(name: string) {
	return name
		.toLowerCase()
		.replaceAll(' ', '-')
		.replaceAll('&', 'and')
		.replace(/[()]/g, '');
}

function toBoundary(feature: GeoJsonFeature) {
	const ring = feature.geometry?.type === 'Polygon' ? feature.geometry.coordinates?.[0] : undefined;
	if (!ring) return [];

	return ring.map(([longitude, latitude]) => ({ latitude, longitude }));
}

function toCenter(boundary: { latitude: number; longitude: number }[]) {
	const withoutClosingPoint = boundary.slice(0, -1);
	const points = withoutClosingPoint.length > 0 ? withoutClosingPoint : boundary;
	const sum = points.reduce(
		(accumulator, point) => ({
			latitude: accumulator.latitude + point.latitude,
			longitude: accumulator.longitude + point.longitude
		}),
		{ latitude: 0, longitude: 0 }
	);

	return {
		latitude: Number((sum.latitude / points.length).toFixed(12)),
		longitude: Number((sum.longitude / points.length).toFixed(12))
	};
}

const geojson = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as GeoJsonCollection;
const spots = (geojson.features ?? []).map((feature) => {
	const properties = feature.properties ?? {};
	const osmId = properties['@id'] ?? '';
	const rawName = properties.name ?? properties['name:ko'] ?? properties['name:en'] ?? '이름 없는 건물';
	const name = displayNameOverrides[osmId] ?? rawName;
	const boundary = toBoundary(feature);

	return {
		id: `building-${slugifyCampusName(name)}`,
		name,
		type: 'building',
		center: toCenter(boundary),
		boundary,
		source: 'osm',
		osmId,
		description: `${name} 구역입니다.`
	};
});

console.log(JSON.stringify(spots, null, 2));
