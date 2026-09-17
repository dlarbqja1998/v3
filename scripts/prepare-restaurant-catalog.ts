import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
	classifyRestaurant, isInsideRestaurantZone, normalizeRestaurantDay, normalizeRestaurantHours,
	normalizeRestaurantMenus, restaurantWeekdays,
	type RestaurantBoundary, type RestaurantWeekday, type SourceDayHours,
	type SourceRestaurantMenu
} from '../src/lib/domain/restaurant-catalog';
import type { Place } from '../src/lib/domain/places';

type RawRestaurant = {
	id: number; placeName: string; phone: string | null; roadAddressName: string;
	placeUrl: string; x: number; y: number; mainCategory: string;
	zoneId: string; zoneName: string; openingHours: Record<RestaurantWeekday,SourceDayHours>;
	regularHolidays: string[]; businessHoursNotice: string | null;
	menus: SourceRestaurantMenu[]; lastVerifiedAt: string;
	distanceInMeters: number | null; walkTimeInMinutes: number | null; pathCoordinates: unknown[];
};
type Zone = {
	id: string; slug: string; name: string; centerLatitude: number; centerLongitude: number;
	polygon: RestaurantBoundary; displayOrder: number; isVisible: boolean;
};
type BasicCheck = {
	id: number; result: string; checkedAt: string;
	candidate: null | {
		name: string; nameEqual: boolean; addressEqual: boolean; roadAddress: string;
		address: string; category: string; x: number; y: number; distanceMeters: number;
	};
};
type DetailCheck = {
	id: number; url: string; checkedAt: string; pageStatus: 'available' | 'unavailable';
	placeName?: string; roadAddressName?: string; phone?: string;
	openingHours?: Record<RestaurantWeekday,SourceDayHours>; regularHolidays?: string[];
	hoursUnavailable?: boolean; hoursValidity?: {from: string; through: string};
	deliveryHours?: unknown; closedDates?: {date: string; status:'closed'; reason:string}[];
	specialHours?: {date: string; hours: SourceDayHours; reason: string}[];
	hoursEvidence?: string[];
};
type IdentityReview = { groupId:string; places:{id:number;name:string;url:string}[]; signals:unknown[]; decision:string };
type Overrides = {
	zoneOverrides: {sourceId:number;zoneSlug:string;reason:string;basis:'user'|'provisional'}[];
	menuChecks: {sourceId:number;url:string;checkedAt:string;note:string}[];
};
type Supplements = {
	batchId: string; checkedOn: string;
	entries: {source: RawRestaurant; basicCheck: BasicCheck; detailCheck: DetailCheck;
		menuCheck: Overrides['menuChecks'][number]; sameAddressSourceIds: number[]; evidence: unknown}[];
};

