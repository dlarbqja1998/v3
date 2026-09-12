import { dev } from '$app/environment';
import { festivalPreview, type Festival } from '$lib/domain/festival';
import { normalizeZoneBoundary } from './zone-editor';

type Store = { get(key: string): Promise<string | null>; put(key: string, value: string): Promise<void> };
export type FestivalDraft = { festival: Festival; revision: number; updatedAt: string | null; updatedBy: number | null };
const key = dev ? 'local:festival-editor:v1' : 'festival:polaris:2026:v1';
// 같은 서버 인스턴스의 저장을 직렬화한다. KV는 여러 인스턴스 간 원자적 잠금을 제공하지 않는다.
let saving: Promise<unknown> = Promise.resolve();

export async function readFestivalDraft(store?: Store): Promise<FestivalDraft> {
	const raw = await store?.get(key);
	if (raw) {
		const draft = JSON.parse(raw) as FestivalDraft;
		if (draft.festival.name === '동아리연합제' && !draft.festival.mapLabel) draft.festival.name = festivalPreview.name;
		draft.festival.mapLabel ??= festivalPreview.mapLabel;
		// 초기 로컬 시안의 저장 데이터에도 개별 부스의 원자료 날짜를 보존한다.
		draft.festival.booths = draft.festival.booths.map((booth) => ({ ...booth, date: booth.date ?? festivalPreview.booths.find((item) => item.id === booth.id)?.date ?? draft.festival.dates[0]?.date }));
		const suppliedBoothIds = new Set(festivalPreview.booths.map((item) => item.id));
		draft.festival.booths = [...draft.festival.booths.filter((item) => !suppliedBoothIds.has(item.id)), ...structuredClone(festivalPreview.booths)];
		draft.festival.dates = draft.festival.dates.map((date) => ({ ...date, hours: { ...festivalPreview.dates.find((item) => item.date === date.date)?.hours, ...date.hours } }));
		// 구역만 저장한 이전 초안에도 새로 확인된 공연표를 반영한다. 사용자가 편집한 구역은 유지한다.
		const suppliedIds = new Set(festivalPreview.performances.map((item) => item.id));
		draft.festival.performances = [...draft.festival.performances.filter((item) => !suppliedIds.has(item.id)), ...structuredClone(festivalPreview.performances)];
		return draft;
	}
	return { festival: structuredClone(festivalPreview), revision: 0, updatedAt: null, updatedBy: null };
}

