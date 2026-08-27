import { describe, expect, it } from 'vitest';
import { findContainingZoneId } from '$lib/domain/facility-zone';
import { parseFacilityPinInput } from './facility-pin';

function formData(values: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(values)) data.set(key, value);
	return data;
}

const requiredCampusValues = {
	name: ' 학생회관 GS25 ',
	scope: 'campus',
	categorySlug: 'convenience-store',
	latitude: '36.6097',
	longitude: '127.2912',
	locationGuide: ' 학생회관 1층 ',
	description: ' 간단한 설명 ',
	operatingHours: '',
	phone: ' 044-123-4567 ',
	displayPriority: '2',
	isVisible: 'on'
};

describe('시설 핀 입력', () => {
	it('교내 시설 입력을 정규화한다', () => {
		expect(parseFacilityPinInput(formData(requiredCampusValues))).toEqual({
			ok: true,
			value: {
				id: undefined,
				name: '학생회관 GS25',
				scope: 'campus',
				categorySlug: 'convenience-store',
				zoneId: null,
				latitude: 36.6097,
				longitude: 127.2912,
				locationGuide: '학생회관 1층',
				description: '간단한 설명',
				operatingHours: null,
				phone: '044-123-4567',
				displayPriority: 2,
				isVisible: true
			}
		});
	});

	it('화면 조작용 아이콘 이름을 카테고리로 받지 않는다', () => {
		expect(
			parseFacilityPinInput(
				formData({ ...requiredCampusValues, categorySlug: 'home' })
			)
		).toEqual({ ok: false, message: '시설 카테고리를 선택해 주세요.' });
	});

	it('좌표가 숫자가 아니면 거부한다', () => {
		expect(
			parseFacilityPinInput(formData({ ...requiredCampusValues, latitude: 'NaN' }))
		).toEqual({ ok: false, message: '지도에서 핀 위치를 지정해 주세요.' });
	});

	it('좌표 입력이 비어 있으면 0으로 변환하지 않고 거부한다', () => {
		expect(
			parseFacilityPinInput(formData({ ...requiredCampusValues, latitude: '', longitude: '' }))
		).toEqual({ ok: false, message: '지도에서 핀 위치를 지정해 주세요.' });
	});

	it('교외 시설은 상권 구역을 요구한다', () => {
		expect(
			parseFacilityPinInput(
				formData({ ...requiredCampusValues, scope: 'outside', zoneId: '' })
			)
		).toEqual({ ok: false, message: '교외 시설이 속한 상권 구역을 선택해 주세요.' });
	});
});

describe('교외 핀 상권 자동 판정', () => {
	const zones = [
		{
			id: 'zone-a',
			boundary: [
				{ latitude: 0, longitude: 0 },
				{ latitude: 0, longitude: 2 },
				{ latitude: 2, longitude: 2 },
				{ latitude: 2, longitude: 0 }
			]
		}
	];

	it('다각형 안의 좌표에 해당하는 구역을 반환한다', () => {
		expect(findContainingZoneId({ latitude: 1, longitude: 1 }, zones)).toBe('zone-a');
	});

	it('다각형 밖의 좌표에는 구역을 자동 지정하지 않는다', () => {
		expect(findContainingZoneId({ latitude: 5, longitude: 5 }, zones)).toBeNull();
	});
});
