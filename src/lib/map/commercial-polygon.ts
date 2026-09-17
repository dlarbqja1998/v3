export function getCommercialPolygonStyle(selected: boolean) {
	return {
		strokeColor: '#a61942',
		strokeStyle: 'shortdash',
		strokeOpacity: selected ? 0.8 : 0,
		strokeWeight: selected ? 1.4 : 0,
		fillColor: '#a61942',
		fillOpacity: 0
	};
}
