export const analyticsEvents = {
	viewMapHome: 'view_map_home',
	selectZone: 'select_zone',
	selectCategory: 'select_category',
	searchPlace: 'search_place',
	clickPlaceMarker: 'click_place_marker',
	openPlaceSheet: 'open_place_sheet',
	clickPlaceDetail: 'click_place_detail',
	clickShuttleMarker: 'click_shuttle_marker',
	openCafeteria: 'open_cafeteria',
	openMeetup: 'open_meetup',
	createMeetupStart: 'create_meetup_start',
	createMeetupComplete: 'create_meetup_complete',
	loginSuccess: 'login_success',
	onboardingComplete: 'onboarding_complete'
} as const;

export type AnalyticsEventName = (typeof analyticsEvents)[keyof typeof analyticsEvents];
