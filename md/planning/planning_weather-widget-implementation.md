# 메인 날씨 위젯 구현 계획

> **에이전트 작업자용:** 이 계획을 구현할 때는 `superpowers:executing-plans`를 사용하여 작업별로 실행하고, 모든 기능 코드는 `superpowers:test-driven-development`의 실패 테스트 → 최소 구현 → 통과 확인 순서를 지킨다.

**목표:** 고려대학교 세종캠퍼스의 실제 기상청 데이터를 Cloudflare Worker와 KV로 제공하고, 메인 지도 위 호이 날씨 위젯에 비동기로 표시한다.

**아키텍처:** 클라이언트는 골라바유의 `/api/weather/current`만 호출한다. 서버는 기상청 초단기실황·초단기예보를 정규화하고 기존 `GOLABAU_CACHE` KV에 저장하며, 캐시가 오래됐을 때는 마지막 정상 데이터를 먼저 반환하고 `waitUntil`에서 갱신한다. 화면은 서버 렌더링을 기다리지 않고 `WeatherWidget.svelte`의 로딩 상태를 먼저 보여준 뒤 실제 응답으로 교체한다.

**기술 스택:** SvelteKit 2, Svelte 5, TypeScript 6, Vitest 4, Cloudflare Workers, Workers KV, 기상청 단기예보 조회서비스, Capacitor 호환 HTTPS API 경계

## 전역 제약

- 모든 사용자 문구, 테스트명, 설명과 문서는 한국어로 작성한다.
- 날씨 위치는 위도 `36.6095`, 경도 `127.2870`, 기상청 격자 `nx=66`, `ny=107`로 고정한다.
- 기상청 인증키 환경 변수 이름은 `KMA_SERVICE_KEY`로 고정하고 클라이언트에 노출하지 않는다.
- 실황은 `getUltraSrtNcst`, 예보는 `getUltraSrtFcst`를 사용한다.
- 날씨 판정 우선순위는 `눈 → 비 → 더움 → 하늘 상태`다.
- 현재 기온이 `30℃ 이상`이고 강수가 없을 때만 `더움`을 표시한다.
- KV 캐시 키는 `weather:campus:current:v1`, 오래된 데이터 허용 시간은 6시간, KV TTL은 24시간으로 한다.
- 날씨 때문에 메인 서버 렌더링과 Neon DB 연결을 추가하지 않는다.
- 자동 폴링, 날씨 Cron, GPS, 미세먼지, 상세 예보와 위젯 클릭 동작은 구현하지 않는다.
- 웹에서는 상대 API 경로를 사용하고 Capacitor 앱에서는 `PUBLIC_API_BASE_URL`로 운영 Cloudflare HTTPS 주소를 주입할 수 있어야 한다.
- 사용자가 별도로 승인하기 전에는 Git 스테이징과 커밋을 하지 않는다.

---

## 파일 구조

### 새 파일

- `src/lib/domain/weather.ts`: 공개 날씨 타입, 기상청 코드 정규화, 상태 우선순위, 호이 이미지 경로
- `src/lib/domain/weather.test.ts`: 날씨 판정과 응답 검증 단위 테스트
- `src/lib/server/kma-weather.ts`: 한국 시간 발표 시각 계산, 기상청 HTTP 호출, 원본 응답 파싱
- `src/lib/server/kma-weather.test.ts`: 분·자정 경계, 원본 응답 파싱, 외부 오류 테스트
- `src/lib/server/weather-cache.ts`: KV·메모리 캐시, stale-while-revalidate, 동시 갱신 합치기
- `src/lib/server/weather-cache.test.ts`: 신선·오래된·빈 캐시와 중복 갱신 테스트
- `src/routes/api/weather/current/+server.ts`: 골라바유 공개 날씨 API
- `src/routes/api/weather/current/current-weather-response.ts`: API 성공·실패 응답 생성 경계
- `src/routes/api/weather/current/current-weather-response.test.ts`: HTTP 상태와 캐시 헤더 테스트
- `src/lib/api/base-url.ts`: 웹·Capacitor API 주소 결합
- `src/lib/api/base-url.test.ts`: 상대 경로와 운영 HTTPS 기준 URL 테스트
- `src/lib/weather/WeatherWidget.svelte`: 로딩·정상·오래된·실패 상태 표시

### 수정 파일

