import { and, eq, desc } from 'drizzle-orm';
import { createDb } from './db';
import { createAsyncDataCache } from '$lib/cache/async-data-cache';
import { places, placeCategories, zones, restaurantProfiles, placeMemberships } from './db/schema';
import type { Place } from '$lib/domain/places';
import type { OutsideCuisine } from '$lib/domain/outside-place-filters';
import type { RestaurantMenu, RestaurantOpeningHours } from '$lib/domain/restaurant-catalog';
import { koreanDate, membershipIsActive, restaurantTodayHours, type KuMembership, type RestaurantDetail, type RestaurantSummary } from '$lib/domain/restaurants';

export type RestaurantReadMode = 'public' | 'preview';

export async function readKuMemberships(databaseUrl: string, placeId?: string, mode: RestaurantReadMode = 'public'): Promise<Record<string,KuMembership>> {
	const rows = await createDb(databaseUrl).select().from(placeMemberships)
		.where(and(eq(placeMemberships.program,'ku-membership'), placeId ? eq(placeMemberships.placeId, placeId) : undefined,
			mode === 'public' ? eq(placeMemberships.isPublished, true) : undefined)).orderBy(desc(placeMemberships.checkedOn));
	const result: Record<string,KuMembership> = {};
	for(const row of rows) {
		const membership: KuMembership = {
			id:row.id,placeId:row.placeId,periodLabel:row.periodLabel,sourceName:row.sourceName,summary:row.summary,
			benefits:row.benefits as string[],conditions:row.conditions as string[],
			sourceUrl:row.sourceUrl,sourceLabel:row.sourceLabel,checkedOn:row.checkedOn,
			status:row.status as KuMembership['status'],validFrom:row.validFrom,validThrough:row.validThrough
		};
		if(!result[row.placeId] && membershipIsActive(membership)) result[row.placeId]=membership;
	}
	return result;
}

const summarySelection = {
	id:places.id,type:places.type,name:places.name,categorySlug:placeCategories.slug,categoryName:placeCategories.name,
	zoneId:zones.slug,zoneName:zones.name,latitude:places.latitude,longitude:places.longitude,
	roadAddress:places.roadAddress,phone:places.phone,description:places.description,displayPriority:places.displayPriority,
	cuisine:restaurantProfiles.cuisine,sourceCategory:restaurantProfiles.sourceCategory,openingHours:restaurantProfiles.openingHours
};
type SummaryRow = {
	id:string;type:string;name:string;categorySlug:string;categoryName:string;
	zoneId:string;zoneName:string;latitude:number;longitude:number;roadAddress:string|null;phone:string|null;description:string;displayPriority:number;
	cuisine:string;sourceCategory:string;openingHours:unknown;
};
function toSummary(row:SummaryRow,memberships:Record<string,KuMembership>): RestaurantSummary {
	return {
		place:{id:row.id,type:row.type as Place['type'],name:row.name,categorySlug:row.categorySlug,categoryName:row.categoryName,
			zoneId:row.zoneId,scope:'outside',latitude:row.latitude,longitude:row.longitude,locationGuide:row.roadAddress,
			operatingHours:null,phone:row.phone,description:row.description,icon:row.categorySlug==='cafe'?'cafe':'food',isVisible:true,displayPriority:row.displayPriority},
		zoneName:row.zoneName,cuisine:row.cuisine as OutsideCuisine,sourceCategory:row.sourceCategory,
		roadAddress:row.roadAddress??'',todayHours:restaurantTodayHours(row.openingHours as RestaurantOpeningHours|null),membership:memberships[row.id]??null
	};
}
// 공개 조회는 장소와 제휴의 공개 상태를 각각 지킨다. 미공개 검토는 로컬 전용이다.
export async function readOutsideCatalog(databaseUrl:string, mode: RestaurantReadMode = 'public') {
	if (!databaseUrl) return { restaurants: [] as RestaurantSummary[], memberships: {} as Record<string, KuMembership> };
	const db=createDb(databaseUrl);
	const [rows,memberships]=await Promise.all([
		db.select(summarySelection).from(places).innerJoin(restaurantProfiles,eq(restaurantProfiles.placeId,places.id))
			.innerJoin(placeCategories,eq(placeCategories.id,places.categoryId)).innerJoin(zones,eq(zones.id,places.zoneId))
			.where(and(eq(places.scope,'outside'),eq(restaurantProfiles.catalogManaged,true),eq(restaurantProfiles.catalogStatus,'prepared'),
				mode === 'public' ? eq(places.isVisible, true) : undefined)),
		readKuMemberships(databaseUrl, undefined, mode)
	]);
	return {restaurants:rows.map(row=>toSummary(row,memberships)),memberships};
}
const detailCache = createAsyncDataCache<RestaurantDetail | null>(60_000, 128);
export async function readRestaurantDetail(databaseUrl:string,id:string, mode: RestaurantReadMode = 'public'):Promise<RestaurantDetail|null> {
	if(!databaseUrl || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return null;
	return detailCache.read(`${databaseUrl}|${mode}|${koreanDate()}|${id}`, () => queryRestaurantDetail(databaseUrl, id, mode));
}
async function queryRestaurantDetail(databaseUrl:string,id:string, mode: RestaurantReadMode):Promise<RestaurantDetail|null> {
	const db=createDb(databaseUrl);
	const [rows,memberships]=await Promise.all([
		db.select({...summarySelection,menus:restaurantProfiles.menus,naverUrl:restaurantProfiles.naverPlaceUrl,checkedOn:restaurantProfiles.lastVerifiedAt})
			.from(places).innerJoin(restaurantProfiles,eq(restaurantProfiles.placeId,places.id))
			.innerJoin(placeCategories,eq(placeCategories.id,places.categoryId)).innerJoin(zones,eq(zones.id,places.zoneId))
			.where(and(eq(places.id,id),eq(places.scope,'outside'),eq(restaurantProfiles.catalogManaged,true),eq(restaurantProfiles.catalogStatus,'prepared'),
				mode === 'public' ? eq(places.isVisible, true) : undefined)).limit(1),
		readKuMemberships(databaseUrl, id, mode)
	]);
	const row=rows[0];
	return row ? {...toSummary(row,memberships),openingHours:row.openingHours as RestaurantOpeningHours|null,menus:row.menus as RestaurantMenu[],
		naverUrl:row.naverUrl,checkedOn:row.checkedOn?koreanDate(row.checkedOn):null} : null;
}
