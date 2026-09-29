import { festivalPreview, type Festival } from '$lib/domain/festival';

const date = '2026-09-29';
const official = 'https://everytime.kr/370457/v/418827296';
const spc = 'https://everytime.kr/367439/v/418806963';
const gusia = 'https://everytime.kr/370457/v/418862052';
const english = 'https://everytime.kr/370457/v/418827796';
const digitalManagement = 'https://everytime.kr/370457/v/418823603';
const chinese = 'https://everytime.kr/370457/v/418866411';

/** 확인한 사실을 화면용으로 정리한 로컬 초안. 원문·확인 기록은 .local/event-inbox에 보관한다. */
export const gbFestivalPreview: Festival = {
	id: 'gb-the-match-2026',
	name: 'GB: The Match',
	mapLabel: 'GB: The Match',
	preview: true,
	dates: [{ date, label: '9월 29일 (화)', hours: { day: '12:00–17:00', night: '18:00–23:00' } }],
	// 9월 29일 사용자가 POLARIS와 같은 위치라고 확인한 대표 핀.
	area: { label: '학생회관 주차장', latitude: festivalPreview.area.latitude, longitude: festivalPreview.area.longitude, boundary: [], approximate: false },
	sourceUrl: official,
	checkedAt: '2026-09-29T13:47:07+09:00',
	notice: '확인된 부스와 공연부터 안내해요. 개별 부스의 운영시간은 전체 축제 시간과 다를 수 있어요.',
	booths: [
		{
			id: 'gb-spc', name: '자유전공학부', clubName: '자유전공학부 SPC', number: '', order: 1, date,
			subtitle: '게임과 인스타팅 · 밤에는 헬스장 주점', location: '학생회관 앞 주차장', sourceUrl: spc,
			sessions: {
				day: { hours: '12:00–17:00', notice: '게임별 참가비와 자세한 참여 조건은 현장에서 확인해 주세요.', items: [
					{ name: '경마장 게임', description: '게임 속 말들의 도착 순위를 예측해요.', price: null, priceLabel: '참가비 미확인' },
					{ name: '물병 위치 맞추기', description: '스태프의 힌트로 섞인 물병 위치를 맞히면 쿠폰을 받을 수 있어요.', price: null, priceLabel: '참가비 미확인' },
					{ name: '초 맞추기 인스타팅', description: '같은 시간대에 초를 맞춘 사람끼리 매칭해요.', price: null, priceLabel: '참가비 미확인' }
				] },
				night: { hours: '18:00–23:00', notice: '헬스장 콘셉트의 주점이에요. 메뉴판에 가격이 없어 현장 확인이 필요해요.', items: [
					{ name: 'A세트', description: '야간 치팅 삼겹살 + 유산소 불닭볶음면', price: null, priceLabel: '가격 미확인', section: '세트 메뉴' },
					{ name: 'B세트', description: '유산소 불닭볶음면 + 멘탈 회복용 콘치즈', price: null, priceLabel: '가격 미확인', section: '세트 메뉴' },
					{ name: '야간 치팅 삼겹살', price: null, priceLabel: '가격 미확인', section: '단품 메뉴' },
					{ name: '유산소 불닭볶음면', description: '기본 · 까르보', price: null, priceLabel: '가격 미확인', section: '단품 메뉴' },
					{ name: '멘탈 회복용 콘치즈', price: null, priceLabel: '가격 미확인', section: '단품 메뉴' }
				] }
			}
		},
		{
			id: 'gb-gusia', name: '구시아', clubName: '구시아 서포터즈', number: '', order: 2, date,
			subtitle: '게임·설문 참여 간식 이벤트', location: '축제장 내 · 상세 위치 확인 중', sourceUrl: gusia,
			sessions: {
				day: { hours: '11:00부터 · 종료 시각 미확인', notice: '개별 부스 공지 기준으로 11:00부터 운영해요.', items: [
					{ name: '가격 맞추기 · 라벨 매칭 · 탑 쌓기', description: '게임에 참여하면 간식을 제공해요.', price: null, priceLabel: '간식 제공', section: '참여 이벤트' },
					{ name: 'QR 설문', description: '부스의 QR 설문에 참여하면 간식을 제공해요.', price: null, priceLabel: '간식 제공', section: '참여 이벤트' }
				] },
				night: { hours: '19:00부터 · 21:00 현장 추첨', notice: '구시아 서포터즈와 구시아 계정 팔로우 인증 후 응모권을 받아요. 종료 시각은 확인 중이에요.', items: [
					{ name: '현장 경품 응모', description: '1등 10만 원권, 2등 6만 원권, 3등 간식 세트 80명으로 안내되어 있어요.', price: null, priceLabel: '팔로우 인증', section: '참여 이벤트' }
				] }
			}
		},
		{
			id: 'gb-english', name: '영미학전공', clubName: '제10대 영미학전공 학생회', number: '', order: 3, date,
			subtitle: '파칭코 · 리듬 게임 · 악력 측정', sourceUrl: english,
			location: '학생회관 주차장 · 관람존 아래 왼쪽 첫 부스(공식 배치도 기준)',
			locationSourceUrl: official,
			sessions: {
				day: { hours: '12:00–17:00', notice: '게임에 성공하면 영미학전공 밤 부스에서 사용할 수 있는 음료 쿠폰을 드려요. 게임별 참가비는 확인 중이에요.', items: [
					{ name: '파칭코', price: null, priceLabel: '참가비 미확인' },
					{ name: '리듬 게임', price: null, priceLabel: '참가비 미확인' },
					{ name: '악력 측정', price: null, priceLabel: '참가비 미확인' }
				] },
				night: { hours: '18:00–23:00', notice: '낮 부스 게임에 성공해서 받은 음료 쿠폰을 사용할 수 있어요. 적용 음료와 자세한 조건은 현장에서 확인해 주세요.', items: [
					{ name: '자메이카 통다리 치킨', description: '한정 수량으로 안내된 메뉴예요.', price: 6000, section: '메인 메뉴' },
					{ name: '칠리스', price: 4000, section: '메인 메뉴' },
					{ name: '감자튀김 · 기본', price: 4000, section: '감자튀김' },
					{ name: '감자튀김 · 버터갈릭', price: 5000, section: '감자튀김' },
					{ name: '감자튀김 · 뿌링클', price: 5000, section: '감자튀김' },
					{ name: '오렌지 · 콜라', price: 2000, section: '영크크 음료' },
					{ name: '보리차', price: 4000, section: '늙크크 음료' },
					{ name: '오렌지', price: 4000, section: '늙크크 음료' },
					{ name: '아이스티', price: 5000, section: '늙크크 음료' }
				] }
			}
		},
		{
			id: 'gb-digital-management', name: '디지털경영전공', clubName: '제10대 디지털경영전공 학생회', number: '', order: 4, date,
			subtitle: '씨니스카이 · 선수 카드 만들기와 피씨방 메뉴', sourceUrl: digitalManagement,
			location: '학생회관 주차장 · 관람존 아래 왼쪽 두 번째 부스(공식 배치도 기준)',
			locationSourceUrl: official,
			sessions: {
				day: { hours: '12:00–17:00', notice: '게임 4종으로 능력치를 측정해 나만의 선수 카드를 만들어요. 참가비는 확인 중이에요.', items: [
					{ name: '복싱 탭볼', description: '지구력(PHY)을 측정해요.', price: null, priceLabel: '참가비 미확인', section: '선수 카드 만들기' },
					{ name: '제기차기', description: '드리블(DRI) 능력치를 측정해요.', price: null, priceLabel: '참가비 미확인', section: '선수 카드 만들기' },
					{ name: '반응속도 테스트', description: '속도(PAC)를 측정해요.', price: null, priceLabel: '참가비 미확인', section: '선수 카드 만들기' },
					{ name: '축구공 컬링', description: '슈팅(SHO) 능력치를 측정해요.', price: null, priceLabel: '참가비 미확인', section: '선수 카드 만들기' }
				] },
				night: { hours: '18:00–23:00', notice: '능력치 카드 할인은 티어 상승제에 한해 1,000원 적용돼요. 자세한 사용 조건은 현장에서 확인해 주세요.', items: [
					{ name: '소시지', price: 2500 },
					{ name: '티어 상승제', description: '능력치 카드로 1,000원 할인받을 수 있어요.', price: 4000 },
					{ name: '너구리', price: 4000 },
					{ name: '짜파게티', price: 4000 },
					{ name: '짜파구리', description: '2인분', price: 8000 },
					{ name: '새우볶음밥', price: 7000 },
					{ name: '아이스티', price: 2000 }
				] }
			}
		},
		{
			id: 'gb-chinese', name: '중국학전공', clubName: '제10대 중국학전공 학생회 이치(一起)', number: '', order: 5, date,
			subtitle: '차이나 오락실 · 탁구공 게임과 마라볶음우동', sourceUrl: chinese,
			location: '학생회관 앞 주차장',
			sessions: {
				day: { hours: '12:00–17:00', items: [
					{ name: '탁구공 랜덤 추첨', description: '번호가 적힌 탁구공 30개에서 5개를 뽑아요. 학생회 번호와 순서까지 같으면 1등 배민 상품권 5만 원, 번호만 같으면 2등 3만 원을 받아요.', price: 2000 },
					{ name: '탁구공 옮기기', description: '3초 동안 위치를 기억한 뒤 15초 안에 젓가락으로 계란판의 같은 자리에 탁구공을 옮겨요. 성공하면 간식을 받아요.', price: 500 },
					{ name: '탁구공 컬링', description: '젓가락으로 탁구공을 밀어 3회 점수를 합산해요. 최종 1등은 밤 부스 과자 세트, 2등은 초록매실 1병, 3등은 빽다방 아이스 아메리카노를 받아요.', price: 1000 }
				] },
				night: { hours: '18:00–23:00', items: [
					{ name: '마라볶음우동', price: 4000, section: '단품 메뉴' },
					{ name: '만두', price: 2500, section: '단품 메뉴' },
					{ name: '사이다 · 콜라', price: 2000, section: '단품 메뉴' },
					{ name: '세트 1', description: '마라맛 감자칩 + 김 감자칩 + 초록매실', price: 6000, section: '세트 메뉴' },
					{ name: '세트 2', description: '마라맛 감자칩 + 김 감자칩 + 보리주스', price: 4000, section: '세트 메뉴' }
				] }
			}
		}
	],
	performances: [
		{ id: 'gb-sorimadang', date, session: 'night', time: '18:10–18:40', startsAt: `${date}T18:10:00+09:00`, endsAt: `${date}T18:40:00+09:00`, name: '소리마당', kind: '팝 밴드', location: '학생회관 앞 무대', sourceUrl: 'https://everytime.kr/370457/v/418812363' },
		{ id: 'gb-bbp', date, session: 'night', time: '20:10–20:40', startsAt: `${date}T20:10:00+09:00`, endsAt: `${date}T20:40:00+09:00`, name: 'BBP', kind: '밴드', location: '학생회관 주차장', sourceUrl: 'https://everytime.kr/367439/v/418821334' },
		{ id: 'gb-unmute', date, session: 'night', time: '20:50', startsAt: `${date}T20:50:00+09:00`, name: 'Un_MUTE', kind: '댄스', location: '학생회관 주차장', notice: '과학기술대학 댄스 소모임', sourceUrl: 'https://everytime.kr/370457/v/418849326' },
		{ id: 'gb-udf', date, session: 'night', time: '21:30', startsAt: `${date}T21:30:00+09:00`, name: 'UDF', kind: '댄스', location: '학생회관 앞 무대', notice: '약 30분 공연', sourceUrl: 'https://everytime.kr/370457/v/418825364' }
	],
	benefits: [
		{ id: 'gb-digital-management-card', date, sessions: ['day', 'night'], title: '능력치 카드로 티어 상승제 1,000원 할인', description: '씨니스카이 낮 부스에서 만든 능력치 카드로 밤 부스의 티어 상승제를 1,000원 할인받을 수 있어요.', notice: '티어 상승제에 한해 적용하며, 자세한 사용 조건은 현장에서 확인해 주세요.', sourceUrl: digitalManagement },
		{ id: 'gb-english-coupon', date, sessions: ['day', 'night'], title: '영미학 게임 성공하면 음료 쿠폰', description: '낮 부스 게임에 성공하면 영미학전공 밤 부스에서 쓸 수 있는 음료 쿠폰을 받아요.', notice: '쿠폰 적용 음료와 상세 사용 조건은 현장에서 확인해 주세요.', sourceUrl: english },
		{ id: 'gb-stamp', date, sessions: ['day'], title: '스탬프 모으고 경품 응모', description: '스탬프판을 모두 채워 응모하면 헤드폰·이어폰·스피커·텀블러 등의 경품에 도전할 수 있어요.', notice: '스탬프판 수령처·응모 자격·제출 마감은 학생회에 확인해 주세요.', sourceUrl: 'https://everytime.kr/370457/v/418827232' },
		{ id: 'gb-staff', date, sessions: ['day'], title: '스태프를 이겨라', description: '학생회 스태프와 게임에 참여하면 패션후르츠즙과 스탬프 스티커를 제공해요.', sourceUrl: official },
		{ id: 'gb-gusia-raffle', date, sessions: ['night'], title: '구시아 현장 경품 추첨', timeLabel: '21:00 추첨', description: '19:00부터 서포터즈를 찾아 팔로우 인증 후 응모권을 받아요.', notice: '자세한 응모 마감과 수령 조건은 현장에서 확인해 주세요.', sourceUrl: gusia }
	]
};
