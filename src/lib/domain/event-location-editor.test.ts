import { describe, expect, it } from 'vitest';
import { parseEventLocationInput } from './event-location-editor';
import type { CampusSpot } from './campus-spots';

function input(values: Record<string, string> = {}) {
	const form = new FormData();
	for (const [key, value] of Object.entries({ locationName: '미래관 사거리 앞', positionChosen: 'true', latitude: '36.6102923', longitude: '127.2861632', location: '{"type":"pin"}', ...values })) form.set(key, value);
	return form;
}

describe('행사 위치만 저장하는 입력 검증', () => {
	it('명시적으로 찍은 핀을 범위로 바꾸지 않는다', () => {
		expect(parseEventLocationInput(input())).toMatchObject({ ok: true, value: { locationName: '미래관 사거리 앞', latitude: 36.6102923, longitude: 127.2861632, location: { type: 'pin' } } });
	});
	it('지도 기본 중심과 빈 좌표를 저장하지 않는다', () => {
		expect(parseEventLocationInput(input({ positionChosen: 'false' })).ok).toBe(false);
		expect(parseEventLocationInput(input({ latitude: '' })).ok).toBe(false);
		expect(parseEventLocationInput(input({ longitude: 'Infinity' })).ok).toBe(false);
		expect(parseEventLocationInput(input({ latitude: '91' })).ok).toBe(false);
	});
	it('선택한 범위의 중심을 사용하고 전달된 핀 좌표는 사용하지 않는다', () => {
		const boundary = [{ latitude: 36, longitude: 127 }, { latitude: 36, longitude: 128 }, { latitude: 37, longitude: 128 }];
		expect(parseEventLocationInput(input({ location: JSON.stringify({ type: 'area', boundary }) }))).toMatchObject({ ok: true, value: { latitude: 36.5, longitude: 127.5, location: { type: 'area', boundary } } });
	});
	it('선이 교차하는 범위를 거부한다', () => {
		const boundary = [{ latitude: 36, longitude: 127 }, { latitude: 37, longitude: 128 }, { latitude: 36, longitude: 128 }, { latitude: 37, longitude: 127 }];
		expect(parseEventLocationInput(input({ location: JSON.stringify({ type: 'area', boundary }) })).ok).toBe(false);
	});
	it('서버에 있는 건물 중심만 사용한다', () => {
		const spot = { id: 'building-test', type: 'building', center: { latitude: 36.6, longitude: 127.2 } } as CampusSpot;
		const form = input({ location: JSON.stringify({ type: 'building', buildingIds: [spot.id] }) });
		expect(parseEventLocationInput(form).ok).toBe(false);
		expect(parseEventLocationInput(form, [spot])).toMatchObject({ ok: true, value: { latitude: 36.6, longitude: 127.2 } });
	});
});