- `src/app.d.ts`: `KMA_SERVICE_KEY` 플랫폼 환경 변수 타입 추가
- `src/routes/+page.svelte`: 고정 데모 제거, 위젯 상태와 클라이언트 지연 로딩 연결
- `src/lib/domain/bottom-sheet.test.ts`: 기존 고정 위치 회귀 테스트 유지
- `wrangler.jsonc`: 비밀값을 넣지 않고 환경 변수 이름은 배포 명령 또는 Cloudflare 대시보드에서 설정한다는 주석만 필요한 경우 추가
- `md/planning/planning_weather-widget.md`: 구현 중 명세 변경이 발생할 때만 사용자 승인 후 갱신

### 기존 자산

- `static/images/weather/hoi-clear.webp`
- `static/images/weather/hoi-mostly-cloudy.webp`
- `static/images/weather/hoi-cloudy.webp`
- `static/images/weather/hoi-rain.webp`
- `static/images/weather/hoi-hot.webp`
- `static/images/weather/hoi-snow.webp`

---

### 작업 1: 날씨 도메인 계약과 호이 판정

**파일:**

- 생성: `src/lib/domain/weather.test.ts`
- 생성: `src/lib/domain/weather.ts`

**인터페이스:**

- 입력: `classifyWeather({ temperature, skyCode, precipitationCode })`
- 출력: `WeatherPresentation`
- 이후 작업이 사용하는 타입: `WeatherIconKey`, `WeatherStatus`, `WeatherSnapshot`, `WeatherCacheEntry`

- [ ] **1단계: 실패 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { classifyWeather, getWeatherIconSrc, isWeatherSnapshot } from './weather';

describe('호이 날씨 판정', () => {
  it.each([
    [{ temperature: 25, skyCode: 1, precipitationCode: 0 }, ['맑음', 'clear']],
    [{ temperature: 25, skyCode: 3, precipitationCode: 0 }, ['구름많음', 'mostly-cloudy']],
    [{ temperature: 25, skyCode: 4, precipitationCode: 0 }, ['흐림', 'cloudy']],
    [{ temperature: 30, skyCode: 1, precipitationCode: 0 }, ['더움', 'hot']],
    [{ temperature: 34, skyCode: 1, precipitationCode: 1 }, ['비', 'rain']],
    [{ temperature: 2, skyCode: 4, precipitationCode: 3 }, ['눈', 'snow']],
    [{ temperature: 2, skyCode: 4, precipitationCode: 2 }, ['눈', 'snow']]
  ])('%o를 상태와 아이콘으로 정규화한다', (input, expected) => {
    const result = classifyWeather(input);
    expect([result.status, result.icon]).toEqual(expected);
  });

  it('29도는 더움으로 판정하지 않는다', () => {
    expect(classifyWeather({ temperature: 29, skyCode: 1, precipitationCode: 0 }).icon)
      .toBe('clear');
  });

  it('아이콘 키를 프로젝트 이미지 경로로 변환한다', () => {
    expect(getWeatherIconSrc('mostly-cloudy'))
      .toBe('/images/weather/hoi-mostly-cloudy.webp');
  });

  it('필수 필드가 빠진 공개 응답을 거부한다', () => {
    expect(isWeatherSnapshot({ temperature: 28, status: '맑음' })).toBe(false);
  });
});
```

- [ ] **2단계: 실패 확인**

실행: `npm test -- src/lib/domain/weather.test.ts`

예상: `weather.ts`가 없거나 내보낸 함수가 없어 실패한다.

- [ ] **3단계: 최소 구현 작성**

```ts
export type WeatherIconKey =
  | 'clear'
  | 'mostly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'hot'
  | 'snow';

export type WeatherStatus = '맑음' | '구름많음' | '흐림' | '비' | '더움' | '눈';

export type WeatherPresentation = {
  status: WeatherStatus;
  icon: WeatherIconKey;
};

export type WeatherSnapshot = WeatherPresentation & {
  temperature: number;
  observedAt: string;
  fetchedAt: string;
  stale: boolean;
};

export type WeatherCacheEntry = Omit<WeatherSnapshot, 'stale'> & {
  observationBase: string;
  forecastBase: string;
};

