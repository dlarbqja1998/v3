import {
	boolean,
	doublePrecision,
	integer,
	jsonb,
	pgTable,
	text,
	time,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';

export const zones = pgTable('zones', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 80 }).notNull(),
	slug: varchar('slug', { length: 80 }).notNull().unique(),
	centerLatitude: doublePrecision('center_latitude').notNull(),
	centerLongitude: doublePrecision('center_longitude').notNull(),
	polygon: jsonb('polygon'),
	displayOrder: integer('display_order').notNull().default(0),
	isVisible: boolean('is_visible').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const placeCategories = pgTable('place_categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 80 }).notNull(),
	slug: varchar('slug', { length: 80 }).notNull().unique(),
	icon: varchar('icon', { length: 40 }).notNull(),
	color: varchar('color', { length: 20 }).notNull(),
	displayOrder: integer('display_order').notNull().default(0),
	isVisible: boolean('is_visible').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const places = pgTable('places', {
	id: uuid('id').defaultRandom().primaryKey(),
	type: varchar('type', { length: 40 }).notNull(),
	name: varchar('name', { length: 120 }).notNull(),
	categoryId: uuid('category_id')
		.notNull()
		.references(() => placeCategories.id),
	zoneId: uuid('zone_id')
		.notNull()
		.references(() => zones.id),
	latitude: doublePrecision('latitude').notNull(),
	longitude: doublePrecision('longitude').notNull(),
	address: text('address'),
	roadAddress: text('road_address'),
	phone: varchar('phone', { length: 40 }),
	description: text('description').notNull().default(''),
	isVisible: boolean('is_visible').notNull().default(true),
	displayPriority: integer('display_priority').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const placeSources = pgTable('place_sources', {
	id: uuid('id').defaultRandom().primaryKey(),
	placeId: uuid('place_id')
		.notNull()
		.references(() => places.id),
	provider: varchar('provider', { length: 40 }).notNull(),
	providerPlaceId: varchar('provider_place_id', { length: 120 }),
	providerUrl: text('provider_url'),
	rawPayload: jsonb('raw_payload'),
	lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const restaurantProfiles = pgTable('restaurant_profiles', {
	placeId: uuid('place_id')
		.primaryKey()
		.references(() => places.id),
	priceLevel: integer('price_level'),
	openingHours: jsonb('opening_hours'),
	menuSummary: text('menu_summary'),
	naverPlaceUrl: text('naver_place_url'),
	kakaoPlaceUrl: text('kakao_place_url'),
	ratingAvg: doublePrecision('rating_avg'),
	reviewCount: integer('review_count').notNull().default(0),
	lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true })
});

export const shuttleStops = pgTable('shuttle_stops', {
	placeId: uuid('place_id')
		.primaryKey()
		.references(() => places.id),
	stopCode: varchar('stop_code', { length: 80 }).notNull(),
	direction: varchar('direction', { length: 80 }).notNull(),
	memo: text('memo')
});

export const shuttleSchedules = pgTable('shuttle_schedules', {
	id: uuid('id').defaultRandom().primaryKey(),
	stopId: uuid('stop_id')
		.notNull()
		.references(() => shuttleStops.placeId),
	dayType: varchar('day_type', { length: 40 }).notNull(),
	departureTime: time('departure_time').notNull(),
	routeName: varchar('route_name', { length: 120 }).notNull(),
	isActive: boolean('is_active').notNull().default(true)
});

export const cafeterias = pgTable('cafeterias', {
	placeId: uuid('place_id')
		.primaryKey()
		.references(() => places.id),
	name: varchar('name', { length: 120 }).notNull(),
	type: varchar('type', { length: 40 }).notNull()
});

export const cafeteriaMenus = pgTable('cafeteria_menus', {
	id: uuid('id').defaultRandom().primaryKey(),
	cafeteriaId: uuid('cafeteria_id')
		.notNull()
		.references(() => cafeterias.placeId),
	menuDate: varchar('menu_date', { length: 10 }).notNull(),
	mealType: varchar('meal_type', { length: 40 }).notNull(),
	items: jsonb('items').notNull(),
	source: varchar('source', { length: 80 }).notNull().default('manual'),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
