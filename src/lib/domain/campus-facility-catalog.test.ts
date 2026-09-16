import { describe, expect, it } from 'vitest';
import fixture from '../server/fixtures/campus-facilities.json';
import links from '../server/fixtures/campus-facility-place-links.json';
import { composeCampusFacilityCatalog } from './campus-facility-catalog';
import { filterCampusFacilities, getCampusFacilityMarkers, type CampusFacility } from './campus-facilities';
import { campusSpots } from './campus-spots';
import { cafeteriaPlaces, getCafeteriaPageHref } from './cafeterias';
import type { Place } from './places';

const sources = fixture as CampusFacility[];
const place = (overrides: Partial<Place>): Place => ({
	id: 'test-place', type: 'facility', name: '테스트 시설', categorySlug: 'cafe', categoryName: '카페',
	zoneId: null, scope: 'campus', latitude: 36.6105954, longitude: 127.2854624,
	locationGuide: '미래관 1층', operatingHours: null, phone: null, description: '',
	icon: 'cafe', isVisible: true, displayPriority: 0, ...overrides
});
const compose = (places: Place[]) => composeCampusFacilityCatalog(sources, places, links);

describe('기존 핀과 시설 안내의 장소 통합', () => {
	it('기존 ID·수정된 이름·좌표·연락처·운영시간을 유지하면서 조사 정보를 보충한다', () => {
		const pin = place({ id: links['FAC-042'], name: '이디야커피', operatingHours: '09:00~18:00', phone: '044-123-4567' });
		const catalog = compose([pin]);
		const item = catalog.find((item) => item.id === pin.id)!;
		expect(catalog.some((item) => item.id === 'FAC-042')).toBe(false);
		expect(item).toMatchObject({ name: pin.name, hours: pin.operatingHours, phone: pin.phone, place: pin });
		expect(item.description).toBeTruthy();
		expect(filterCampusFacilities(catalog, { category: 'cafe' })).toEqual([item]);
		expect(filterCampusFacilities(catalog, { building: '미래관', query: '이디야' })).toEqual([item]);
		expect(getCampusFacilityMarkers([item], campusSpots)).toEqual([pin]);
		expect(fixture.find((item) => item.id === 'FAC-042')?.name).toBe('이디야');
	});
	it('동명 GS25 두 지점을 건물별로 유지하며 카테고리·건물·검색에서 같은 ID를 사용한다', () => {
		const pins = [
			place({ id: links['FAC-028'], name: 'GS25편의점', categorySlug: 'convenience-store' }),
			place({ id: links['FAC-029'], name: 'GS25편의점', categorySlug: 'convenience-store', locationGuide: '호익플라자 1층', longitude: 127.2876404 })
		];
		const catalog = compose(pins);
		expect(filterCampusFacilities(catalog, { query: 'GS25' })).toHaveLength(2);
		for (const [index, building] of ['미래관', '호익프라자'].entries()) {
			const result = filterCampusFacilities(catalog, { category: 'convenience-store', building });
			expect(result.map((item) => item.id)).toEqual([pins[index].id]);
			expect(getCampusFacilityMarkers(result, campusSpots, building)).toEqual([pins[index]]);
		}
	});
	it('조사 자료에 없는 기존 서점도 포함하고 크림슨스토어와 분리한다', () => {
		const bookstore = place({ id: 'bookstore', name: '서점', categorySlug: 'bookstore', locationGuide: '과학기술 1관 Co-Working Space' });
		const crimson = place({ id: links['FAC-031'], name: '크림슨스토어', categorySlug: 'crimson-store', locationGuide: '학술정보원 2층' });
		const catalog = compose([bookstore, crimson]);
		expect(filterCampusFacilities(catalog, { category: 'bookstore', building: '과학기술1관' }).map((item) => item.id)).toEqual(['bookstore']);
		expect(filterCampusFacilities(catalog, { category: 'crimson-store' }).map((item) => item.id)).toEqual([crimson.id]);
		expect(filterCampusFacilities(catalog, { category: 'student-support' }).some((item) => item.place)).toBe(false);
	});
	it('숨김·삭제된 연결 핀과 교외 장소를 조사 자료로 다시 노출하지 않는다', () => {
		const catalog = compose([
			place({ id: links['FAC-042'], isVisible: false }),
			place({ id: links['FAC-043'], scope: 'outside' })
		]);
		expect(catalog).toHaveLength(28);
		expect(catalog.every((item) => !item.place)).toBe(true);
		expect(catalog.some((item) => item.id === 'FAC-044')).toBe(false);
	});
	it('기존 핀의 건물 안내 수정은 바로 반영하고 다른 건물의 옛 호실을 붙이지 않는다', () => {
		const updated = place({ id: links['FAC-042'], locationGuide: '학생회관 2층' });
		const catalog = compose([updated]);
		expect(filterCampusFacilities(catalog, { category: 'cafe', building: '미래관' })).toEqual([]);
		expect(filterCampusFacilities(catalog, { category: 'cafe', building: '학생회관' })[0].locations).toEqual([
			{ building: '학생회관', label: '학생회관 2층', floor: '2층' }
		]);
	});
	it('I Park의 실제 핀은 사용하되 같은 건물의 의료공제운영실에 그 핀을 복제하지 않는다', () => {
		const gym = place({ id: links['FAC-020'], name: 'I Park', categorySlug: 'gym', locationGuide: 'I PARK 휘트니스', operatingHours: '일요일 16:00~22:00' });
		const catalog = compose([gym]);
		expect(getCampusFacilityMarkers(catalog.filter((item) => item.id === gym.id), campusSpots)).toEqual([gym]);
		expect(getCampusFacilityMarkers(catalog.filter((item) => item.id === 'FAC-008'), campusSpots)).toEqual([]);
	});
	it('학식은 기존 장소 ID와 메뉴 연결을 보존하고 별도 중복 목록을 만들지 않는다', () => {
		const result = filterCampusFacilities(compose(cafeteriaPlaces), { category: 'restaurant' });
		expect(result).toHaveLength(2);
		expect(new Set(result.map((item) => item.id)).size).toBe(2);
		expect(result.map((item) => getCafeteriaPageHref(item.place!)).sort()).toEqual(['/cafeteria?cafeteria=faculty', '/cafeteria?cafeteria=jinri']);
	});
});