const ICON_PATHS: Record<WeatherIconKey, string> = {
  clear: '/images/weather/hoi-clear.webp',
  'mostly-cloudy': '/images/weather/hoi-mostly-cloudy.webp',
  cloudy: '/images/weather/hoi-cloudy.webp',
  rain: '/images/weather/hoi-rain.webp',
  hot: '/images/weather/hoi-hot.webp',
  snow: '/images/weather/hoi-snow.webp'
};

export function classifyWeather(input: {
  temperature: number;
  skyCode: number;
  precipitationCode: number;
}): WeatherPresentation {
  if ([2, 3, 6, 7].includes(input.precipitationCode)) return { status: '눈', icon: 'snow' };
  if ([1, 4, 5].includes(input.precipitationCode)) return { status: '비', icon: 'rain' };
  if (input.temperature >= 30) return { status: '더움', icon: 'hot' };
  if (input.skyCode === 3) return { status: '구름많음', icon: 'mostly-cloudy' };
  if (input.skyCode === 4) return { status: '흐림', icon: 'cloudy' };
  return { status: '맑음', icon: 'clear' };
}
```

`getWeatherIconSrc`는 `ICON_PATHS`를 반환하고, `isWeatherSnapshot`은 객체 여부, 정수 기온, 허용된 상태·아이콘, ISO 문자열, 불리언 `stale`을 검증한다.

- [ ] **4단계: 통과 확인**

실행: `npm test -- src/lib/domain/weather.test.ts`

예상: 테스트 파일 1개와 모든 케이스가 통과한다.

- [ ] **5단계: 커밋 승인 게이트**

변경 내용을 기록하되 스테이징하지 않는다.

```txt
추가 : 날씨 타입과 호이 아이콘 판정
```

---

### 작업 2: 기상청 발표 시각과 응답 파서

**파일:**

- 생성: `src/lib/server/kma-weather.test.ts`
- 생성: `src/lib/server/kma-weather.ts`

**인터페이스:**

- 생성: `getKmaRequestTimes(now: Date): KmaRequestTimes`
- 생성: `parseKmaPayload(observationPayload, forecastPayload, now): ParsedKmaWeather`
- 생성: `fetchKmaWeather(serviceKey: string, now?: Date, fetcher?: typeof fetch): Promise<KmaWeatherResult>`
- 소비: 작업 1의 `classifyWeather`, `WeatherCacheEntry`

- [ ] **1단계: 발표 시각 실패 테스트 작성**

```ts
describe('기상청 발표 시각', () => {
  it('서울 13시 39분에는 이전 시간 실황과 예보를 선택한다', () => {
    expect(getKmaRequestTimes(new Date('2026-08-13T04:39:00.000Z'))).toEqual({
      observation: { baseDate: '20260813', baseTime: '1200', id: '202608131200' },
      forecast: { baseDate: '20260813', baseTime: '1230', id: '202608131230' }
    });
  });

  it('서울 13시 46분에는 현재 시간 실황과 예보를 선택한다', () => {
    expect(getKmaRequestTimes(new Date('2026-08-13T04:46:00.000Z'))).toEqual({
      observation: { baseDate: '20260813', baseTime: '1300', id: '202608131300' },
      forecast: { baseDate: '20260813', baseTime: '1330', id: '202608131330' }
    });
  });

  it('서울 자정 전 경계에서 전날 날짜를 계산한다', () => {
    expect(getKmaRequestTimes(new Date('2026-08-12T15:20:00.000Z'))).toEqual({
      observation: { baseDate: '20260812', baseTime: '2300', id: '202608122300' },
      forecast: { baseDate: '20260812', baseTime: '2330', id: '202608122330' }
    });
  });
});
```

- [ ] **2단계: 파서와 외부 오류 실패 테스트 작성**

고정 fixture는 실제 응답 구조 전체를 포함한다.

```ts
const successPayload = (items: unknown[]) => ({
  response: {
    header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
    body: { dataType: 'JSON', items: { item: items }, pageNo: 1, numOfRows: 1000, totalCount: items.length }
  }
});

