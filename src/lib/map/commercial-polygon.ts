export function getCommercialPolygonStyle(selected: boolean) {
	return {
		strokeColor: selected ? '#7a1237' : '#a51c45',
		strokeOpacity: selected ? 0.95 : 0.7,
		strokeWeight: selected ? 3 : 2,
		fillColor: '#a51c45',
		fillOpacity: selected ? 0.22 : 0.1
	};
}
