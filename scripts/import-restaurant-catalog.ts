import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import type { Place } from '../src/lib/domain/places';
import type { RestaurantMenu, RestaurantOpeningHours } from '../src/lib/domain/restaurant-catalog';

type Entry = {
  place: Place; cuisine: string; zone: {databaseId:string};
  source: {placeId:string;url:string;basicCheckedAt:string|null;originalCollectedAt:string};
  details: {roadAddress:string;sourceCategory:string;openingHours:RestaurantOpeningHours;menus:RestaurantMenu[]};
  quality: {publicationStatus:string};
};
type MembershipSource = {
  periodLabel:string;sourceUrl:string;sourceLabel:string;checkedOn:string;confirmation:string;conditions:string[];
  entries:{key:string;sourceName:string;naverPlaceId:string|null;placeId:string|null;matchStatus:string;summary:string;benefits:string[]}[];
};
const connection = process.env.DATABASE_URL;
if (!connection) throw new Error('DATABASE_URL 설정이 필요합니다.');
const sql = neon(connection);
const catalog = JSON.parse(await readFile('data/restaurant-catalog/catalog.json','utf8')) as {entries:Entry[]};
const supplementsOnly = process.argv.includes('--supplements');
const supplementalIds = supplementsOnly ? new Set<string>(
  (JSON.parse(await readFile('data/restaurant-catalog/supplements.json','utf8')) as {entries:{source:{id:number}}[]})
    .entries.map(entry=>String(entry.source.id))
) : null;
const entries = supplementalIds ? catalog.entries.filter(entry=>supplementalIds.has(entry.source.placeId)) : catalog.entries;
if(supplementalIds && (entries.length===0 || entries.length!==supplementalIds.size)) throw new Error('추가 수집분이 카탈로그와 일치하지 않습니다. 먼저 카탈로그를 생성해 주세요.');
const reportPrefix = supplementsOnly ? 'supplement-' : '';
const membership = JSON.parse(await readFile('data/restaurant-catalog/ku-membership.json','utf8')) as MembershipSource;
const [existingPlaces, existingSources, zones] = await Promise.all([
  sql`select id,name,scope,is_visible from places`,
  sql`select place_id,provider_place_id from place_sources where provider='naver'`,
  sql`select id,slug from zones`
]);
const sourceIds = new Set<string>();
const mappings = new Map<string,string>();
for(const entry of entries) {
  if (sourceIds.has(entry.source.placeId)) throw new Error('원본 네이버 ID가 중복됩니다.');
  sourceIds.add(entry.source.placeId);
  if (!zones.some(z=>z.id===entry.zone.databaseId&&z.slug===entry.place.zoneId)) throw new Error(`구역 연결 확인 필요: ${entry.place.name}`);
  const matches = existingSources.filter(s=>s.provider_place_id===entry.source.placeId);
  if(matches.length>1) throw new Error(`기존 출처가 중복됩니다: ${entry.place.name}`);
  const id = matches[0]?.place_id ?? entry.place.id;
  const existing = existingPlaces.find(p=>p.id===id);
  if(existing && existing.scope!=='outside') throw new Error(`교내 핀과 충돌합니다: ${entry.place.name}`);
  mappings.set(entry.source.placeId,id);
}
const rows = entries.map(entry=>({
  id:mappings.get(entry.source.placeId)!,type:entry.place.type,name:entry.place.name,
  category_slug:entry.place.categorySlug,zone_id:entry.zone.databaseId,
  latitude:entry.place.latitude,longitude:entry.place.longitude,
  road_address:entry.details.roadAddress,phone:entry.place.phone,description:entry.place.description,
  source_id:entry.source.placeId,source_url:entry.source.url,
  source_metadata:entry.source,cuisine:entry.cuisine,source_category:entry.details.sourceCategory,
  opening_hours:entry.details.openingHours,menus:entry.details.menus,
  catalog_status:entry.quality.publicationStatus,
  checked_at:entry.source.basicCheckedAt ?? `${entry.source.originalCollectedAt}T00:00:00+09:00`
}));
if(new Set(rows.map(x=>x.id)).size!==rows.length) throw new Error('서로 다른 원본이 하나의 장소에 연결됩니다.');
const memberships = membership.entries.filter(e=>!supplementsOnly&&e.matchStatus==='matched').map(e=>{
  const placeId = e.placeId ?? mappings.get(e.naverPlaceId ?? '');
  if(!placeId || (!rows.some(r=>r.id===placeId)&&!existingPlaces.some(p=>p.id===placeId))) throw new Error(`제휴 매장 연결 확인 필요: ${e.sourceName}`);
  return {id:`ku-2026-2-${e.key}`,place_id:placeId,source_name:e.sourceName,summary:e.summary,benefits:e.benefits};
});
const report = {
  scope:supplementsOnly?'추가 수집 매장만 반영':'전체 카탈로그 반영',
  checkedAt:new Date().toISOString(),total:rows.length,
  newPlaces:rows.filter(r=>!existingPlaces.some(p=>p.id===r.id)).length,
  prepared:rows.filter(r=>r.catalog_status==='prepared').length,
  reviewRequired:rows.filter(r=>r.catalog_status!=='prepared').length,
  memberships:memberships.length,pending:supplementsOnly?[]:membership.entries.filter(e=>e.matchStatus!=='matched').map(e=>e.sourceName),
  publication:'새 장소와 제휴 정보는 비공개로 저장하며 개발 서버에서만 확인합니다.'
};
await mkdir('output/restaurant-import',{recursive:true});
await writeFile(`output/restaurant-import/${reportPrefix}import-plan.json`,JSON.stringify({...report,places:rows.map(row=>({id:row.id,name:row.name,sourceId:row.source_id}))},null,2));
console.log(JSON.stringify(report,null,2));
if(!process.argv.includes('--apply')) process.exit(0);

