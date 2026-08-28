import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import HomeMapHeader from './HomeMapHeader.svelte';

const zones = [
	{
		id: 'front-gate',
		name: '고대앞',
		center: { latitude: 36.6, longitude: 127.29 },
		boundary: [{ latitude: 36.6, longitude: 127.29 }]
	},
	{
		id: 'station',
		name: '조치원역',
		center: { latitude: 36.61, longitude: 127.3 },
		boundary: [{ latitude: 36.61, longitude: 127.3 }]
	}
];

const handlers = {
	onAreaChange: () => undefined,
	onSearchOpenChange: () => undefined,
	onSearchQueryChange: () => undefined
};

describe('메인 지도 헤더', () => {
	it('좌측 상단에 실제 골라바유 로고 이미지를 보여준다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				zones,
				selectedAreaId: 'campus',
				...handlers
			}
		});

		expect(body).toContain('src="/icon.png"');
		expect(body).toContain('alt="골라바유"');
	});

	it('골라바유 로고를 크림슨 카드 없이 투명 아이콘으로 보여준다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				zones,
				selectedAreaId: 'campus',
				...handlers
			}
		});

		expect(body).toMatch(/<img class="[^"]*object-contain[^"]*" src="\/icon\.png"/);
		expect(body).not.toMatch(/<img class="[^"]*bg-\[#8a1538\][^"]*" src="\/icon\.png"/);
	});

	it('기본 상태에서 상점 바로가기와 시설 검색 동작을 함께 제공한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				zones,
				selectedAreaId: 'campus',
				...handlers
			}
		});

		expect(body).toContain('href="/shops"');
		expect(body).toContain('aria-label="상점"');
		expect(body).toContain('/20 icon/shop.svg');
		expect(body).toContain('aria-label="시설 검색"');
	});

	it('캠퍼스를 선택하면 전체 학교 이름과 시설 검색 버튼을 제공한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				zones,
				selectedAreaId: 'campus',
				...handlers
			}
		});

		expect(body).toContain('aria-label="시설 검색"');
		expect(body).toContain('/20 icon/search.svg');
		expect(body).toContain('고려대학교 세종캠퍼스');
		expect(body).toContain('-rotate-90');
		expect(body).not.toContain('고대앞');
	});

	it('검색을 열면 교내 시설 검색 입력창으로 전환한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				zones,
				selectedAreaId: 'campus',
				searchOpen: true,
				searchQuery: '',
				...handlers
			}
		});

		expect(body).toContain('placeholder="교내 시설을 검색해 보세요"');
		expect(body).toContain('aria-label="시설 검색 닫기"');
	});

	it('선택한 지도 구역을 헤더의 접근 가능한 이름으로 안내한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				zones,
				selectedAreaId: 'front-gate',
				...handlers
			}
		});

		expect(body).toContain('aria-label="지도 구역: 고대앞"');
	});

	it('생활권 선택을 기본 select가 아닌 접근 가능한 커스텀 버튼으로 제공한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				zones,
				selectedAreaId: 'campus',
				...handlers
			}
		});

		expect(body).toContain('aria-haspopup="listbox"');
		expect(body).toContain('aria-expanded="false"');
		expect(body).not.toContain('<select');
	});

	it('학교 밖 구역을 선택하면 해당 구역 이름을 드롭다운 값으로 표시한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				zones,
				selectedAreaId: 'front-gate',
				...handlers
			}
		});

		expect(body).toContain('고대앞');
		expect(body).not.toContain('aria-label="학교 밖 상권 구역"');
	});

	it('드롭다운 레이어를 학교 밖 필터칩보다 위에 배치한다', () => {
		const { body } = render(HomeMapHeader, {
			props: {
				zones,
				selectedAreaId: 'front-gate',
				...handlers
			}
		});

		expect(body).toMatch(/<header class="[^"]*\bz-30\b/);
	});
});
