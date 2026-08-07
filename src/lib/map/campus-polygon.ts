export type CampusPolygonStyle = {
	clickable: boolean;
	fillColor: string;
	fillOpacity: number;
	strokeColor: string;
	strokeOpacity: number;
	strokeWeight: number;
};

export function getCampusPolygonStyle(isActive: boolean): CampusPolygonStyle {
	return {
		clickable: true,
		fillColor: isActive ? '#a51c45' : '#5f0f2d',
		fillOpacity: isActive ? 0.22 : 0.1,
		strokeColor: isActive ? '#a51c45' : '#5f0f2d',
		strokeOpacity: isActive ? 0.92 : 0.45,
		strokeWeight: isActive ? 3 : 1
	};
}
