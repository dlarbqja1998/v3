import type { Festival, FestivalItem } from '$lib/domain/festival';
import { getPublicCampusEvents } from '$lib/domain/campus-events';
import type { CampusEventDto } from './campus-events';

export const autumnCheckedAt = '2026-10-06T14:13:20+09:00';
export const jansasaCandidateId = '67c5d5db-ba3e-4c7b-ae4c-aadf18effa3f';
export const ecoUpCandidateId = '30ac5cc8-7f19-44a0-bd14-faebf7cfe19a';
const date = '2026-10-06';
const official = 'https://everytime.kr/370457/v/419240092';
const summary = 'https://everytime.kr/370457/v/419211903';
const activity = 'https://everytime.kr/370457/v/419162930';
const live = 'https://everytime.kr/370457/v/419211774';
const lounge = 'https://everytime.kr/370457/v/419162328';
const letter = 'https://everytime.kr/370457/v/419162317';
const item = (name: string, description?: string, priceLabel = '요금 확인 중'): FestivalItem => ({ name, description, price: null, priceLabel });

/** 요청한 공지의 확인된 사실만 사용한다. 좌표는 기존 잔디광장·중앙광장 지점과 대조했다. */
export const jansasaFestivalPreview: Festival = {
	id: 'jansasa-2026', name: '잔사사 : 잔디와 사랑하는 사람들', mapLabel: '잔사사', preview: true,
	eventId: jansasaCandidateId,
	// 낮·밤은 프로그램을 찾는 분류이며 개별 운영 시간은 각 행에 안내한다.
	dates: [{ date, label: '10월 6일 (화)', hours: { day: '12:00–18:00', night: '19:00–24:00' } }],
	hoursLabel: '전체 12:00–24:00 · 프로그램별 운영 시간은 아래에서 확인해 주세요.',
	sessionLabels: { day: '낮 · 체험', night: '밤 · 공연' }, performanceLabel: '공연·상영',
	area: { label: '잔디광장', latitude: 36.609984850000004, longitude: 127.28850095, boundary: [], approximate: false },
	sourceUrl: official, checkedAt: autumnCheckedAt, posterUrl: '/dev/autumn-posters/jansasa',
	notice: '푸드트럭의 개별 운영 시간과 메뉴 가격은 현장에서 확인해 주세요. 배달 음식은 지정 배달존에서 수령하고, 분리배출과 지정 흡연 구역을 이용해 주세요.',
	booths: [
		...[
			['온더라디오', '음료'], ['오레오앤츄', '오레오츄러스'], ['꼬찟', '닭강정'],
			['타코아지트', '타코야끼'], ['미식유랑단', '팟타이 · 스테이크']
		].map(([name, menu], index) => ({
			id: `jansasa-food-${index + 1}`, name, subtitle: menu, number: String(index + 1), order: index + 1, date,
			location: '학술정보원 옆 푸드존 · 공식 배치도 기준', sourceUrl: summary, locationSourceUrl: summary,
			sessions: {
				day: { hours: '운영 시간 확인 중', notice: '푸드트럭마다 운영 시간과 가격이 다를 수 있어요.', items: [item(menu)] },
				night: { hours: '운영 시간 확인 중', notice: '야간 운영 여부와 마감 시간은 현장에서 확인해 주세요.', items: [item(menu)] }
			}
		})),
		{ id: 'jansasa-portrait-tarot', name: '캐리커처 · 스피드 타로', subtitle: '나만의 키링과 짧은 타로 상담', number: '', order: 6, date,
			location: '학생회관 옆 잔디밭 액티비티존', sourceUrl: activity,
			sessions: { day: { hours: '13:00–17:00', notice: '계좌 입금 후 입금자 명단을 작성하고 참가 접수를 해 주세요.', items: [
				{ name: '키링 캐리커처', price: 2000 }, { name: '스피드 타로', price: 2000 }
			] } } },
		{ id: 'jansasa-boardgame', name: '보드게임 대여', subtitle: '학생증 확인 · 최대 2시간', number: '', order: 7, date,
			location: '학생회관 옆 잔디밭 액티비티존', sourceUrl: activity,
			sessions: { day: { hours: '12:00–17:00', items: [item('보드게임 대여', '학생증 확인 후 대여 명단을 작성해요. 1인당 1개, 최대 2시간 대여할 수 있어요.', '학생증 확인')] } } },
		{ id: 'jansasa-mat', name: '돗자리 대여', subtitle: '학생증 확인 · 최대 3시간', number: '', order: 8, date,
			location: '학생회관 옆 잔디밭 액티비티존', sourceUrl: activity,
			sessions: {
				day: { hours: '12:00–24:00', items: [item('돗자리 대여', '1인당 1개, 최대 3시간. 훼손·분실 시 10,000원이 부과돼요.', '학생증 확인')] },
				night: { hours: '12:00–24:00', items: [item('돗자리 대여', '1인당 1개, 최대 3시간. 훼손·분실 시 10,000원이 부과돼요.', '학생증 확인')] }
			} },
		{ id: 'jansasa-photo', name: '온라인 인생네컷', subtitle: '잔사사 프레임으로 사진 남기기', number: '', order: 9, date,
			location: '학생회관 옆 잔디밭 액티비티존', sourceUrl: activity,
			sessions: {
				day: { hours: '12:00–24:00', items: [item('온라인 인생네컷', '사진 촬영 → 사진·프레임 선택 → QR코드로 다운로드')] },
				night: { hours: '12:00–24:00', items: [item('온라인 인생네컷', '사진 촬영 → 사진·프레임 선택 → QR코드로 다운로드')] }
			} },
		{ id: 'jansasa-polaroid', name: '폴라로이드 촬영', subtitle: '한 팀당 한 장 · 현장에서 전달', number: '', order: 10, date,
			location: '잔디밭 일대', sourceUrl: lounge,
			sessions: { day: { hours: '12:00–18:00', items: [item('폴라로이드 촬영', '폴라로이드 카메라를 든 총학생회 운영진에게 촬영을 요청해 주세요.', '한 팀당 한 장')] } } },
		{ id: 'jansasa-letter', name: '사랑의 우체통', subtitle: '사연을 남기고 푸드트럭 쿠폰 받기', number: '', order: 11, date,
			location: '잔디광장', sourceUrl: letter,
			sessions: { day: { hours: '12:00–17:00', items: [item('사연 작성과 투함', '비치된 편지지에 사연을 쓰고 운영진에게 전달하거나 우체통에 넣어 주세요. 일부 사연은 야간 라이브존에서 소개돼요.', '3,000원권 쿠폰')] } } },
		{ id: 'jansasa-mission', name: '미션카드', subtitle: '가을밤 함께하는 미션', number: '', order: 12, date,
			location: '잔디밭 일대', sourceUrl: lounge,
			sessions: { night: { hours: '19:00–23:00', items: [item('미션카드 참여', '운영진에게 미션카드와 한정 스티커를 받고 상대와 함께 미션을 수행해 보세요.', '미션 참여')] } } }
	],
	performances: [
		{ id: 'jansasa-larva', date, session: 'day', name: '라바', kind: '애니메이션 상영', time: '12:00–18:00', startsAt: `${date}T12:00:00+09:00`, endsAt: `${date}T18:00:00+09:00`, location: '잔디광장 · 학생회관 1층 계단 쪽 데크', sourceUrl: live },
		{ id: 'jansasa-busking', date, session: 'night', name: '가을밤 버스킹', kind: '공연', time: '19:00–20:40', startsAt: `${date}T19:00:00+09:00`, endsAt: `${date}T20:40:00+09:00`, location: '학생회관 1층 계단 쪽 데크', notice: '사랑의 우체통 사연도 감성 라디오로 함께 소개해요.', sourceUrl: live },
		{ id: 'jansasa-airplane', date, session: 'night', name: '영상놀 「비행기」', kind: '영화 상영', time: '20:40–21:00', startsAt: `${date}T20:40:00+09:00`, endsAt: `${date}T21:00:00+09:00`, location: '학생회관 1층 계단 쪽 데크', sourceUrl: live },
		{ id: 'jansasa-intern', date, session: 'night', name: '인턴', kind: '영화 상영', time: '21:00–23:00', startsAt: `${date}T21:00:00+09:00`, endsAt: `${date}T23:00:00+09:00`, location: '학생회관 1층 계단 쪽 데크', notice: '번역학회 CELL과 함께해요.', sourceUrl: live }
	],
	benefits: [
		{ id: 'jansasa-letter-coupon', date, sessions: ['day'], title: '사랑의 우체통 · 푸드트럭 3,000원권', timeLabel: '12:00–17:00', description: '사연 작성과 투함이 확인된 참여자에게 쿠폰을 제공해요.', sourceUrl: letter },
		{ id: 'jansasa-mission-coupon', date, sessions: ['night'], title: '미션카드 · 신기루포차 할인 쿠폰', timeLabel: '교환 19:00–23:30', description: '미션 성공 후 카드 제출·이름·학번 기입 시 5,000원 할인 쿠폰(1인 1회). 카드를 들고 이성과 함께 방문하면 10,000원 할인 쿠폰을 제공해요.', notice: '교환 장소는 푸드트럭 방면 운영본부이며, 쿠폰 소진 시 조기 마감될 수 있어요.', sourceUrl: lounge }
	]
};

