import 'dotenv/config';

type NaverLocalSearchItem = {
	title: string;
	link: string;
	category: string;
	description: string;
	telephone: string;
	address: string;
	roadAddress: string;
	mapx: string;
	mapy: string;
};

type NaverLocalSearchResponse = {
	total: number;
	start: number;
	display: number;
	items: NaverLocalSearchItem[];
};

const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;
const query = process.argv.slice(2).join(' ') || '고려대 세종 맛집';

if (!clientId || !clientSecret) {
	throw new Error(
		'NAVER_SEARCH_CLIENT_ID와 NAVER_SEARCH_CLIENT_SECRET을 .env에 넣어 주세요.'
	);
}

const url = new URL('https://openapi.naver.com/v1/search/local.json');
url.searchParams.set('query', query);
url.searchParams.set('display', '5');
url.searchParams.set('start', '1');
url.searchParams.set('sort', 'random');

const response = await fetch(url, {
	headers: {
		'X-Naver-Client-Id': clientId,
		'X-Naver-Client-Secret': clientSecret
	}
});

if (!response.ok) {
	const errorBody = await response.text();
	throw new Error(`네이버 지역 검색 실패: ${response.status} ${errorBody}`);
}

const data = (await response.json()) as NaverLocalSearchResponse;

const results = data.items.map((item) => ({
	name: stripHtml(item.title),
	category: item.category,
	address: item.address,
	roadAddress: item.roadAddress,
	mapx: item.mapx,
	mapy: item.mapy,
	link: item.link
}));

console.log(
	JSON.stringify(
		{
			query,
			total: data.total,
			display: data.display,
			results
		},
		null,
		2
	)
);

function stripHtml(value: string) {
	return value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
}
