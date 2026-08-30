import type { CampusEventCategory } from '../src/lib/domain/campus-events';

export const CAMPUS_EVENT_SEED_IDS = {
	ongoingEvent: '00000000-0000-4000-8000-000000000001',
	upcomingEvent: '00000000-0000-4000-8000-000000000002',
	ongoingImage: '10000000-0000-4000-8000-000000000001',
	upcomingImage: '10000000-0000-4000-8000-000000000002'
} as const;

export function createCampusEventSeed(now = new Date()) {
	return [
		{
			id: CAMPUS_EVENT_SEED_IDS.ongoingEvent,
			title: '골라바유 테스트 · 진행 중',
			category: '축제' as CampusEventCategory,
			organizer: '골라바유 운영팀',
			description: '행사 목록, 상세, 지도 핀과 바텀시트 연결을 확인하기 위한 진행 중 테스트 행사입니다.',
			startsAt: new Date(now.getTime() - 60 * 60 * 1000),
			endsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
			locationName: '중앙광장',
			latitude: 36.61018,
			longitude: 127.28719,
			isVisible: true,
			image: {
				id: CAMPUS_EVENT_SEED_IDS.ongoingImage,
				objectKey: `events/${CAMPUS_EVENT_SEED_IDS.ongoingEvent}/${CAMPUS_EVENT_SEED_IDS.ongoingImage}.png`,
				contentType: 'image/png',
				byteSize: 756143,
				displayOrder: 0,
				isCover: true
			}
		},
		{
			id: CAMPUS_EVENT_SEED_IDS.upcomingEvent,
			title: '골라바유 테스트 · 진행 예정',
			category: '강연' as CampusEventCategory,
			organizer: '골라바유 운영팀',
			description: '7일 이내 예정 행사 노출과 자동 탭, 지도 이동을 확인하기 위한 테스트 행사입니다.',
			startsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
			endsAt: new Date(now.getTime() + (2 * 24 + 3) * 60 * 60 * 1000),
			locationName: '농심국제관 앞',
			latitude: 36.60934,
			longitude: 127.28972,
			isVisible: true,
			image: {
				id: CAMPUS_EVENT_SEED_IDS.upcomingImage,
				objectKey: `events/${CAMPUS_EVENT_SEED_IDS.upcomingEvent}/${CAMPUS_EVENT_SEED_IDS.upcomingImage}.png`,
				contentType: 'image/png',
				byteSize: 756143,
				displayOrder: 0,
				isCover: true
			}
		}
	];
}
