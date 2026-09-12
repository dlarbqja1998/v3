export type FestivalSession = 'day' | 'night';
export type FestivalItem = { name: string; description?: string; price: number | null };
export type FestivalBooth = {
	id: string; name: string; subtitle: string; number: string; location: string; order: number; date: string;
	clubName?: string;
	sourceUrl?: string;
	sessions: Partial<Record<FestivalSession, { hours?: string; items: FestivalItem[] }>>;
};

/** 낮 지도에 기재된 1~22번 동아리. 활동·가격은 홍보 자료를 받은 뒤 추가한다. */
const dayBooths: FestivalBooth[] = [
	'비트앤소울', '극예술연구회 섬', '소리마당', '무단외박', '세미클래식', '콘체르토',
	'Apeature', '그린맥', '서화회', 'Kloset', '고불당', '다가치', 'CCC', 'K.A.T',
	'상승기류', '네추럴', 'KUTT', '고농회', 'TIME', 'MMC', '별빛항해', '마나'
].map((name, index) => ({
	id: `day-booth-${index + 1}`, name, subtitle: '', number: String(index + 1), location: '',
	order: index + 1, date: '2026-09-15', sessions: { day: { hours: '12:00–17:30', items: [] } }
}));

/** 사용자 제공 밤 부스 안내 이미지와 동아리명·운영시간 확인 답변. */
const nightBooths: FestivalBooth[] = [
	['포르테시모 라운지', '포르테'],
	['경성급 근육카페', '네추럴'],
	['극락막창', '고불당'],
	['STARWEAR', 'Kloset'],
	['다가치이익', '다가치'],
	['별 헤는 밤', '아람소래'],
	['Shooting Star', 'K.A.T'],
	['고농회 K.U.B.A', '고농회'],
	['SUMWAY', '극예술연구회 섬'],
	['피터네 식당', 'MMC'],
	['캐스팅의 기묘한 식탁', '캐스팅'],
	['상승의 밤', '상승기류'],
	['석탑은 핑계고', '석탑회']
].map(([name, clubName], index) => ({
	id: `night-booth-${index + 1}`, name, clubName, subtitle: '', number: String(index + 1),
	location: '', order: index + 1, date: '2026-09-15', sessions: { night: { hours: '18:00–24:00', items: [] } }
}));
export type Festival = {
	id: string; name: string; mapLabel?: string; dates: { date: string; label: string; hours: Partial<Record<FestivalSession, string>> }[];
	area: { latitude: number; longitude: number; boundary: { latitude: number; longitude: number }[]; label: string; approximate: boolean };
	booths: FestivalBooth[];
	performances: { id: string; date: string; session: FestivalSession; time: string; name: string; kind: string }[];
};