const root='data/restaurant-catalog';
async function load<T>(name: string): Promise<T> { return JSON.parse(await readFile(`${root}/${name}`,'utf8')); }
const [sourceBytes,supplementBytes,zonesInput,basicInput,detailInput,identityReviews,overrides] = await Promise.all([
	readFile(`${root}/source.json`),readFile(`${root}/supplements.json`),load<{readAt:string;zones:Zone[]}>('zones.json'),
	load<{checkedAt:string;sourceHash:string;rows:BasicCheck[]}>('naver-basic-checks.json'),
	load<{checkedOn:string;observations:DetailCheck[]}>('naver-detail-checks.json'),
	load<IdentityReview[]>('identity-reviews.json'),load<Overrides>('overrides.json')
]);
const sourceHash=createHash('sha256').update(sourceBytes).digest('hex');
if (sourceHash!==basicInput.sourceHash) throw new Error('확인한 원본과 현재 원본의 해시가 다릅니다.');
const originalSource=JSON.parse(sourceBytes.toString('utf8').replace(/^\uFEFF/,'')) as RawRestaurant[];
const supplements=JSON.parse(supplementBytes.toString('utf8')) as Supplements;
const supplementHash=createHash('sha256').update(supplementBytes).digest('hex');
const source=[...originalSource,...supplements.entries.map(entry=>entry.source)];
if (new Set(source.map(x=>x.id)).size!==source.length) throw new Error('원본 장소 ID가 중복됩니다.');
for (const entry of supplements.entries) {
	if(entry.source.id!==entry.basicCheck.id||entry.source.id!==entry.detailCheck.id||entry.source.id!==entry.menuCheck.sourceId) throw new Error('추가 매장과 확인 자료의 ID가 다릅니다.');
}
const supplementById=new Map(supplements.entries.map(entry=>[entry.source.id,entry]));
const basicById=new Map([...basicInput.rows,...supplements.entries.map(entry=>entry.basicCheck)].map(x=>[x.id,x]));
const detailObservations=[...detailInput.observations,...supplements.entries.map(entry=>entry.detailCheck)];
const detailById=new Map(detailObservations.map(x=>[x.id,x]));
const menuChecks=[...overrides.menuChecks,...supplements.entries.map(entry=>entry.menuCheck)];
const zoneBySlug=new Map(zonesInput.zones.map(x=>[x.slug,x]));
const norm=(x:string)=>x.normalize('NFKC').replace(/^세종(?:특별자치시|시)?\s*/,'').replace(/\s/g,'');
// 네이버 재수집이나 상호 변경에도 평가·제휴 연결에 사용할 내부 ID가 바뀌지 않는다.
function placeId(sourceId:number) {
	const namespace=Buffer.from('6ba7b8119dad11d180b400c04fd430c8','hex');
	const bytes=createHash('sha1').update(namespace).update(`https://m.place.naver.com/restaurant/${sourceId}`).digest().subarray(0,16);
	bytes[6]=(bytes[6]&0x0f)|0x50; bytes[8]=(bytes[8]&0x3f)|0x80;
	const h=bytes.toString('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
const changes:{sourceId:number;name:string;field:string;before:unknown;after:unknown;reason:string}[]=[];
function record(raw:RawRestaurant,field:string,before:unknown,after:unknown,reason:string) {
	if(JSON.stringify(before)!==JSON.stringify(after)) changes.push({sourceId:raw.id,name:raw.placeName,field,before,after,reason});
}
const entries=source.map(raw=>{
	if(!raw.id||!raw.placeName||!Number.isFinite(raw.x)||!Number.isFinite(raw.y)||!zoneBySlug.has(raw.zoneId)) throw new Error(`음식점 기본정보를 확인해 주세요: ${raw.id}`);
	const basic=basicById.get(raw.id), detail=detailById.get(raw.id), candidate=basic?.candidate;
	const supplement=supplementById.get(raw.id);
	const issues:{code:string;message:string}[]=[];
	const add=(code:string,message:string)=>issues.push({code,message});
	const sameBusiness=candidate?.nameEqual && (candidate.addressEqual || Boolean(detail?.roadAddressName && norm(detail.roadAddressName)===norm(candidate.roadAddress)));
	const name=detail?.placeName ?? (sameBusiness?candidate!.name:raw.placeName);
	// 검색 API가 층·호수를 생략한 경우 원본의 상세 주소를 잃지 않도록 한다.
	const roadAddress=detail?.roadAddressName ?? (sameBusiness && norm(raw.roadAddressName)===norm(candidate!.roadAddress)?candidate!.roadAddress:raw.roadAddressName);
	// 반올림 차이는 유지하고, 동일 매장을 확인한 유의미한 좌표 변경만 반영한다.
	const coordinateChanged=sameBusiness&&candidate!.distanceMeters>=10;
	const latitude=coordinateChanged?candidate!.y:raw.y;
	const longitude=coordinateChanged?candidate!.x:raw.x;
	const phone=detail?.phone ?? raw.phone;
	record(raw,'name',raw.placeName,name,'현재 네이버 상호 표기');
	record(raw,'roadAddress',raw.roadAddressName,roadAddress,norm(raw.roadAddressName)===norm(roadAddress)?'주소 표기 정규화':'현재 네이버 주소');
	record(raw,'coordinates',{latitude:raw.y,longitude:raw.x},{latitude,longitude},'동일 상호·주소 또는 동일 플레이스 원문으로 식별한 현재 네이버 좌표');
	record(raw,'phone',raw.phone,phone,'현재 네이버 공개 전화번호');
	const matches=zonesInput.zones.filter(z=>isInsideRestaurantZone(latitude,longitude,z.polygon));
	let zone=matches.find(z=>z.slug===raw.zoneId) ?? (matches.length===1?matches[0]:undefined);
	let assignment:'boundary'|'user'|'provisional'|'unassigned' = zone?'boundary':'unassigned';
	const zoneOverride=overrides.zoneOverrides.find(z=>z.sourceId===raw.id);
	if(zoneOverride) {zone=zoneBySlug.get(zoneOverride.zoneSlug);assignment=zoneOverride.basis;if(!zone)throw new Error('구역 수동 지정이 유효하지 않습니다.');}
	if(!zone) add('zone_review','현재 구역 경계에 소속이 확정되지 않음');
	if(assignment==='provisional') add('zone_review','기존 구역을 임시 유지함. 경계 밖 소속 확인 필요');
	record(raw,'zoneId',raw.zoneId,zone?.slug??null,zoneOverride?.reason??'골라바유에 저장된 실제 구역 경계와 좌표 대조');
	let sourceWeekly=detail?.openingHours ?? raw.openingHours;
	if(detail?.hoursUnavailable) sourceWeekly=Object.fromEntries(restaurantWeekdays.map(d=>[d,{isClosed:false,open:null,close:null,breakTimes:[],lastOrder:null,note:'현재 네이버에서 영업시간 미공개'}])) as Record<RestaurantWeekday,SourceDayHours>;
	const notices=[...new Set([...raw.regularHolidays,...(raw.businessHoursNotice?[raw.businessHoursNotice]:[]),...(detail?.regularHolidays??[])])];
	let hours=normalizeRestaurantHours(sourceWeekly,notices);
	if(detail?.hoursValidity){hours.validFrom=detail.hoursValidity.from;hours.validThrough=detail.hoursValidity.through;}
	hours.exceptions=detail?.closedDates??[];
	for (const special of detail?.specialHours??[]) {
		const day=normalizeRestaurantDay(special.hours);
		if(day.status!=='scheduled') throw new Error(`특정일 영업시간이 유효하지 않습니다: ${raw.placeName}`);
		hours.exceptions.push({...day,status:'scheduled',date:special.date,reason:special.reason});
	}
	// 두 원문이 실제로 서로 다른 휴무를 표시하므로 어느 한쪽을 영업 상태의 정답으로 사용하지 않는다.
	if([1931680712,1039093824].includes(raw.id)) {
		hours={...hours,weekly:Object.fromEntries(restaurantWeekdays.map(d=>[d,{status:'unknown',open:null,close:null,closesNextDay:false,breakTimes:[],lastOrders:[],note:'네이버 중복 페이지 간 영업시간이 달라 확인 필요'}])) as typeof hours.weekly,holidayRules:[]};
		add('hours_conflict','청담피자 두 원문의 수요일·토요일 휴무 정보가 충돌함');
	}
	record(raw,'openingHours',normalizeRestaurantHours(raw.openingHours,[...raw.regularHolidays,...(raw.businessHoursNotice?[raw.businessHoursNotice]:[])]),hours,'네이버에서 재확인한 시간·휴무 또는 미확인 상태 반영');
	const menus=normalizeRestaurantMenus(raw.menus);
	const menuConflicts=menus.filter(m=>m.priceStatus==='conflict');
	if(menuConflicts.length) add('menu_price_conflict',`${menuConflicts.length}개 메뉴 가격이 충돌하여 확정 가격을 비움`);
	if(menus.length!==raw.menus.length) record(raw,'menuCount',raw.menus.length,menus.length,'같은 이름·분류·옵션의 메뉴를 묶고 원본 행과 가격 후보를 보존');
	const unknownDays=restaurantWeekdays.filter(d=>hours.weekly[d].status==='unknown');
	if(unknownDays.length) add('hours_unknown',`${unknownDays.length}개 요일의 기본 영업시간 미확인`);
	if(hours.holidayRules.some(r=>r.kind==='alternating_weekday'&&!r.anchorDate)) add('holiday_anchor_unknown','격주 휴무의 기준일을 확정하지 않음');
	if(!menus.length) add('menus_unknown','네이버 원본에 메뉴 정보가 없음');
	if(!phone) add('phone_unknown','전화번호 미확인');
	if(supplement?.sameAddressSourceIds.length) add('shared_address','동일 주소에 다른 상호의 네이버 페이지가 함께 있음. 서로 다른 원문 ID와 메뉴는 유지하며 실제 사업장 관계는 미확인');
	const groups=identityReviews.filter(g=>g.places.some(p=>p.id===raw.id));
	if(groups.length) add('identity_review','중복·공유매장 여부를 확인할 후보. 자동 병합하지 않음');
	if(detail?.pageStatus==='unavailable') add('source_unavailable','네이버 원문을 찾지 못함. 폐업으로 확정하지 않음');
	const classification=classifyRestaurant(raw.mainCategory,sameBusiness?candidate!.category:'');
	const id=placeId(raw.id);
	const requiresReview=issues.some(i=>['zone_review','identity_review','source_unavailable','hours_conflict'].includes(i.code));
	const categoryNames={restaurant:'음식점',cafe:'카페',bar:'술집'};
	const place:Place={id,type:classification.category==='cafe'?'cafe':'restaurant',name,
		categorySlug:classification.category,categoryName:categoryNames[classification.category],
		zoneId:zone?.slug??null,scope:'outside',latitude,longitude,locationGuide:roadAddress,
		operatingHours:null,phone,description:'',icon:classification.category==='cafe'?'cafe':'food',
		isVisible:false,displayPriority:0};
	return {
		place, cuisine:classification.cuisine,
		zone:{slug:zone?.slug??null,databaseId:zone?.id??null,name:zone?.name??null,assignment,originalSlug:raw.zoneId},
		source:{provider:'naver',placeId:String(raw.id),url:raw.placeUrl,originalCollectedAt:raw.lastVerifiedAt,
			basicCheckedAt:basic?.checkedAt??null,basicResult:basic?.result??'미확인',
			detailCheckedAt:detail?.checkedAt??null,pageStatus:detail?.pageStatus??'not_opened',
			hoursCheckedAt:detail?.openingHours||detail?.hoursUnavailable?detail.checkedAt:null,
			menusCheckedAt:menuChecks.find(m=>m.sourceId===raw.id)?.checkedAt??null,
			menuCheckNote:menuChecks.find(m=>m.sourceId===raw.id)?.note??'현재 메뉴 전체를 재검증하지 않음',
			...(supplement?{supplementBatch:supplements.batchId,evidence:supplement.evidence,sameAddressSourceIds:supplement.sameAddressSourceIds}:{}),
			registryStatus:'not_independently_verified'},
		details:{roadAddress,sourceCategory:raw.mainCategory,openingHours:hours,deliveryHours:detail?.deliveryHours??null,menus},
		studentReviews:{source:'golabau',average:null,count:null,status:'not_loaded'},
		kuMembership:{status:'unverified',partnerships:[],verifiedAt:null},
		quality:{completeness:!phone||!menus.length||unknownDays.length||menuConflicts.length?'partial':'complete',
			publicationStatus:requiresReview?'review_required':'prepared',identityReviewIds:groups.map(g=>g.groupId),issues},
		distance:{walkingMeters:null,walkingMinutes:null,walkingPath:null,
			sourceEstimate:{meters:raw.distanceInMeters,minutes:raw.walkTimeInMinutes,basis:raw.distanceInMeters===null?'거리 미확인':'구역 기준 추정치, 실제 보행 경로 아님'}}
	};
});

const counts=(values:string[])=>Object.fromEntries([...new Set(values)].map(k=>[k,values.filter(x=>x===k).length]));
const summary={
	originalInputCount:originalSource.length,supplementCount:supplements.entries.length,
	inputCount:source.length,outputCount:entries.length,sourceIdCount:new Set(entries.map(e=>e.source.placeId)).size,
	internalIdCount:new Set(entries.map(e=>e.place.id)).size,
	zones:counts(entries.map(e=>e.zone.name??'구역 미지정')),
	categories:counts(entries.map(e=>e.place.categoryName)),cuisines:counts(entries.map(e=>e.cuisine)),
	publication:counts(entries.map(e=>e.quality.publicationStatus)),completeness:counts(entries.map(e=>e.quality.completeness)),
	detailPagesChecked:detailObservations.length,
	weeklyHoursRechecked:detailObservations.filter(e=>e.openingHours&&Object.values(e.openingHours).some(day=>day.open||day.isClosed)).length,
	changes:counts(changes.map(c=>c.field)),
	menuEntriesBefore:source.reduce((n,r)=>n+r.menus.length,0),menuEntriesAfter:entries.reduce((n,r)=>n+r.details.menus.length,0),
	menuPriceConflicts:entries.reduce((n,r)=>n+r.details.menus.filter(m=>m.priceStatus==='conflict').length,0),
	kuMembershipVerified:0,studentReviewsImported:0
};
if(summary.sourceIdCount!==source.length||summary.internalIdCount!==source.length) throw new Error('음식점 원본 ID 또는 내부 ID가 유실·중복되었습니다.');
const manifest={schemaVersion:1,preparedOn:[detailInput.checkedOn,supplements.checkedOn].sort().at(-1),sourceHash,supplementHash,zoneSnapshotAt:zonesInput.readAt,
	note:'검토용 데이터. 네이버 최신 확인 범위는 각 필드에 기록하며 학생 평가·제휴는 별도 자료로 연결한다.',summary};
await Promise.all([
	writeFile(`${root}/catalog.json`,JSON.stringify({...manifest,entries},null,2)),
	writeFile(`${root}/changes.json`,JSON.stringify({sourceHash,changes},null,2)),
	writeFile(`${root}/review-queue.json`,JSON.stringify(entries.filter(e=>e.quality.issues.length).map(e=>({id:e.place.id,naverPlaceId:e.source.placeId,name:e.place.name,zone:e.zone.name,issues:e.quality.issues})),null,2)),
	writeFile(`${root}/by-zone.json`,JSON.stringify(zonesInput.zones.map(z=>({id:z.id,slug:z.slug,name:z.name,boundary:z.polygon,placeIds:entries.filter(e=>e.zone.slug===z.slug).map(e=>e.place.id)})),null,2)),
	writeFile(`${root}/manifest.json`,JSON.stringify(manifest,null,2))
]);
console.log(JSON.stringify(summary,null,2));