const ecoLabFesta: CampusEventDto = {
	id: ecoUpCandidateId, title: '에코업 연구 페스타 · Eco Lab Festa', category: '박람회',
	organizer: '고려대학교 세종에코업혁신융합대학사업단',
	description: '에코업 그린 아카데미 위크의 10월 7일 프로그램입니다.\n\n연구 페스타 · 10:00–17:00\n중앙광장 에코업부스에서 대학원 1:1 진학 상담과 연구실 소개, 선배·전문가 상담을 진행해요.\n\n함께 열리는 프로그램\n• Eco-Up Quest · 10:00–17:00, 중앙광장 에코업부스\n• 프로필 사진 촬영 · 10:00–17:00, 과학기술1관 코워킹스페이스(현장 예약)\n• Eco Lab Tour · 10:00–12:00 / 14:00–16:00, 과학기술1관 512\n\n참가자 기념품과 커피·츄러스 푸드트럭이 안내되어 있어요. 세부 일정과 운영 내용은 변경될 수 있어요.',
	startsAt: new Date('2026-10-07T10:00:00+09:00'), endsAt: new Date('2026-10-07T17:00:00+09:00'),
	locationName: '중앙광장 에코업부스', latitude: 36.60991945, longitude: 127.28561264999999,
	location: { type: 'pin' }, externalUrl: 'https://everytime.kr/367439/v/419007131', isVisible: true,
	createdBy: null, createdAt: new Date(autumnCheckedAt), updatedAt: new Date(autumnCheckedAt), coverImageId: 'eco-up-local-poster',
	images: [{ id: 'eco-up-local-poster', eventId: ecoUpCandidateId, objectKey: '', contentType: 'image/jpeg', byteSize: 213744,
		isCover: true, kind: 'cover', displayOrder: 0, createdAt: new Date(autumnCheckedAt), url: '/dev/autumn-posters/eco-up' }]
};

/** 호출부가 로컬 개발 주소를 확인한 뒤, 이번에 요청한 행사만 미리 보여준다. DB 공개 상태는 바꾸지 않는다. */
export function readAutumnEventPreviews(now: Date): CampusEventDto[] {
	if (now < new Date(autumnCheckedAt)) return [];
	return getPublicCampusEvents([structuredClone(ecoLabFesta)], now);
}