/** 사용자 제공 행사 자료와 관리자가 확인·저장한 축제 구역. */
export const festivalPreview: Festival = {
	id: 'club-festival-preview', name: '2026 동연제 : POLARIS', mapLabel: 'POLARIS',
	dates: [{ date: '2026-09-15', label: '9월 15일 (화)', hours: { day: '12:00–17:30', night: '18:00–24:00' } }],
	// 2026-09-12 관리자가 로컬에서 저장한 경계와 대표 핀을 첫 공개의 기본값으로 사용한다.
	area: { latitude: 36.6106648, longitude: 127.2886266, boundary: [
		{ latitude: 36.6108342, longitude: 127.2881379 }, { latitude: 36.6109268, longitude: 127.2892022 },
		{ latitude: 36.6105419, longitude: 127.2892478 }, { latitude: 36.610473, longitude: 127.287985 }
	], label: '학생회관 일대', approximate: false },
	booths: [{
		id: 'icarus', name: '이카루스', subtitle: '항공 모형과 함께하는 낮부스', number: '23',
		location: '무대 바로 앞', order: 23, date: '2026-09-15', sourceUrl: 'https://everytime.kr/370457/v/417775499',
		sessions: { day: { hours: '12:00–16:40', items: [
			{ name: '메차 항공레온', description: '학생회관 주변에 숨은 미니 모형을 찾아 부스로 가져오면 선물을 받아요.', price: 0 },
			{ name: '미니 모형 키링 만들기', description: '3D 프린터로 만든 미니 모형을 조립해 나만의 키링을 만들어요.', price: 1000 },
			{ name: '모형 비행기 던지기', description: '폼 비행기를 링 안으로 통과시키면 새콤달콤을 받아요.', price: 0 },
			{ name: '항공 모형 전시', description: '동아리원이 제작한 항공 모형과 설명을 만나보세요.', price: 0 }
		] } }
	}, ...dayBooths, ...nightBooths],
	// 사용자 제공 공연표. 현재 등록된 9월 15일 축제의 밤 일정에 연결한다.
	performances: [
		{ id: 'mc-opening', date: '2026-09-15', session: 'night', time: '18:00–18:10', name: 'MC 오프닝', kind: '' },
		{ id: 'kodae-nongak', date: '2026-09-15', session: 'night', time: '18:10–18:30', name: '고대농악대', kind: '' },
		{ id: 'sori-madang', date: '2026-09-15', session: 'night', time: '18:40–19:00', name: '소리마당', kind: '' },
		{ id: 'mudan-oebak', date: '2026-09-15', session: 'night', time: '19:10–19:30', name: '무단외박', kind: '' },
		{ id: 'casting', date: '2026-09-15', session: 'night', time: '20:00–20:20', name: '캐스팅', kind: '' },
		{ id: 'beat-and-soul', date: '2026-09-15', session: 'night', time: '20:30–20:50', name: '비트앤소울', kind: '' },
		{ id: 'udf', date: '2026-09-15', session: 'night', time: '21:00–21:20', name: 'UDF', kind: '' },
		{ id: 'mc-closing', date: '2026-09-15', session: 'night', time: '22:10–22:20', name: 'MC 클로징', kind: '' },
		{ id: 'luters', date: '2026-09-15', session: 'night', time: '22:30–24:00', name: '루터스', kind: '' }
	]
};

export function getFestivalBooths(festival: Festival, date?: string, session?: FestivalSession) {
	return festival.booths.filter((booth) => (!date || booth.date === date) && (!session || booth.sessions[session])).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function formatFestivalPrice(price: number | null) {
	return price === null ? '가격 안내 예정' : price === 0 ? '무료' : `${price.toLocaleString('ko-KR')}원`;
}

/** 지도와 같은 축제 자료를 오늘 목록의 진행 상태·진입 링크로 사용한다. */
export function getFestivalTodayEntry(festival: Festival, now = new Date()) {
	const ranges = festival.dates.map((date) => {
		const midnight = Date.parse(`${date.date}T00:00:00+09:00`);
		const sessions = Object.values(date.hours).map((hours) => {
			const [start, end] = hours.split('–');
			const minutes = (time: string) => {
				const [hour, minute] = time.replace('다음 날 ', '').split(':').map(Number);
				return (hour * 60 + minute + (time.startsWith('다음 날 ') ? 1440 : 0)) * 60_000;
			};
			return { start: midnight + minutes(start), end: midnight + minutes(end) };
		});
		return sessions.length ? sessions : [{ start: midnight, end: midnight + 86_400_000 }];
	}).flat().filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end));
	if (!ranges.length) return null;
	const startsAt = Math.min(...ranges.map((range) => range.start));
	const endsAt = Math.max(...ranges.map((range) => range.end));
	if (now.getTime() >= endsAt) return null;
	return {
		id: festival.id, title: festival.name, location: festival.area.label,
		dateLabel: festival.dates.map((date) => date.label).join(' · '),
		status: now.getTime() < startsAt ? 'upcoming' as const : 'ongoing' as const,
		href: '/?panel=festival'
	};
}
