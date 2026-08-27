import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import PinEditorPage from './+page.svelte';

const data = {
	pins: [],
	categories: [
		{
			id: 'category-id',
			slug: 'convenience-store',
			name: '편의점',
			icon: 'convenience_store_GS'
		}
	],
	zones: [],
	naverMapClientId: '',
	saved: false
};

describe('관리자 핀 에디터 화면', () => {
	it('교내·교외 범위와 시설 입력 항목을 제공한다', () => {
		const { body } = render(PinEditorPage, { props: { data, form: null } as never });

		expect(body).toContain('지도 핀 편집');
		expect(body).toContain('교내');
		expect(body).toContain('교외');
		expect(body).toContain('지도에 표시');
		expect(body).toContain('운영시간');
		expect(body).toContain('전화번호');
	});

	it('선택 카테고리의 20·24 아이콘을 미리 보여준다', () => {
		const { body } = render(PinEditorPage, { props: { data, form: null } as never });

		expect(body).toContain('/20 icon/convenience_store_GS.svg');
		expect(body).toContain('/24 icon/convenience_store_GS.svg');
		expect(body).not.toContain('아이콘 파일명');
	});

	it('네이버 SDK가 위치 스타일을 바꿔도 지도 높이가 유지되는 내부 컨테이너를 사용한다', () => {
		const { body } = render(PinEditorPage, { props: { data, form: null } as never });

		expect(body).toContain('class="absolute inset-0"><div class="h-full w-full"');
	});
});
