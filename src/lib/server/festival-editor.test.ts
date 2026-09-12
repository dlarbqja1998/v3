import { describe, it, expect } from 'vitest';
import { parseFestivalArea, readFestivalDraft, saveFestivalArea } from './festival-editor';
import { festivalPreview } from '$lib/domain/festival';

function form() {
	const result = new FormData();
	for (const [key,value] of Object.entries({ name:'동아리연합제', location:'학생회관 일대', date:'2026-09-15', latitude:String(festivalPreview.area.latitude), longitude:String(festivalPreview.area.longitude), boundary:JSON.stringify(festivalPreview.area.boundary), revision:'0' })) result.set(key,value);
	return result;
}

describe('축제 구역 저장 검증', () => {
	it('기존 구역을 보존하면서 새로 받은 공연표를 이전 저장본에도 반영한다', async () => {
		const festival = structuredClone(festivalPreview);
		festival.performances = [];
		festival.area.latitude = 36.6112;
		festival.area.approximate = false;
		const store = { get: async () => JSON.stringify({ festival, revision: 3, updatedAt: null, updatedBy: 7 }), put: async () => {} };
		const draft = await readFestivalDraft(store);
		expect(draft.festival.area).toEqual(festival.area);
		expect(draft.revision).toBe(3);
		expect(draft.festival.performances).toEqual(festivalPreview.performances);
		const reread = await readFestivalDraft({ ...store, get: async () => JSON.stringify(draft) });
		expect(reread.festival.performances).toHaveLength(9);
	});
	it('전체 운영시간이 미정이어도 구역을 저장할 수 있다', () => { expect(parseFestivalArea(form())).toMatchObject({ok:true,value:{hours:{}}}); });
	it.each(['2026-02-30','2026-13-01','날짜'])('잘못된 날짜 %s를 거부한다', date => { const input=form();input.set('date',date);expect(parseFestivalArea(input).ok).toBe(false); });
	it('경계점 부족·중복·교차·잘못된 좌표를 거부한다', () => {
		const [a,b,c,d] = festivalPreview.area.boundary;
		for (const boundary of [[a,b],[a,b,b,d],[a,c,b,d],[a,b,{latitude:0,longitude:0}],Array.from({length:101},()=>a)]) { const input=form();input.set('boundary',JSON.stringify(boundary));expect(parseFestivalArea(input).ok).toBe(false); }
	});
	it('대표 핀의 비정상 좌표와 잘못된 시간 조합을 거부한다', () => {
		const input=form();input.set('latitude','Infinity');expect(parseFestivalArea(input).ok).toBe(false);
		const partial=form();partial.set('dayStart','12:00');expect(parseFestivalArea(partial).ok).toBe(false);
	});
	it('자정을 넘는 밤 운영 종료를 다음 날로 표시한다', () => { const input=form();input.set('nightStart','18:00');input.set('nightEnd','01:00');expect(parseFestivalArea(input)).toMatchObject({ok:true,value:{hours:{night:'18:00–다음 날 01:00'}}}); });
	it('자정 종료 입력을 24:00으로 표시한다', () => { const input=form();input.set('nightStart','18:00');input.set('nightEnd','00:00');expect(parseFestivalArea(input)).toMatchObject({ok:true,value:{hours:{night:'18:00–24:00'}}}); });
	it('저장·재조회에서 구역, 부스 원자료, 수정자를 유지하고 동시 덮어쓰기를 막는다', async () => {
		const values = new Map<string,string>();
		const store = {get:async(key:string)=>values.get(key)??null,put:async(key:string,value:string)=>{values.set(key,value);}};
		const parsed=parseFestivalArea(form());if(!parsed.ok) throw new Error(parsed.message);
		const results=await Promise.all([saveFestivalArea(store,parsed.value,7),saveFestivalArea(store,parsed.value,8)]);
		expect(results.map(r=>r.ok)).toEqual([true,false]);
		const saved=await readFestivalDraft(store);
		expect(saved).toMatchObject({revision:1,updatedBy:7,festival:{area:{approximate:true}}});
		expect(saved.festival.booths).toEqual(festivalPreview.booths);
		expect(saved.festival.booths[0].sessions.night).toBeUndefined();
	});
	it('저장소 오류를 성공으로 처리하지 않는다', async()=>{
		const input=parseFestivalArea(form());if(!input.ok)throw new Error(input.message);
		await expect(saveFestivalArea({get:async()=>null,put:async()=>{throw new Error('저장 실패');}},input.value,1)).rejects.toThrow('저장 실패');
	});
});
