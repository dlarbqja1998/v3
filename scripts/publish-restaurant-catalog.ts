import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

type CatalogEntry = { source: { placeId: string }; quality: { publicationStatus: string } };
type MembershipEntry = { key: string; matchStatus: string };

const connection = process.env.DATABASE_URL;
if (!connection) throw new Error('DATABASE_URL 설정이 필요합니다.');
const sql = neon(connection);
const catalog = JSON.parse(await readFile('data/restaurant-catalog/catalog.json', 'utf8')) as { entries: CatalogEntry[] };
const membership = JSON.parse(await readFile('data/restaurant-catalog/ku-membership.json', 'utf8')) as { entries: MembershipEntry[] };
const prepared = catalog.entries.filter(entry => entry.quality.publicationStatus === 'prepared');
const sourceIds = prepared.map(entry => String(entry.source.placeId));
if (!sourceIds.length || new Set(sourceIds).size !== sourceIds.length) throw new Error('공개 대상 네이버 ID를 확인해 주세요.');
const membershipIds = membership.entries.filter(entry => entry.matchStatus === 'matched').map(entry => `ku-2026-2-${entry.key}`);

const [placeRows, membershipRows, categoryRows] = await Promise.all([
  sql`select p.id,p.name,p.is_visible,r.catalog_status,s.provider_place_id as source_id
      from places p join restaurant_profiles r on r.place_id=p.id
      join place_sources s on s.place_id=p.id
      where p.scope='outside' and r.catalog_managed=true and s.provider='naver'
        and s.provider_place_id=any(${sourceIds}::text[])`,
  sql`select m.id,m.place_id,m.is_published,p.is_visible,p.scope
      from place_memberships m join places p on p.id=m.place_id
      where m.id=any(${membershipIds}::text[])`,
  sql`select distinct c.id,c.slug,c.is_visible
      from place_categories c join places p on p.category_id=c.id
      join restaurant_profiles r on r.place_id=p.id join place_sources s on s.place_id=p.id
      where p.scope='outside' and r.catalog_managed=true and r.catalog_status='prepared'
        and s.provider='naver' and s.provider_place_id=any(${sourceIds}::text[])`
]);

if (placeRows.length !== prepared.length || new Set(placeRows.map(row => row.id)).size !== prepared.length ||
    new Set(placeRows.map(row => row.source_id)).size !== prepared.length || placeRows.some(row => row.catalog_status !== 'prepared')) {
  throw new Error('DB와 카탈로그의 공개 대상이 일치하지 않습니다. 가져오기 결과를 먼저 확인해 주세요.');
}
if (membershipRows.length !== membershipIds.length) throw new Error('공개할 KU멤버십 연결을 확인해 주세요.');
const placeIds = placeRows.map(row => row.id);
if (membershipRows.some(row => !row.is_visible && !placeIds.includes(row.place_id))) {
  throw new Error('미공개 장소에 연결된 KU멤버십이 있습니다.');
}
const categoryIds = categoryRows.map(row => row.id);
const applying = process.argv.includes('--apply');
const report = {
  checkedAt: new Date().toISOString(),
  mode: applying ? '공개 반영' : '사전 점검',
  prepared: prepared.length,
  reviewRequiredExcluded: catalog.entries.length - prepared.length,
  placesToPublish: placeRows.filter(row => !row.is_visible).length,
  memberships: membershipRows.length,
  membershipsToPublish: membershipRows.filter(row => !row.is_published).length,
  categoriesToPublish: categoryRows.filter(row => !row.is_visible).map(row => row.slug)
};
await mkdir('output/restaurant-publication', { recursive: true });
const reportPath = `output/restaurant-publication/${report.checkedAt.replace(/[:.]/g, '-')}-${applying ? 'apply' : 'plan'}.json`;
// 공개 전 상태를 남겨 이번 실행에서 바뀐 항목을 되돌릴 수 있게 한다.
await writeFile(reportPath, JSON.stringify({ ...report, before: { places: placeRows, memberships: membershipRows, categories: categoryRows } }, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!applying) process.exit(0);

await sql.transaction([
  sql`update places set is_visible=true,updated_at=now() where id=any(${placeIds}::uuid[]) and is_visible=false`,
  sql`update place_memberships set is_published=true,updated_at=now() where id=any(${membershipIds}::text[]) and is_published=false`,
  sql`update place_categories set is_visible=true where id=any(${categoryIds}::uuid[]) and is_visible=false`
]);
const [publishedPlaces, publishedMemberships] = await Promise.all([
  sql`select count(*)::int as count from places p join restaurant_profiles r on r.place_id=p.id
      where p.id=any(${placeIds}::uuid[]) and p.is_visible=true and r.catalog_status='prepared' and r.catalog_managed=true`,
  sql`select count(*)::int as count from place_memberships where id=any(${membershipIds}::text[]) and is_published=true`
]);
if (publishedPlaces[0].count !== prepared.length || publishedMemberships[0].count !== membershipRows.length) {
  throw new Error(`공개 후 수량을 확인해 주세요. 반영 전 상태: ${reportPath}`);
}
await writeFile(reportPath, JSON.stringify({ ...report, before: { places: placeRows, memberships: membershipRows, categories: categoryRows },
  verified: { places: publishedPlaces[0].count, memberships: publishedMemberships[0].count } }, null, 2));
console.log(`공개 완료: 교외 ${publishedPlaces[0].count}곳, KU멤버십 ${publishedMemberships[0].count}곳. 반영 기록: ${reportPath}`);