it('실황 기온과 가장 가까운 예보의 하늘·강수를 합친다', () => {
  const observation = successPayload([
    { baseDate: '20260813', baseTime: '1300', category: 'T1H', nx: 66, ny: 107, obsrValue: '30.4' },
    { baseDate: '20260813', baseTime: '1300', category: 'PTY', nx: 66, ny: 107, obsrValue: '0' }
  ]);
  const forecast = successPayload([
    { baseDate: '20260813', baseTime: '1330', category: 'SKY', fcstDate: '20260813', fcstTime: '1400', fcstValue: '3', nx: 66, ny: 107 },
    { baseDate: '20260813', baseTime: '1330', category: 'PTY', fcstDate: '20260813', fcstTime: '1400', fcstValue: '0', nx: 66, ny: 107 }
  ]);

  expect(parseKmaPayload(observation, forecast, new Date('2026-08-13T04:46:00Z')))
    .toMatchObject({ temperature: 30, skyCode: 3, precipitationCode: 0, observedAt: '2026-08-13T13:00:00+09:00' });
});

it('기상청 결과 코드가 정상이 아니면 거부한다', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    response: { header: { resultCode: '03', resultMsg: 'NO_DATA' } }
  }), { status: 200, headers: { 'content-type': 'application/json' } }));

  await expect(fetchKmaWeather('test-key', new Date('2026-08-13T04:46:00Z'), fetcher))
    .rejects.toThrow('기상청 날씨 응답이 올바르지 않습니다.');
});
```

- [ ] **3단계: 실패 확인**

실행: `npm test -- src/lib/server/kma-weather.test.ts`

예상: 모듈 또는 함수가 없어 실패한다.

- [ ] **4단계: 발표 시각과 파서 최소 구현**

`Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', ... })`의 `formatToParts`로 한국 날짜·시·분을 만든다. 분이 40 미만이면 실황 기준 시각에서 1시간을 빼고, 분이 45 미만이면 예보 기준 시각에서 1시간을 뺀다. 날짜가 바뀌는 계산은 `Date` 밀리초 감산 후 다시 한국 시간으로 포맷한다.

파서는 다음 규칙을 그대로 구현한다.

```ts
const temperature = Math.round(Number(findObservation('T1H').obsrValue));
const observedPrecipitation = Number(findObservation('PTY').obsrValue);
const nearestForecastTime = findNearestForecastTimeAtOrAfterNow(forecastItems, now);
const skyCode = Number(findForecast(nearestForecastTime, 'SKY').fcstValue);
const forecastPrecipitation = Number(findForecast(nearestForecastTime, 'PTY').fcstValue);
const precipitationCode = observedPrecipitation !== 0
  ? observedPrecipitation
  : forecastPrecipitation;
```

필수 항목이 없거나 숫자가 유한하지 않으면 `기상청 날씨 응답이 올바르지 않습니다.`를 던진다.

- [ ] **5단계: 기상청 HTTP 호출 최소 구현**

두 URL은 다음 공통 파라미터를 사용한다.

```txt
serviceKey=<KMA_SERVICE_KEY 원문>
pageNo=1
numOfRows=1000
dataType=JSON
nx=66
ny=107
base_date=<계산된 날짜>
base_time=<계산된 시각>
```

외부 호출은 5초 `AbortController` 타임아웃을 사용한다. 두 요청은 `Promise.all`로 병렬 실행하고 HTTP 비정상 상태, JSON 파싱 실패, 기상청 결과 코드 비정상을 모두 안전한 서버 오류로 변환한다. 반환값은 다음 계약을 지킨다.

```ts
export type KmaWeatherResult = WeatherCacheEntry;
```

`fetchedAt`은 실제 가져온 시각, `observationBase`와 `forecastBase`는 `getKmaRequestTimes`의 `id`를 기록한다.

- [ ] **6단계: 통과 확인**

실행: `npm test -- src/lib/server/kma-weather.test.ts src/lib/domain/weather.test.ts`

예상: 두 테스트 파일이 모두 통과한다.

- [ ] **7단계: 커밋 승인 게이트**

```txt
추가 : 기상청 발표 시각 계산과 초단기 날씨 파서
```

---

### 작업 3: KV·메모리 캐시와 동시 갱신 합치기

**파일:**

- 생성: `src/lib/server/weather-cache.test.ts`
- 생성: `src/lib/server/weather-cache.ts`

**인터페이스:**

- 생성: `createWeatherCacheService()`와 기본 인스턴스의 `getCurrentWeather(platform, options): Promise<WeatherSnapshot>`
- 옵션: `{ now?: Date; serviceKey: string; fetchWeather?: typeof fetchKmaWeather }`
- 소비: 작업 2의 `getKmaRequestTimes`, `fetchKmaWeather`

