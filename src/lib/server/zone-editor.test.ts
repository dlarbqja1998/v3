import { describe, expect, it } from 'vitest';
import {
	createZoneSlug,
	isZoneNameTaken,
	normalizeZoneBoundary,
	normalizeZoneName,
	parseZoneEditorInput,
	toEditableZone
} from './zone-editor';

const triangle = [
	{ latitude: 36.6, longitude: 127.2 },
	{ latitude: 36.8, longitude: 127.6 },
	{ latitude: 36.7, longitude: 127.4 }
];

describe('상권 구역 편집 입력', () => {
	it('구역 이름의 앞뒤 공백을 제거한다', () => {
		expect(normalizeZoneName('  조치원역  ')).toBe('조치원역');
	});

	it('이름이 비어 있으면 저장 입력을 거부한다', () => {
		expect(parseZoneEditorInput('   ', JSON.stringify(triangle))).toMatchObject({ ok: false });
	});

	it('DB 제한인 80자를 넘는 구역 이름은 저장 입력을 거부한다', () => {
		expect(parseZoneEditorInput('가'.repeat(81), JSON.stringify(triangle))).toMatchObject({
			ok: false
		});
	});

	it('경계가 세 점보다 적으면 저장 입력을 거부한다', () => {
		expect(parseZoneEditorInput('고대앞', JSON.stringify(triangle.slice(0, 2)))).toMatchObject({
			ok: false
		});
	});

	it('위도나 경도 범위를 벗어난 경계를 거부한다', () => {
		expect(
			normalizeZoneBoundary([
				...triangle.slice(0, 2),
				{ latitude: 91, longitude: 127.4 }
			])
		).toEqual([]);
	});

	it('유효한 이름과 경계를 저장 가능한 값으로 변환한다', () => {
		expect(parseZoneEditorInput('  홍대사이 ', JSON.stringify(triangle))).toEqual({
			ok: true,
			name: '홍대사이',
			boundary: triangle
		});
	});
});

describe('상권 구역 DB 변환', () => {
	it('DB 행의 polygon과 중심 좌표를 편집 화면 데이터로 변환한다', () => {
		expect(
			toEditableZone({
				id: '8a23ada2-d861-4789-9496-2bc34690221f',
				name: '조치원역',
				slug: 'station',
				centerLatitude: 36.7,
				centerLongitude: 127.4,
				polygon: triangle,
				displayOrder: 2,
				isVisible: true
			})
		).toEqual({
			id: '8a23ada2-d861-4789-9496-2bc34690221f',
			name: '조치원역',
			slug: 'station',
			center: { latitude: 36.7, longitude: 127.4 },
			boundary: triangle,
			displayOrder: 2,
			isVisible: true
		});
	});

	it('UUID 앞부분으로 안정적인 신규 slug를 만든다', () => {
		expect(createZoneSlug('123E4567-e89b-12d3-a456-426614174000')).toBe('zone-123e4567');
	});

	it('공백과 대소문자가 달라도 같은 이름으로 판정하되 수정 중인 자신은 제외한다', () => {
		const zones = [
			{ id: 'zone-a', name: ' Campus Town ' },
			{ id: 'zone-b', name: '조치원역' }
		];

		expect(isZoneNameTaken(zones, 'campus town')).toBe(true);
		expect(isZoneNameTaken(zones, '조치원역', 'zone-b')).toBe(false);
	});
});
