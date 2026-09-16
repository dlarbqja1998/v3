import type { CampusFacility } from '$lib/domain/campus-facilities';
import { composeCampusFacilityCatalog } from '$lib/domain/campus-facility-catalog';
import type { Place } from '$lib/domain/places';
import facilities from './fixtures/campus-facilities.json';
import links from './fixtures/campus-facility-place-links.json';

export function readCampusFacilities(places: Place[] = []): CampusFacility[] {
	return composeCampusFacilityCatalog(facilities as CampusFacility[], places, links);
}