- [ ] **1단계: 캐시 실패 테스트 작성**

실제 동작을 관찰하는 메모리 KV fake를 테스트 파일 안에 둔다.

```ts
function createKv(initial?: WeatherCacheEntry) {
  let value = initial ? JSON.stringify(initial) : null;
  return {
    get: vi.fn(async () => value),
    put: vi.fn(async (_key: string, next: string) => { value = next; })
  };
}

it('두 발표 시각이 일치하는 신선 캐시는 외부 호출 없이 반환한다', async () => {
  const kv = createKv(freshEntry);
  const fetchWeather = vi.fn();
  const result = await getCurrentWeather({ env: { GOLABAU_CACHE: kv } }, {
    now: new Date('2026-08-13T04:46:00Z'), serviceKey: 'key', fetchWeather
  });
  expect(result.stale).toBe(false);
  expect(fetchWeather).not.toHaveBeenCalled();
});

it('6시간 이내 이전 캐시는 즉시 반환하고 waitUntil에서 한 번 갱신한다', async () => {
  const kv = createKv(staleEntryWithinSixHours);
  const tasks: Promise<unknown>[] = [];
  const fetchWeather = vi.fn().mockResolvedValue(freshEntry);
  const result = await getCurrentWeather({
    env: { GOLABAU_CACHE: kv }, context: { waitUntil: (task) => tasks.push(task) }
  }, { now, serviceKey: 'key', fetchWeather });
  expect(result.stale).toBe(true);
  expect(tasks).toHaveLength(1);
  await tasks[0];
  expect(fetchWeather).toHaveBeenCalledTimes(1);
});

it('캐시가 없으면 첫 요청에서 동기 갱신한다', async () => {
  const kv = createKv();
  const fetchWeather = vi.fn().mockResolvedValue(freshEntry);
  const result = await getCurrentWeather({ env: { GOLABAU_CACHE: kv } }, {
    now, serviceKey: 'key', fetchWeather
  });
  expect(result.stale).toBe(false);
  expect(kv.put).toHaveBeenCalledWith(
    'weather:campus:current:v1', expect.any(String), { expirationTtl: 86400 }
  );
});

it('동시에 들어온 빈 캐시 요청은 외부 갱신 Promise를 공유한다', async () => {
  const kv = createKv();
  const fetchWeather = vi.fn().mockResolvedValue(freshEntry);
  await Promise.all([
    getCurrentWeather({ env: { GOLABAU_CACHE: kv } }, { now, serviceKey: 'key', fetchWeather }),
    getCurrentWeather({ env: { GOLABAU_CACHE: kv } }, { now, serviceKey: 'key', fetchWeather })
  ]);
  expect(fetchWeather).toHaveBeenCalledTimes(1);
});

it('6시간을 넘긴 캐시와 외부 장애가 겹치면 실패한다', async () => {
  const kv = createKv(staleEntryOlderThanSixHours);
  const fetchWeather = vi.fn().mockRejectedValue(new Error('외부 장애'));
  await expect(getCurrentWeather({ env: { GOLABAU_CACHE: kv } }, {
    now, serviceKey: 'key', fetchWeather
  })).rejects.toThrow('외부 장애');
});
```

- [ ] **2단계: 실패 확인**

실행: `npm test -- src/lib/server/weather-cache.test.ts`

예상: `getCurrentWeather`가 없어 실패한다.

- [ ] **3단계: 최소 캐시 구현**

```ts
export const WEATHER_CACHE_KEY = 'weather:campus:current:v1';
const WEATHER_CACHE_TTL_SECONDS = 60 * 60 * 24;
const WEATHER_STALE_LIMIT_MS = 6 * 60 * 60 * 1000;

export function createWeatherCacheService() {
  let inMemoryWeather: WeatherCacheEntry | null = null;
  let refreshPromise: Promise<WeatherCacheEntry> | null = null;
  // 아래 getCurrentWeather 구현을 반환한다.
}
```

KV JSON 읽기 실패는 로그를 남기고 캐시 없음으로 취급한다. 신선 판정은 `observationBase`와 `forecastBase`가 현재 두 요청 ID와 모두 일치할 때만 참이다. 6시간 판정은 `fetchedAt`과 주입된 `now`의 차이로 계산한다.

