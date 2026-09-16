import { describe, expect, it } from 'vitest';
import fixture from '../server/fixtures/campus-facilities.json';
import { campusSpots } from './campus-spots';
import {
	filterCampusFacilities, getCampusFacilityMarkers, getFacilityBuildingSpots,
	getFacilityOfficialUrl, getFacilityPhoneLinks, type CampusFacility
} from './campus-facilities';

const facilities = fixture as CampusFacility[];
const byId = (id: string) => facilities.find((facility) => facility.id === id)!;

describe('교내 시설 탐색', () => {
	it('공식 자료로 추가한 건강센터를 포함해 시설을 중복 없이 유지한다', () => {
		expect(facilities).toHaveLength(46);
		expect(new Set(facilities.map((item) => item.id)).size).toBe(46);
	});
	it('이름을 몰라도 증명서·장학금·프린트와 건물명으로 찾는다', () => {
		expect(filterCampusFacilities(facilities, { query: '증명서' }).map((item) => item.id).sort()).toEqual(['FAC-001', 'FAC-002']);
		expect(filterCampusFacilities(facilities, { query: '장학금' }).map((item) => item.id)).toContain('FAC-003');
		expect(filterCampusFacilities(facilities, { query: '학술정보원 프린트' }).map((item) => item.id)).toEqual(['FAC-034']);
		expect(filterCampusFacilities(facilities, { query: '과학기술1관 프린트' }).map((item) => item.id)).toEqual(['FAC-032']);
	});
	it('목적·건물·검색 조건을 동시에 적용하고 빈 결과를 유지한다', () => {
		const matches = filterCampusFacilities(facilities, { purpose: 'administration', building: '학술정보원' });
		expect(matches.map((item) => item.id).sort()).toEqual(['FAC-001', 'FAC-002']);
		expect(filterCampusFacilities(facilities, { query: '없는시설검색' })).toEqual([]);
	});
	it('건물 별칭을 연결하되 불확실한 기숙사 운영실에는 좌표를 만들지 않는다', () => {
		expect(getFacilityBuildingSpots(byId('FAC-029'), campusSpots)[0].name).toBe('호익프라자');
		expect(getFacilityBuildingSpots(byId('FAC-032'), campusSpots)[0].name).toBe('과학기술1관');
		expect(getFacilityBuildingSpots(byId('FAC-021'), campusSpots)).toEqual([]);
		expect(getFacilityBuildingSpots(byId('FAC-027'), campusSpots)).toEqual([]);
	});
	it('교수학습정보센터의 방문 지점을 두 건물에 유지하고 호실에서 층을 추정하지 않는다', () => {
		const facility = byId('FAC-013');
		expect(getFacilityBuildingSpots(facility, campusSpots).map((spot) => spot.name).sort()).toEqual(['문화스포츠관', '학술정보원']);
		expect(facility.locations.every((location) => location.floor === null)).toBe(true);
	});
	it('같은 건물의 시설은 하나의 건물 핀으로 묶는다', () => {
		const markers = getCampusFacilityMarkers(filterCampusFacilities(facilities, { building: '학술정보원' }), campusSpots, '학술정보원');
		expect(markers).toHaveLength(1);
		const library = markers.filter((marker) => marker.id === 'campus-facilities:building-학술정보원');
		expect(library).toHaveLength(1);
		expect(library[0].locationGuide).toBe('학술정보원 건물 위치');
		expect(getCampusFacilityMarkers([byId('FAC-027')], campusSpots)).toEqual([]);
	});
	it('미확인 운영시간을 유지한다', () => {
		expect(byId('FAC-002').hours).toBeNull();
		expect(byId('FAC-001').hours).toContain('12:00~13:00 제외');
	});
	it('완전한 전화번호만 연결하고 단축 번호를 추측하지 않는다', () => {
		expect(getFacilityPhoneLinks('860-1984 (교내전화 표기)')).toEqual([]);
		expect(getFacilityPhoneLinks('044-860-1088~1089')).toEqual([{ label: '044-860-1088', href: 'tel:0448601088' }]);
		expect(getFacilityPhoneLinks(byId('FAC-013').phone)).toHaveLength(2);
		expect(getFacilityOfficialUrl('javascript:alert(1)')).toBeNull();
	});
});
