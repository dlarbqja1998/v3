import {
	boolean,
	date,
	doublePrecision,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	time,
	timestamp,
	uniqueIndex,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';

export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		email: text('email').notNull(),
		password: text('password'),
		nickname: varchar('nickname', { length: 10 }),
		profileImg: text('profile_img'),
		provider: varchar('provider', { length: 40 }).notNull().default('local'),
		providerId: text('provider_id'),
		college: text('college'),
		department: text('department'),
		grade: varchar('grade', { length: 40 }),
		gender: varchar('gender', { length: 20 }),
		isOnboarded: boolean('is_onboarded').notNull().default(false),
		role: varchar('role', { length: 20 }).notNull().default('user'),
		isBanned: boolean('is_banned').notNull().default(false),
		status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('users_email_unique').on(table.email),
		uniqueIndex('users_provider_id_unique').on(table.provider, table.providerId),
		uniqueIndex('users_nickname_unique').on(table.nickname)
	]
);

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

export const campusSpots = pgTable('campus_spots', {
	id: varchar('id', { length: 120 }).primaryKey(),
	name: varchar('name', { length: 120 }).notNull(),
	type: varchar('type', { length: 20 }).notNull(),
	centerLatitude: doublePrecision('center_latitude').notNull(),
	centerLongitude: doublePrecision('center_longitude').notNull(),
	boundary: jsonb('boundary').notNull(),
	source: varchar('source', { length: 20 }).notNull(),
	osmId: varchar('osm_id', { length: 120 }),
	description: text('description').notNull().default(''),
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
		.references(() => zones.id),
	scope: varchar('scope', { length: 20 }).notNull().default('outside'),
	latitude: doublePrecision('latitude').notNull(),
	longitude: doublePrecision('longitude').notNull(),
	address: text('address'),
	roadAddress: text('road_address'),
	locationGuide: varchar('location_guide', { length: 160 }),
	operatingHours: varchar('operating_hours', { length: 240 }),
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

export const cafeteriaOperatingHours = pgTable('cafeteria_operating_hours', {
	id: uuid('id').defaultRandom().primaryKey(),
	cafeteriaCode: varchar('cafeteria_code', { length: 40 }).notNull(),
	label: varchar('label', { length: 40 }).notNull(),
	daysOfWeek: jsonb('days_of_week').notNull(),
	opensAt: time('opens_at').notNull(),
	closesAt: time('closes_at').notNull(),
	displayOrder: integer('display_order').notNull().default(0),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const cafeteriaMenuItems = pgTable(
	'cafeteria_menu_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		cafeteriaCode: varchar('cafeteria_code', { length: 40 }).notNull(),
		normalizedName: varchar('normalized_name', { length: 160 }).notNull(),
		displayName: varchar('display_name', { length: 160 }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('cafeteria_menu_items_code_name_unique').on(
			table.cafeteriaCode,
			table.normalizedName
		)
	]
);

export const cafeteriaMenuOfferings = pgTable(
	'cafeteria_menu_offerings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		menuItemId: uuid('menu_item_id')
			.notNull()
			.references(() => cafeteriaMenuItems.id),
		cafeteriaCode: varchar('cafeteria_code', { length: 40 }).notNull(),
		menuDate: date('menu_date').notNull(),
		mealSlot: varchar('meal_slot', { length: 20 }).notNull(),
		menuSection: varchar('menu_section', { length: 40 }).notNull(),
		displayName: varchar('display_name', { length: 160 }).notNull(),
		isVotable: boolean('is_votable').notNull().default(false),
		source: varchar('source', { length: 20 }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('cafeteria_menu_offerings_unique').on(
			table.menuItemId,
			table.menuDate,
			table.mealSlot,
			table.menuSection
		)
	]
);

export const cafeteriaMenuVotes = pgTable(
	'cafeteria_menu_votes',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		offeringId: uuid('offering_id')
			.notNull()
			.references(() => cafeteriaMenuOfferings.id),
		voterHash: varchar('voter_hash', { length: 64 }).notNull(),
		reaction: varchar('reaction', { length: 10 }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [uniqueIndex('cafeteria_menu_votes_offering_voter_unique').on(table.offeringId, table.voterHash)]
);