갱신은 반드시 `try/finally`에서 `refreshPromise = null`로 정리한다. KV 쓰기 실패는 가져온 정상 데이터를 사용자에게 반환하되 로그를 남긴다. 서비스키가 비어 있고 신선·허용 가능한 이전 캐시도 없으면 `기상청 API 인증키가 없습니다.`를 던진다.

- [ ] **4단계: 통과 확인**

실행: `npm test -- src/lib/server/weather-cache.test.ts src/lib/server/kma-weather.test.ts src/lib/domain/weather.test.ts`

예상: 캐시, 기상청, 도메인 테스트가 모두 통과한다.

- [ ] **5단계: 커밋 승인 게이트**

```txt
추가 : 날씨 KV 캐시와 오래된 데이터 우선 반환
```

---

### 작업 4: 공개 날씨 API와 환경 타입

**파일:**

- 생성: `src/routes/api/weather/current/current-weather-response.test.ts`
- 생성: `src/routes/api/weather/current/current-weather-response.ts`
- 생성: `src/routes/api/weather/current/+server.ts`
- 수정: `src/app.d.ts`

**인터페이스:**

- 생성: `createCurrentWeatherResponse(loader): Promise<Response>`
- 라우트 `GET`: `createCurrentWeatherResponse(() => getCurrentWeather(...))` 호출
- 정상 응답: `200`, JSON `WeatherSnapshot`
- 실패 응답: `503`, JSON `{ error: 'weather_unavailable', message: '날씨 정보를 불러오지 못했습니다.' }`

- [ ] **1단계: HTTP 경계 실패 테스트 작성**

```ts
it('정상 날씨를 공개 캐시 헤더와 함께 반환한다', async () => {
  const response = await createCurrentWeatherResponse(async () => snapshot);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control'))
    .toBe('public, max-age=300, s-maxage=600, stale-while-revalidate=3600');
  expect(await response.json()).toEqual(snapshot);
});

it('내부 오류 내용을 숨기고 503을 반환한다', async () => {
  const response = await createCurrentWeatherResponse(async () => {
    throw new Error('service key=secret');
  });
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error: 'weather_unavailable',
    message: '날씨 정보를 불러오지 못했습니다.'
  });
});
```

- [ ] **2단계: 실패 확인**

실행: `npm test -- src/routes/api/weather/current/current-weather-response.test.ts`

예상: 응답 생성 모듈이 없어 실패한다.

- [ ] **3단계: 응답 생성과 라우트 구현**

`current-weather-response.ts`는 `json` 응답만 책임지고, `+server.ts`는 Cloudflare 런타임 비밀값을 `platform.env`에서 읽어 다음처럼 서버 의존성을 주입한다. `$env/dynamic/private`는 사용하지 않아 Worker 런타임 바인딩과 로컬 빌드 환경을 혼동하지 않는다.

```ts
import { getCurrentWeather } from '$lib/server/weather-cache';
import { createCurrentWeatherResponse } from './current-weather-response';

export function GET({ platform }) {
  return createCurrentWeatherResponse(() => getCurrentWeather(platform, {
    serviceKey: platform?.env?.KMA_SERVICE_KEY ?? ''
  }));
}
```

`src/app.d.ts`의 `App.Platform.env`에 다음 필드를 추가한다.

```ts
KMA_SERVICE_KEY?: string;
```

로그에는 경로와 오류 종류만 기록하고 서비스키가 포함된 URL이나 전체 외부 응답을 기록하지 않는다.

- [ ] **4단계: 통과 확인**

실행: `npm test -- src/routes/api/weather/current/current-weather-response.test.ts src/lib/server/weather-cache.test.ts`

예상: HTTP 경계와 캐시 테스트가 통과한다.

- [ ] **5단계: 커밋 승인 게이트**

```txt
추가 : 세종캠퍼스 현재 날씨 공개 API
```

---

### 작업 5: 웹·Capacitor API 주소 경계

**파일:**

- 생성: `src/lib/api/base-url.test.ts`
- 생성: `src/lib/api/base-url.ts`

**인터페이스:**

- 생성: `resolveApiUrl(path: string, publicApiBaseUrl: string): string`
- 웹 입력: `('/api/weather/current', '')`
- Capacitor 입력: `('/api/weather/current', 'https://api.golabau.kr')`

- [ ] **1단계: 실패 테스트 작성**

