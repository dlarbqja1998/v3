import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { analyticsEvents } from './events';

// 실제 홈 화면의 핸들러를 실행해, 조기 반환 경로에서도 이벤트가 전송되는지 검증한다.
const homeSource = readFileSync(new URL('../../routes/+page.svelte', import.meta.url), 'utf8');
const script = homeSource.match(/<script lang="ts">([\s\S]*?)<\/script>/)![1];
const parsed = ts.createSourceFile('home.ts', script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function runHandler(name: string, bindings: Record<string, unknown>, ...args: unknown[]) {
	const declaration = parsed.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name);
	if (!declaration) throw new Error(`홈 핸들러를 찾지 못했어요: ${name}`);
	const { outputText } = ts.transpileModule(declaration.getText(parsed), { compilerOptions: { target: ts.ScriptTarget.ES2022 } });
	runInNewContext(`${outputText}\n${name}(...args);`, {
		analyticsEvents, facilitySearchOpen: false, restaurantReturnFocus: null, restaurantLoadError: '',
		activeCampusSpotId: '', activeEventId: '', activePlaceId: '', homeFocusRequestId: 0,
		focusCampusSpotId: '', sheetMode: 'home', showCampusBoundaries: false, ...bindings, args
	});
}

describe('홈 화면의 클릭 이벤트 실행', () => {
	it.each(['campus', 'outside'])('새 %s 검색 경로의 조기 반환 전에 검색 기록을 예약한다', (areaMode) => {
		const searchTracker = { update: vi.fn() };
		const navigate = vi.fn();
		runHandler('updateFacilitySearch', {
			areaMode, data: { campusFacilities: [], outsideRestaurants: [] }, searchTracker,
			outsideDirectory: { query: '' }, filterCampusFacilities: () => [{ id: 'FAC-047' }],
			filterRestaurants: () => [{ place: { id: 'restaurant-1' } }],
			openCampusDirectory: navigate, changeOutsideDirectory: navigate
		}, '택배');
		expect(searchTracker.update).toHaveBeenCalledWith('택배', expect.objectContaining({ area_mode: areaMode, result_count: 1 }));
		expect(navigate).toHaveBeenCalledExactlyOnceWith({ query: '택배' });
	});

	it.each(['campus-facility', 'outside'])('%s 지도 핀은 상세를 열기 전에 클릭을 한 번 기록한다', (sheetMode) => {
		const track = vi.fn();
		const open = vi.fn();
		runHandler('handleMarkerClick', {
			track, sheetMode, areaMode: sheetMode === 'outside' ? 'outside' : 'campus',
			outsideMapResults: [{ place: { id: 'place-1' } }], data: { campusFacilities: [{ id: 'place-1' }] },
			openRestaurant: open, selectCampusFacility: open
		}, 'place-1');
		expect(track).toHaveBeenCalledExactlyOnceWith('click_place_marker', expect.objectContaining({ place_id: 'place-1', sheet_mode: sheetMode }));
		expect(open).toHaveBeenCalledTimes(1);
		expect(track.mock.invocationCallOrder[0]).toBeLessThan(open.mock.invocationCallOrder[0]);
	});

	it('택배 검색 결과를 선택하면 검색 결과와 시설 상세 열기를 각각 기록한다', () => {
		const track = vi.fn();
		const facility = { id: 'FAC-047', name: '기숙사 택배 보관소', locations: [{ building: '정의관' }] };
		const pushState = vi.fn();
		const flush = vi.fn();
		runHandler('selectCampusFacility', {
			track, campusDirectory: { query: '택배', building: '정의관' }, data: { campusFacilities: [facility] },
			searchTracker: { flush }, filterCampusFacilities: () => [facility], sheetDetent: 'medium',
			replaceState: vi.fn(), pushState, page: { state: {} }
		}, facility.id);
		expect(flush).toHaveBeenCalledTimes(1);
		for (const event of ['search_result_selected', 'open_place_sheet']) {
			expect(track).toHaveBeenCalledWith(event, expect.objectContaining({
				place_id: 'FAC-047', place_name: facility.name, source: 'facility_list', result_position: 1, has_search_query: true
			}));
		}
		expect(pushState).toHaveBeenCalledWith('', expect.objectContaining({ campusDirectory: expect.objectContaining({ facilityId: facility.id }) }));
	});

	it('교외 검색 결과 선택도 상세 화면 이동과 함께 기록한다', () => {
		const track = vi.fn();
		const restaurant = { place: { id: 'restaurant-1', name: '식당', categorySlug: 'restaurant' } };
		const pushState = vi.fn();
		runHandler('openRestaurant', {
			track, outsideDirectory: { query: '식당' }, data: { outsideRestaurants: [restaurant] }, outsideResults: [restaurant],
			searchTracker: { flush: vi.fn() }, document: { activeElement: null }, HTMLElement: class {},
			replaceState: vi.fn(), pushState, sheetDetent: 'medium', page: { state: {} }, restaurantCache: { peek: () => undefined }
		}, restaurant.place.id);
		expect(track).toHaveBeenCalledWith('search_result_selected', expect.objectContaining({ place_id: 'restaurant-1', area_mode: 'outside', result_position: 1 }));
		expect(track).toHaveBeenCalledWith('open_place_sheet', expect.objectContaining({ place_id: 'restaurant-1', source: 'restaurant_list' }));
		expect(pushState).toHaveBeenCalledWith('/restaurants/restaurant-1', expect.anything());
	});

	it('뒤로 가기의 건물 복원은 클릭으로 세지 않고 실제 건물 선택만 기록한다', () => {
		const track = vi.fn();
		const bindings = {
			track, campusSpots: [{ id: 'building-정의관', name: '정의관' }], clearCampusDirectory: vi.fn(),
			homeFocusRequestId: 0, setSheetDetent: vi.fn(), getCampusSpotPanelPresentation: () => ({ detent: 'medium' })
		};
		runHandler('selectCampusSpot', bindings, 'building-정의관', 'history_restore');
		expect(track).not.toHaveBeenCalled();
		runHandler('selectCampusSpot', bindings, 'building-정의관');
		expect(track).toHaveBeenCalledExactlyOnceWith('select_building', expect.objectContaining({ building_name: '정의관', source: 'home_map' }));
	});
});
