import type { FestivalBooth } from './festival';

/** 2026-09-15 사용자가 모아 준 홍보글 본문·첨부에서 확인한 내용. */
export const festivalBoothDetails: Record<string, Partial<FestivalBooth>> = {
	'day-booth-10': {
		sourceUrl: 'https://everytime.kr/370457/v/418144276', subtitle: 'STARWEAR · 패션 체험과 플리마켓',
		sessions: { day: { hours: '12:00–17:30', items: [
			{ name: '패션팅', description: '친구들과 패션 밸런스 게임과 취향 테스트를 즐겨보세요.', price: null, section: '패션 체험' },
			{ name: '패션왕', description: '오늘의 스타일을 뽐내고 패션왕에 도전해보세요.', price: null, section: '패션 체험' },
			{ name: '잼스톤 커스텀 체험', description: '잼스톤을 활용한 커스텀을 체험해보세요.', price: null, section: '패션 체험' },
			{ name: '플리마켓', description: '부원들의 애장품과 다양한 의류를 판매해요.', price: null, priceLabel: '상품별 가격 안내 예정', section: '플리마켓' }
		] } }
	},
	'night-booth-4': {
		sourceUrl: 'https://everytime.kr/370457/v/418144276',
		sessions: { night: { hours: '18:00–24:00', notice: '테이블 기본 이용시간은 1시간 30분이에요. 메뉴를 추가하면 30분 연장돼요.', items: [
			{ name: '닭꼬치', price: 5000 }, { name: '오뎅탕', price: 5000 },
			{ name: '제육볶음', price: 8000 }, { name: '수박화채', price: 7000 }, { name: '탄산음료', price: 2000 }
		] } }
	},
	'day-booth-1': {
		sourceUrl: 'https://everytime.kr/370457/v/418140053', subtitle: '인스타팅과 음료',
		sessions: { day: { hours: '12:00–17:00', items: [
			{ name: '인스타팅', description: '새로운 사람이나 음악 취향이 맞는 사람을 만나보세요.', price: 1000, section: '체험' },
			{ name: '레전드음료', description: '부스에서 준비한 음료를 판매해요. 종류는 현장에서 확인해 주세요.', price: 3000, section: '음료' }
		] } }
	},
	'day-booth-8': {
		sourceUrl: 'https://everytime.kr/370457/v/418130679', subtitle: '페이스 페인팅 · 캐리커처 · 굿즈',
		sessions: { day: { hours: '12:00–17:30', items: [
			{ name: '페이스 페인팅', description: '미술 동아리 부원이 직접 그려드려요.', price: null, section: '그림 체험' },
			{ name: '캐리커처', description: '부원이 그려주는 캐리커처로 축제의 추억을 남겨보세요.', price: null, section: '그림 체험' },
			{ name: '타투 스티커', description: '부원들이 직접 그린 디자인을 판매해요.', price: null, section: '굿즈' },
			{ name: '아크릴 키링', description: '부원들의 그림으로 만든 키링을 판매해요.', price: null, section: '굿즈' }
		] } }
	},
	'day-booth-4': {
		sourceUrl: 'https://everytime.kr/370457/v/418118315', subtitle: '악기 체험과 직접 만든 굿즈', location: '학생회관 앞',
		sessions: { day: { hours: '12:00–17:30', items: [
			{ name: '드럼 박자 맞추기', description: '정해진 박자를 보고 직접 드럼을 쳐보세요.', price: null, section: '악기 체험' },
			{ name: '16비트 챌린지', description: '정확한 박자 맞추기에 도전해보세요.', price: null, section: '악기 체험' },
			{ name: '기타·베이스·드럼 체험', description: '현 부원이 알려주는 미니 레슨과 함께 악기를 연주해보세요.', price: null, section: '악기 체험' },
			{ name: '키캡 키링 만들기', description: '직접 키캡 키링을 만들어보세요.', price: 3000, section: '만들기·굿즈' },
			{ name: '피크 목걸이', price: 3000, section: '만들기·굿즈' },
			{ name: '피크 키링', price: 2000, section: '만들기·굿즈' },
			{ name: '수제 무말랑이', description: '부원이 직접 제작했어요. 총 25개 한정 판매로, 남은 수량은 현장에서 확인해 주세요.', price: 3000, section: '만들기·굿즈' }
		] } }
	},
	'day-booth-2': {
		sourceUrl: 'https://everytime.kr/370457/v/418101915', subtitle: '연극 만들기 체험과 사진',
		sessions: { day: { hours: '12:00–17:30', notice: '체험비는 1,000원이며, 섬 인스타그램을 태그하거나 팔로우하면 무료예요.', items: [
			{ name: '연극 만들기 체험', description: '도전 1분과 티켓 만들기로 연극 제작 과정을 만나보세요.', price: 1000, section: '체험 안내' },
			{ name: '도전 1분', description: '1분 안에 데시벨 맞추기(배우), 7초 맞추기(오퍼), 못 3개 박기(무대) 미션에 도전해보세요.', price: null, priceLabel: '체험비에 포함', section: '체험 프로그램' },
			{ name: '공연 티켓 만들기', description: '시간제한 없이 나만의 공연 티켓을 만들어보세요.', price: null, priceLabel: '체험비에 포함', section: '체험 프로그램' },
			{ name: '섬 프레임 사진', description: '체험 후 무료로 촬영할 수 있어요. 사진은 인쇄 대신 QR로 전달돼요.', price: 0, priceLabel: '체험 참여 시 무료', section: '체험 프로그램' }
		] } }
	},
	'night-booth-9': {
		sourceUrl: 'https://everytime.kr/370457/v/418101915',
		sessions: { night: { hours: '18:00–24:00', notice: '토핑 추가는 무료예요. 소스는 렌치·칠리·바베큐, 시즈닝은 소금·후추·파슬리·치즈가루 중에서 골라보세요.', items: [
			{ name: '고기구이 · 컵', description: '목살 또는 삼겹살을 고르고 소스를 더해보세요.', price: 5900 },
			{ name: '고기구이 · 그릇', description: '목살 또는 삼겹살을 선택할 수 있어요.', price: 9900 },
			{ name: '감자상자 · 컵', description: '웨지컷·기본 감자튀김·해쉬브라운을 고르고 베이컨 비츠·슈레드 치즈를 더해보세요.', price: 4900 },
			{ name: '감자상자 · 그릇', description: '웨지컷·기본 감자튀김·해쉬브라운과 토핑을 선택할 수 있어요.', price: 8900 },
			{ name: '아이스크림 · 컵', description: '미쯔·시리얼·델로스 토핑을 선택할 수 있어요.', price: 3900 }
		] } }
	},
	'day-booth-5': {
		sourceUrl: 'https://everytime.kr/370457/v/418108034', subtitle: '무료 악기 체험과 음악 퀴즈', location: '학생회관 앞',
		sessions: { day: { hours: '12:00–17:30', notice: '모든 프로그램은 무료예요. 성공하면 간식과 올해 말 정기연주회 추가 경품 추첨권을 드려요.', items: [
			{ name: '악기 체험', description: '트럼펫·플루트 등 악기의 소리를 내면 성공이에요.', price: 0 },
			{ name: '악기 이름·사진 매칭', description: '제한시간 안에 뒤집힌 사진을 열어 악기 이름과 사진을 모두 맞춰보세요.', price: 0 },
			{ name: '영화 음악 맞추기', description: '음악을 듣고 영화 제목을 맞춰보세요.', price: 0 }
		] } }
	},
	'day-booth-3': {
		sourceUrl: 'https://everytime.kr/370457/v/418104964', subtitle: '시원한 수박 화채와 룰렛', location: '학생회관 앞 주차장',
		sessions: { day: { hours: '12:00–17:30', items: [
			{ name: '수박 화채', description: '현장에서 즉석으로 만들어 판매해요. 스탬프도 받아가세요.', price: 3000, section: '먹거리' },
			{ name: '룰렛 게임', description: '성공하면 간단한 간식 선물을 드려요.', price: null, section: '체험' }
		] } }
	},
	'day-booth-13': {
		sourceUrl: 'https://everytime.kr/370457/v/418102320', subtitle: '더포 풍선 다트와 경품', location: '학생회관 앞',
		sessions: { day: { hours: '12:00–17:30', notice: 'CCC 소개와 더포 이야기를 듣고 도장도 받아가세요.', items: [
			{ name: '더포 풍선 다트 게임', description: '풍선 뒤에 숨겨진 4가지 심볼을 맞혀보세요. 1개는 4등, 2개는 3등(간식), 3개는 2등(빽다방 5,000원권), 4개는 1등이에요. 1등 경품은 부스에서 공개해요.', price: 1000 }
		] } }
	}
};