```ts
describe('API 주소', () => {
  it('웹에서는 같은 출처 상대 경로를 유지한다', () => {
    expect(resolveApiUrl('/api/weather/current', '')).toBe('/api/weather/current');
  });

  it('Capacitor에서는 운영 HTTPS 기준 URL과 결합한다', () => {
    expect(resolveApiUrl('/api/weather/current', 'https://api.golabau.kr/'))
      .toBe('https://api.golabau.kr/api/weather/current');
  });

  it('HTTPS가 아닌 외부 기준 URL은 거부한다', () => {
    expect(() => resolveApiUrl('/api/weather/current', 'http://api.golabau.kr'))
      .toThrow('운영 API 주소는 HTTPS여야 합니다.');
  });
});
```

- [ ] **2단계: 실패 확인**

실행: `npm test -- src/lib/api/base-url.test.ts`

예상: `resolveApiUrl`이 없어 실패한다.

- [ ] **3단계: 최소 구현 작성**

빈 기준 URL이면 경로를 그대로 반환한다. 값이 있으면 URL 프로토콜이 `https:`인지 확인하고, 기준 URL의 마지막 슬래시와 경로의 첫 슬래시를 정규화하여 결합한다. 임의의 사용자 입력을 받지 않으며 빌드 환경 변수에만 사용한다.

- [ ] **4단계: 통과 확인**

실행: `npm test -- src/lib/api/base-url.test.ts`

예상: 세 테스트가 통과한다.

- [ ] **5단계: 커밋 승인 게이트**

```txt
추가 : 웹과 Capacitor 공용 API 주소 해석
```

---

### 작업 6: 날씨 위젯 컴포넌트와 메인 지연 로딩

**파일:**

- 생성: `src/lib/weather/WeatherWidget.svelte`
- 수정: `src/routes/+page.svelte`
- 유지: `src/lib/domain/bottom-sheet.test.ts`

**인터페이스:**

- `WeatherWidget` props:

```ts
{
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: boolean;
  bottom: number;
}
```

- [ ] **1단계: 메인 로딩 상태와 요청 함수 작성 전 도메인 테스트 재실행**

실행: `npm test -- src/lib/domain/weather.test.ts src/lib/api/base-url.test.ts`

예상: UI가 소비할 공개 계약이 통과한다.

- [ ] **2단계: `WeatherWidget.svelte` 구현**

컴포넌트는 현재 위젯의 위치와 흰색 스타일을 그대로 옮긴다.

```svelte
<script lang="ts">
  import { getWeatherIconSrc, type WeatherSnapshot } from '$lib/domain/weather';

  let { weather, loading, error, bottom }: {
    weather: WeatherSnapshot | null;
    loading: boolean;
    error: boolean;
    bottom: number;
  } = $props();

  const statusText = $derived(weather?.status ?? (loading ? '확인 중' : '확인 불가'));
  const temperatureText = $derived(weather ? `${weather.temperature}°` : '--°');
</script>
```

표시 규칙은 다음과 같다.

- 정상: 호이 이미지, 실제 기온, 상태
- 오래된 데이터: 정상 표시를 유지하고 `aria-label`에 `이전 관측 정보` 추가
- 로딩: 이미지 없이 `--° / 확인 중`
- 실패: 이미지 없이 `--° / 확인 불가`
- 이미지 `onerror`: 이미지 요소만 숨기고 텍스트 유지
- `role="status"`, `aria-live="polite"` 사용
- 클릭 동작과 포인터 이벤트 없음

- [ ] **3단계: `+page.svelte`에서 고정 데모 제거와 비동기 요청 연결**

제거:

```ts
const DEMO_WEATHER = { temperature: 28, status: '맑음', ... };
```

추가:

```ts
import { env as publicEnv } from '$env/dynamic/public';
import { resolveApiUrl } from '$lib/api/base-url';
import { isWeatherSnapshot, type WeatherSnapshot } from '$lib/domain/weather';
import WeatherWidget from '$lib/weather/WeatherWidget.svelte';

let weather = $state<WeatherSnapshot | null>(null);
let weatherLoading = $state(true);
let weatherError = $state(false);

async function loadWeather(signal: AbortSignal) {
  weatherLoading = true;
  weatherError = false;
  try {
    const url = resolveApiUrl('/api/weather/current', publicEnv.PUBLIC_API_BASE_URL ?? '');
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('weather request failed');
    const payload: unknown = await response.json();
    if (!isWeatherSnapshot(payload)) throw new Error('invalid weather payload');
    weather = payload;
  } catch (error) {
    if (signal.aborted) return;
    weatherError = true;
  } finally {
    if (!signal.aborted) weatherLoading = false;
  }
}
```

