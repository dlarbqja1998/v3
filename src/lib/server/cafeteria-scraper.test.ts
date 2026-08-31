import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCafeteriaMenu } from './cafeteria-scraper';
import { MENU_CACHE_KEY, MENU_META_KEY } from './cafeteria-cache';

describe('학식 원본 메뉴 정리', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('정리 전 식단이 남은 기존 캐시와 새 캐시를 분리한다', () => {
		expect(MENU_CACHE_KEY).toBe('cafeteria_menu_weekly_v2');
		expect(MENU_META_KEY).toBe('cafeteria_menu_weekly_meta_v2');
	});

	it('알레르기 번호와 kcal 두 줄을 제거하고 순수 메뉴명만 반환한다', async () => {
		const html = `
			<div class="diet-menu">
				<div class="title">학생 식당</div>
				<table>
					<thead><tr><th>구분</th><th>8.31 월</th></tr></thead>
					<tbody>
						<tr>
							<th>일품</th>
							<td><p class="offTxt">불고기(1, 5, 6, 10)<br>쌀밥(5)<br>kcal<br/>984</p></td>
						</tr>
					</tbody>
				</table>
			</div>
		`;
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response(html, { status: 200 }))
		);

		const menu = await getCafeteriaMenu();

		expect(menu).not.toBeTypeOf('string');
		if (typeof menu === 'string') return;
		expect(menu.days[0]?.student.special).toEqual(['불고기', '쌀밥']);
	});
});
