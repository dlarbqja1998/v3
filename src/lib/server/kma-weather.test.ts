import { describe, expect, it, vi } from 'vitest';
import { fetchKmaWeather, getKmaRequestTimes, parseKmaPayload } from './kma-weather';

function successPayload(items: unknown[]) {
	return {
		response: {
			header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
			body: {
				dataType: 'JSON',
				items: { item: items },
				pageNo: 1,
				numOfRows: 1000,
				totalCount: items.length
			}
		}
	};
}

const observationPayload = successPayload([
	{
		baseDate: '20260813',
		baseTime: '1300',
		category: 'T1H',
		nx: 66,
		ny: 107,
		obsrValue: '30.4'
	},
	{
		baseDate: '20260813',
		baseTime: '1300',
		category: 'PTY',
		nx: 66,
		ny: 107,
		obsrValue: '0'
	}
]);

const forecastPayload = successPayload([
	{
		baseDate: '20260813',
		baseTime: '1330',
		category: 'SKY',
		fcstDate: '20260813',
		fcstTime: '1300',
		fcstValue: '1',
		nx: 66,
		ny: 107
	},
	{
		baseDate: '20260813',
		baseTime: '1330',
		category: 'PTY',
		fcstDate: '20260813',
		fcstTime: '1300',
		fcstValue: '0',
		nx: 66,
		ny: 107
	},
	{
		baseDate: '20260813',
		baseTime: '1330',
		category: 'SKY',
		fcstDate: '20260813',
		fcstTime: '1400',
		fcstValue: '3',
		nx: 66,
		ny: 107
	},
	{
		baseDate: '20260813',
		baseTime: '1330',
		category: 'PTY',
		fcstDate: '20260813',
		fcstTime: '1400',
		fcstValue: '0',
		nx: 66,
		ny: 107
	}
]);

describe('기상청 발표 시각', () => {
	it('서울 13시 39분에는 이전 시각 실황과 예보를 선택한다', () => {
		expect(getKmaRequestTimes(new Date('2026-08-13T04:39:00.000Z'))).toEqual({
			observation: { baseDate: '20260813', baseTime: '1200', id: '202608131200' },
			forecast: { baseDate: '20260813', baseTime: '1230', id: '202608131230' }
		});
	});

	it('서울 13시 46분에는 현재 시각 실황과 예보를 선택한다', () => {
		expect(getKmaRequestTimes(new Date('2026-08-13T04:46:00.000Z'))).toEqual({
			observation: { baseDate: '20260813', baseTime: '1300', id: '202608131300' },
			forecast: { baseDate: '20260813', baseTime: '1330', id: '202608131330' }
		});
	});

	it('서울 자정 전 경계에서는 전날 날짜를 계산한다', () => {
		expect(getKmaRequestTimes(new Date('2026-08-12T15:20:00.000Z'))).toEqual({
			observation: { baseDate: '20260812', baseTime: '2300', id: '202608122300' },
			forecast: { baseDate: '20260812', baseTime: '2330', id: '202608122330' }
		});
	});
});

describe('기상청 응답 파싱', () => {
	it('실황 기온과 현재 이후 가장 가까운 예보를 합친다', () => {
		expect(
			parseKmaPayload(
				observationPayload,
				forecastPayload,
				new Date('2026-08-13T04:46:00.000Z')
			)
		).toEqual({
			temperature: 30,
			skyCode: 3,
			precipitationCode: 0,
			observedAt: '2026-08-13T13:00:00+09:00'
		});
	});

	it('현재 실황에 강수가 있으면 예보보다 우선한다', () => {
		const rainingObservation = successPayload([
			{ baseDate: '20260813', baseTime: '1300', category: 'T1H', nx: 66, ny: 107, obsrValue: '24.5' },
			{ baseDate: '20260813', baseTime: '1300', category: 'PTY', nx: 66, ny: 107, obsrValue: '1' }
		]);

		expect(
			parseKmaPayload(rainingObservation, forecastPayload, new Date('2026-08-13T04:46:00Z'))
				.precipitationCode
		).toBe(1);
	});

	it('필수 관측값이 없으면 응답을 거부한다', () => {
		expect(() =>
			parseKmaPayload(successPayload([]), forecastPayload, new Date('2026-08-13T04:46:00Z'))
		).toThrow('기상청 날씨 응답이 올바르지 않습니다.');
	});
});

describe('기상청 API 호출', () => {
	it('실황과 예보를 병렬 요청하고 공개 날씨 캐시 항목을 만든다', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				new Response(JSON.stringify(observationPayload), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify(forecastPayload), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
			);

		const result = await fetchKmaWeather(
			'test-key',
			new Date('2026-08-13T04:46:00.000Z'),
			fetcher
		);

		expect(result).toEqual({
			temperature: 30,
			status: '더움',
			icon: 'hot',
			observedAt: '2026-08-13T13:00:00+09:00',
			fetchedAt: '2026-08-13T13:46:00+09:00',
			observationBase: '202608131300',
			forecastBase: '202608131330'
		});
		expect(fetcher).toHaveBeenCalledTimes(2);
		const requestedUrls = fetcher.mock.calls.map(([input]) => new URL(String(input)));
		expect(requestedUrls.map((url) => url.pathname)).toEqual([
			'/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst',
			'/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst'
		]);
		expect(requestedUrls[0].searchParams.get('nx')).toBe('66');
		expect(requestedUrls[0].searchParams.get('ny')).toBe('107');
		expect(requestedUrls[0].searchParams.get('serviceKey')).toBe('test-key');
	});

	it('기상청 결과 코드가 정상이 아니면 안전한 오류를 반환한다', async () => {
		const errorPayload = {
			response: { header: { resultCode: '03', resultMsg: 'NO_DATA' } }
		};
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			new Response(JSON.stringify(errorPayload), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);

		await expect(
			fetchKmaWeather('test-key', new Date('2026-08-13T04:46:00Z'), fetcher)
		).rejects.toThrow('기상청 날씨 응답이 올바르지 않습니다.');
	});
});
