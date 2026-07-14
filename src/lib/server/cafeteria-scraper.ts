import { load } from 'cheerio';
import type { DailyMenu, MenuDayKey, WeeklyMenu } from '$lib/domain/places';

const MENU_DAY_KEYS: MenuDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_LABELS: Record<MenuDayKey, string> = {
	mon: '월',
	tue: '화',
	wed: '수',
	thu: '목',
	fri: '금'
};

function createEmptyDay(key: MenuDayKey, date: string, day: string): DailyMenu {
	return {
		key,
		date,
		day,
		student: {
			breakfast: [],
			korean: [],
			special: [],
			snack: [],
			dinner: []
		},
		faculty: {
			lunch: [],
			dinner: []
		}
	};
}

function toSeoulNow() {
	return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

function getCurrentDayKey(now = toSeoulNow()): MenuDayKey {
	const weekday = now.getDay();
	if (weekday === 1) return 'mon';
	if (weekday === 2) return 'tue';
	if (weekday === 3) return 'wed';
	if (weekday === 4) return 'thu';
	return 'fri';
}

function getCurrentWeekMonday(now = toSeoulNow()) {
	const monday = new Date(now);
	const day = monday.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	monday.setDate(monday.getDate() + diff);
	monday.setHours(0, 0, 0, 0);
	return monday;
}

function formatDate(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}.${month}.${day}`;
}

function sanitizeMenuItems(rawHtml: string) {
	return rawHtml
		.replace(/<br\s*[/]?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/"/g, '')
		.split('\n')
		.map((item) => item.replace(/\s*\([\d,.\s]+\)/g, '').trim())
		.filter((item) => item.length > 0);
}

function parseHeaderDay(text: string) {
	const compact = text.replace(/\s+/g, '');
	const dateMatch = compact.match(/(\d{1,2})\.(\d{1,2})/);
	if (!dateMatch) return null;

	const dayMatch = compact.match(/[월화수목금]/);
	const dayLabel = dayMatch?.[0] ?? null;
	const key = MENU_DAY_KEYS.find((menuDayKey) => DAY_LABELS[menuDayKey] === dayLabel);

	return {
		month: Number(dateMatch[1]),
		day: Number(dateMatch[2]),
		dayLabel,
		key
	};
}

function getRawCellHtml($: ReturnType<typeof load>, cell: ReturnType<ReturnType<typeof load>>) {
	let rawMenuHtml = cell.find('.offTxt').html();
	if (!rawMenuHtml || rawMenuHtml.trim() === '') {
		rawMenuHtml = cell.html();
	}

	return rawMenuHtml?.replace(/&nbsp;/g, '').trim() ?? '';
}

export async function getCafeteriaMenu(): Promise<WeeklyMenu | string> {
	const now = toSeoulNow();
	const monday = getCurrentWeekMonday(now);
	const url = 'https://fund.korea.ac.kr/koreaSejong/8028/subview.do';

	const weekDays = MENU_DAY_KEYS.map((key, index) => {
		const date = new Date(monday);
		date.setDate(monday.getDate() + index);
		return createEmptyDay(key, formatDate(date), DAY_LABELS[key]);
	});
	const dayMap = new Map<MenuDayKey, DailyMenu>(weekDays.map((day) => [day.key, day]));

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			},
			signal: AbortSignal.timeout(4000)
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const html = await response.text();
		const $ = load(html);
		let foundAnyMenu = false;

		$('.diet-menu').each((_, menuDiv) => {
			const title = $(menuDiv).find('.title').text();
			const isStudent = title.includes('학생');
			const isFaculty = title.includes('교직원');
			if (!isStudent && !isFaculty) return;

			const headerColumns: Array<{ tdIndex: number; key: MenuDayKey }> = [];

			$(menuDiv)
				.find('table thead th')
				.each((index, element) => {
					const parsed = parseHeaderDay($(element).text());
					if (!parsed?.key) return;

					headerColumns.push({
						tdIndex: index - 1,
						key: parsed.key
					});
				});

			if (headerColumns.length === 0) return;

			let currentRowTitle = '';

			$(menuDiv)
				.find('table tbody tr')
				.each((_, tr) => {
					const th = $(tr).find('th');
					if (th.length > 0) {
						currentRowTitle = th.text().trim();
					}

					const tds = $(tr).find('td');

					for (const { tdIndex, key } of headerColumns) {
						if (tdIndex < 0) continue;

						const targetDay = dayMap.get(key);
						if (!targetDay) continue;

						const targetTd = tds.eq(tdIndex);
						const rawMenuHtml = getRawCellHtml($, targetTd);
						if (!rawMenuHtml) continue;

						const menuArray = sanitizeMenuItems(rawMenuHtml);
						if (menuArray.length === 0) continue;

						foundAnyMenu = true;

						if (isFaculty) {
							if (currentRowTitle.includes('중식')) {
								targetDay.faculty.lunch = menuArray;
							} else if (currentRowTitle.includes('석식')) {
								targetDay.faculty.dinner = menuArray;
							}
							continue;
						}

						if (currentRowTitle.includes('조식')) {
							targetDay.student.breakfast = menuArray;
						} else if (currentRowTitle.includes('한식')) {
							targetDay.student.korean = menuArray;
						} else if (currentRowTitle.includes('일품')) {
							targetDay.student.special = menuArray;
						} else if (currentRowTitle.includes('분식')) {
							targetDay.student.snack = menuArray;
						} else if (currentRowTitle.includes('석식')) {
							targetDay.student.dinner = menuArray;
						}
					}
				});
		});

		if (!foundAnyMenu) {
			return '이번 주 학식 메뉴를 찾지 못했습니다.';
		}

		const todayKey = getCurrentDayKey(now);
		const todayMenu = dayMap.get(todayKey) ?? weekDays[0];

		return {
			weekStartDate: formatDate(monday),
			todayKey,
			todayDate: todayMenu.date,
			todayDay: todayMenu.day,
			days: weekDays
		};
	} catch (error) {
		console.error('학식 크롤링 실패:', error);
		return '학식 메뉴를 불러오지 못했습니다.';
	}
}
