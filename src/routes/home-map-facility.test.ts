// @ts-expect-error 프로젝트 tsconfig는 Node 타입을 전역으로 포함하지 않는다.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

describe('메인 지도 시설 탐색 연결', () => {
	it('헤더 검색과 고정 시설 카테고리를 시설 결과 모드에 연결한다', () => {
		expect(source).toContain('<FacilityFilterChips');
		expect(source).toContain('onSearchQueryChange={updateFacilitySearch}');
		expect(source).toContain("sheetMode = 'facility'");
		expect(source).toContain('getVisibleFacilityPlaces(data.places');
	});

	it('시설 딥링크는 요청 카테고리를 선택하고 시설 결과를 연다', () => {
		expect(source).toContain("data.initialPanel === 'facility'");
		expect(source).toContain("selectedFacilityCategory = data.initialFacilityCategory ?? 'all'");
		expect(source).toContain('openFacilityResults()');
	});

	it('시설·학식·셔틀 결과를 좌우 스냅 목록으로 제공한다', () => {
		expect(source).toContain('bind:this={facilityScroller}');
		expect(source).toContain('bind:this={cafeteriaScroller}');
		expect(source).toContain('bind:this={shuttleScroller}');
		expect(source.match(/snap-x snap-mandatory/g)?.length).toBeGreaterThanOrEqual(3);
	});
});