기존 `onMount` 안에서 `AbortController`를 한 번 만들고 `void loadWeather(controller.signal)`을 호출한다. 기존 cleanup에서 `controller.abort()`를 추가한다. 폴링과 재시도는 추가하지 않는다.

현재 인라인 위젯 마크업은 다음 호출로 교체한다.

```svelte
<WeatherWidget
  {weather}
  loading={weatherLoading}
  error={weatherError}
  bottom={weatherWidgetBottom}
/>
```

- [ ] **4단계: 정적 검사와 관련 테스트**

실행:

```powershell
npm test -- src/lib/domain/weather.test.ts src/lib/api/base-url.test.ts src/lib/domain/bottom-sheet.test.ts
npm run check
```

예상: 관련 테스트가 모두 통과하고 Svelte 오류·경고가 0개다.

- [ ] **5단계: 모바일 화면 수동 검증**

390×844 화면에서 다음을 확인한다.

1. 로딩 중 `--° / 확인 중` 표시
2. fixture 또는 실제 개발키 응답 후 호이와 기온·상태 표시
3. 바텀시트 최소·중간·최대 단계에서 위젯 `x`, `y` 좌표 동일
4. 학식·셔틀·건물 시트 전환 후 좌표 동일
5. 실패 응답에서 `--° / 확인 불가` 표시
6. 브라우저 콘솔 오류 없음

- [ ] **6단계: 커밋 승인 게이트**

```txt
추가 : 실제 날씨를 표시하는 호이 위젯
수정 : 메인 날씨 고정 시안을 비동기 API 데이터로 전환
```

---

### 작업 7: 전체 회귀 검증과 배포 준비 확인

**파일:**

- 검증: 이번 계획에서 생성·수정한 모든 파일
- 수정: 검증 실패의 원인이 이번 기능일 때 해당 파일만 테스트 우선으로 수정

- [ ] **1단계: 전체 테스트 실행**

실행: `npm test`

예상: 모든 테스트 파일이 통과하고 실패 0개다.

- [ ] **2단계: Svelte·TypeScript 검사 실행**

실행: `npm run check`

예상: 오류 0개, 경고 0개다.

- [ ] **3단계: Cloudflare 프로덕션 빌드 실행**

실행: `npm run build`

예상: Cloudflare 어댑터까지 종료 코드 0으로 완료된다. 개발 서버의 `workerd`가 `.svelte-kit/cloudflare`를 점유하여 `EBUSY`가 발생하면 실행 중인 이 작업 폴더의 개발 서버만 확인 후 종료하고 동일 명령을 다시 실행한다.

- [ ] **4단계: 외부 API 안전성 확인**

다음 항목을 확인한다.

- 빌드 산출물과 클라이언트 코드에 `KMA_SERVICE_KEY` 값이 없음
- 날씨 응답에 기상청 원본 URL과 인증키가 없음
- `KMA_SERVICE_KEY`가 없을 때 `/api/weather/current`가 503 안전 응답을 반환
- Cloudflare 운영 환경에는 사용자가 직접 `KMA_SERVICE_KEY` 비밀값을 등록해야 함
- Capacitor 배포 시 `PUBLIC_API_BASE_URL`에 운영 Cloudflare HTTPS 주소를 설정해야 함

- [ ] **5단계: Git 변경 범위 확인**

실행:

```powershell
git -c safe.directory=C:/v3 diff --check
git -c safe.directory=C:/v3 status --short
```

사용자의 기존 미추적 문서와 파일은 건드리지 않는다.

- [ ] **6단계: 최종 커밋 허락 요청**

모든 검증이 통과한 뒤에만 다음 형식으로 허락을 요청한다.

```txt
추가 : 기상청 기반 호이 날씨 위젯과 캐시 API
수정 : 메인 날씨 시안을 실제 세종캠퍼스 날씨로 전환
```

사용자가 명시적으로 승인하기 전에는 스테이징과 커밋을 수행하지 않는다.