export function parseFestivalArea(form: FormData) {
	const name = String(form.get('name') ?? '').trim();
	const mapLabel = String(form.get('mapLabel') ?? name).trim();
	const label = String(form.get('location') ?? '').trim();
	const date = String(form.get('date') ?? '');
	const latitude = Number(form.get('latitude'));
	const longitude = Number(form.get('longitude'));
	const revision = Number(form.get('revision'));
	if (!name || name.length > 80 || !label || label.length > 80) return { ok: false, message: '축제명과 장소명을 80자 이내로 입력해 주세요.' } as const;
	if (!mapLabel || mapLabel.length > 80) return { ok: false, message: '지도 표시 이름을 80자 이내로 입력해 주세요.' } as const;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) return { ok: false, message: '올바른 행사 날짜를 입력해 주세요.' } as const;
	if (!/^\d+$/.test(String(form.get('revision') ?? '')) || !Number.isInteger(revision) || revision < 0) return { ok: false, message: '저장 버전을 확인할 수 없습니다. 새로고침해 주세요.' } as const;
	const inCampus = (lat: number, lon: number) => Number.isFinite(lat) && Number.isFinite(lon) && lat >= 36.59 && lat <= 36.63 && lon >= 127.27 && lon <= 127.31;
	if (!inCampus(latitude, longitude)) return { ok: false, message: '대표 핀을 세종캠퍼스 주변에 지정해 주세요.' } as const;
	let boundary: Festival['area']['boundary'];
	try { boundary = normalizeZoneBoundary(JSON.parse(String(form.get('boundary') ?? ''))); } catch { boundary = []; }
	if (boundary.length < 3 || boundary.length > 100 || boundary.some((p) => !inCampus(p.latitude, p.longitude))) return { ok: false, message: '캠퍼스 주변에 경계점을 3~100개 지정해 주세요.' } as const;
	if (new Set(boundary.map((p) => `${p.latitude},${p.longitude}`)).size !== boundary.length) return { ok: false, message: '겹치는 경계점을 제거해 주세요.' } as const;
	const area = Math.abs(boundary.reduce((sum,p,i) => { const q = boundary[(i+1)%boundary.length]; return sum + p.latitude*q.longitude-q.latitude*p.longitude; }, 0));
	if (area < 1e-10) return { ok: false, message: '경계점이 한 직선에 놓이지 않게 지정해 주세요.' } as const;
	const turn = (a: typeof boundary[number], b: typeof boundary[number], c: typeof boundary[number]) => (b.longitude-a.longitude)*(c.latitude-a.latitude)-(b.latitude-a.latitude)*(c.longitude-a.longitude);
	for (let i=0;i<boundary.length;i++) for (let j=i+1;j<boundary.length;j++) {
		if (j===i+1 || (i===0 && j===boundary.length-1)) continue;
		const a=boundary[i], b=boundary[(i+1)%boundary.length], c=boundary[j], d=boundary[(j+1)%boundary.length];
		if (turn(a,b,c)*turn(a,b,d)<=0 && turn(c,d,a)*turn(c,d,b)<=0 && Math.max(Math.min(a.latitude,b.latitude),Math.min(c.latitude,d.latitude))<=Math.min(Math.max(a.latitude,b.latitude),Math.max(c.latitude,d.latitude)) && Math.max(Math.min(a.longitude,b.longitude),Math.min(c.longitude,d.longitude))<=Math.min(Math.max(a.longitude,b.longitude),Math.max(c.longitude,d.longitude))) return { ok: false, message: '경계선이 서로 교차하지 않게 수정해 주세요.' } as const;
	}
	const hours: Partial<Record<'day' | 'night', string>> = {};
	for (const session of ['day','night'] as const) {
		const start = String(form.get(`${session}Start`) ?? ''), end = String(form.get(`${session}End`) ?? '');
		if (!start && !end) continue;
		if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) || start === end) return { ok: false, message: '운영 시작·종료 시각을 함께 입력해 주세요.' } as const;
		hours[session] = end === '00:00' ? `${start}–24:00` : `${start}–${end < start ? '다음 날 ' : ''}${end}`;
	}
	return { ok: true, value: { name, mapLabel, label, date, latitude, longitude, boundary, revision, hours, approximate: form.get('boundaryConfirmed') !== 'on' } } as const;
}

export function saveFestivalArea(store: Store, input: Extract<ReturnType<typeof parseFestivalArea>, { ok: true }>['value'], userId: number) {
	const operation = saving.catch(() => {}).then(async () => {
		const current = await readFestivalDraft(store);
		if (current.revision !== input.revision) return { ok: false, message: '다른 관리자가 먼저 수정했습니다. 새로고침해서 최신 내용을 확인해 주세요.' } as const;
		const festival: Festival = { ...current.festival, name: input.name, mapLabel: input.mapLabel,
			area: { latitude: input.latitude, longitude: input.longitude, label: input.label, boundary: input.boundary, approximate: input.approximate },
			dates: [{ date: input.date, label: new Intl.DateTimeFormat('ko-KR', { month:'long', day:'numeric', weekday:'short', timeZone:'Asia/Seoul' }).format(new Date(`${input.date}T12:00:00+09:00`)), hours: input.hours }]
		};
		const draft: FestivalDraft = { festival, revision: current.revision + 1, updatedAt: new Date().toISOString(), updatedBy: userId };
		await store.put(key, JSON.stringify(draft));
		return { ok: true, draft } as const;
	});
	saving = operation;
	return operation;
}