// 연결된 장소 ID·평가·공개 상태는 유지한다. 새 장소만 숨김 상태로 추가한다.
const migration = supplementsOnly?[]:(await readFile('scripts/sql/restaurant-catalog.sql','utf8')).split(';').map(s=>s.trim()).filter(Boolean);
const queries = migration.map(statement=>sql.query(statement));
if(!supplementsOnly) queries.push(sql`insert into place_categories(name,slug,icon,color,display_order,is_visible)
  values('술집','bar','food','#8a1538',30,false) on conflict(slug) do nothing`);
for(let offset=0;offset<rows.length;offset+=100) {
  const payload=JSON.stringify(rows.slice(offset,offset+100));
  queries.push(sql`insert into places(id,type,name,category_id,zone_id,scope,latitude,longitude,road_address,location_guide,phone,description,is_visible)
    select r.id::uuid,r.type,r.name,c.id,r.zone_id::uuid,'outside',r.latitude,r.longitude,r.road_address,r.road_address,r.phone,r.description,false
    from jsonb_to_recordset(${payload}::jsonb) as r(id text,type text,name text,category_slug text,zone_id text,latitude double precision,longitude double precision,road_address text,phone text,description text)
    join place_categories c on c.slug=r.category_slug
    on conflict(id) do update set name=excluded.name,category_id=excluded.category_id,zone_id=excluded.zone_id,
    latitude=excluded.latitude,longitude=excluded.longitude,road_address=excluded.road_address,location_guide=excluded.location_guide,
    phone=excluded.phone,description=excluded.description,updated_at=now()`);
  queries.push(sql`insert into restaurant_profiles(place_id,opening_hours,naver_place_url,last_verified_at,cuisine,source_category,menus,catalog_status,catalog_managed)
    select r.id::uuid,r.opening_hours,r.source_url,r.checked_at::timestamptz,r.cuisine,r.source_category,r.menus,r.catalog_status,true
    from jsonb_to_recordset(${payload}::jsonb) as r(id text,opening_hours jsonb,source_url text,checked_at text,cuisine text,source_category text,menus jsonb,catalog_status text)
    on conflict(place_id) do update set opening_hours=excluded.opening_hours,naver_place_url=excluded.naver_place_url,
    last_verified_at=excluded.last_verified_at,cuisine=excluded.cuisine,source_category=excluded.source_category,menus=excluded.menus,catalog_status=excluded.catalog_status,catalog_managed=true`);
  queries.push(sql`insert into place_sources(place_id,provider,provider_place_id,provider_url,raw_payload,last_synced_at)
    select r.id::uuid,'naver',r.source_id,r.source_url,r.source_metadata,now()
    from jsonb_to_recordset(${payload}::jsonb) as r(id text,source_id text,source_url text,source_metadata jsonb)
    where not exists(select 1 from place_sources s where s.provider='naver' and s.provider_place_id=r.source_id)`);
}
if(!supplementsOnly) queries.push(sql`insert into place_memberships(id,place_id,period_label,source_name,summary,benefits,conditions,source_url,source_label,checked_on,verification_note,is_published)
  select r.id,r.place_id::uuid,${membership.periodLabel},r.source_name,r.summary,r.benefits,${JSON.stringify(membership.conditions)}::jsonb,
  ${membership.sourceUrl},${membership.sourceLabel},${membership.checkedOn}::date,${membership.confirmation},false
  from jsonb_to_recordset(${JSON.stringify(memberships)}::jsonb) as r(id text,place_id text,source_name text,summary text,benefits jsonb)
  on conflict(id) do update set source_name=excluded.source_name,summary=excluded.summary,benefits=excluded.benefits,conditions=excluded.conditions,
  source_url=excluded.source_url,source_label=excluded.source_label,checked_on=excluded.checked_on,verification_note=excluded.verification_note,updated_at=now()`);
await sql.transaction(queries);
const [counts,published,originalPlaces] = await Promise.all([
  supplementsOnly ? sql`select count(*)::int as count from restaurant_profiles where catalog_managed=true and place_id=any(${rows.map(row=>row.id)}::uuid[])`
    : sql`select count(*)::int as count from restaurant_profiles where catalog_managed=true`,
  sql`select count(*)::int as count from places p join restaurant_profiles r on r.place_id=p.id where r.catalog_managed=true and p.is_visible=true and p.id=any(${rows.map(row=>row.id)}::uuid[])`,
  sql`select id,name,is_visible from places where id=any(${existingPlaces.map(p=>p.id)}::uuid[])`
]);
if(counts[0].count!==rows.length) throw new Error('DB 저장 건수 확인이 필요합니다.');
if(originalPlaces.some(p=>p.is_visible!==existingPlaces.find(e=>e.id===p.id)?.is_visible)) throw new Error('기존 핀 공개 상태가 달라졌습니다.');
await writeFile(`output/restaurant-import/${reportPrefix}import-result.json`,JSON.stringify({...report,appliedAt:new Date().toISOString(),databaseRows:counts[0].count,publicRows:published[0].count,originalPlacesPreserved:originalPlaces.length},null,2));
console.log(`DB 반영 완료: 음식점 ${counts[0].count}개, 제휴 ${memberships.length}개. 공개된 신규 음식점 ${published[0].count}개.`);
