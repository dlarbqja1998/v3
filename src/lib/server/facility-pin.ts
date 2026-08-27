import {
	isFacilityCategorySlug,
	type FacilityCategorySlug
} from '$lib/domain/facility-categories';
import type { PlaceScope } from '$lib/domain/places';

export type FacilityPinDraft = {
	id?: string;
	name: string;
	scope: PlaceScope;
	categorySlug: FacilityCategorySlug;
	zoneId: string | null;
	latitude: number;
	longitude: number;
	locationGuide: string;
	description: string;
	operatingHours: string | null;
	phone: string | null;
	displayPriority: number;
	isVisible: boolean;
};

export type FacilityPinParseResult =
	| { ok: true; value: FacilityPinDraft }
	| { ok: false; message: string };

function optionalText(value: FormDataEntryValue | null) {
	const text = value?.toString().trim() ?? '';
	return text || null;
}

export function parseFacilityPinInput(formData: FormData): FacilityPinParseResult {
	const id = optionalText(formData.get('id')) ?? undefined;
	const name = formData.get('name')?.toString().trim() ?? '';
	const scopeValue = formData.get('scope')?.toString() ?? '';
	const categorySlug = formData.get('categorySlug')?.toString() ?? '';
	const zoneIdValue = optionalText(formData.get('zoneId'));
	const latitudeValue = optionalText(formData.get('latitude'));
	const longitudeValue = optionalText(formData.get('longitude'));
	const latitude = latitudeValue === null ? Number.NaN : Number(latitudeValue);
	const longitude = longitudeValue === null ? Number.NaN : Number(longitudeValue);
	const locationGuide = formData.get('locationGuide')?.toString().trim() ?? '';
	const description = formData.get('description')?.toString().trim() ?? '';
	const displayPriority = Number(formData.get('displayPriority'));

	if (!name || name.length > 120) {
		return { ok: false, message: '시설명은 120자 이내로 입력해 주세요.' };
	}
	if (scopeValue !== 'campus' && scopeValue !== 'outside') {
		return { ok: false, message: '시설 범위를 선택해 주세요.' };
	}
	if (!isFacilityCategorySlug(categorySlug)) {
		return { ok: false, message: '시설 카테고리를 선택해 주세요.' };
	}
	if (
		!Number.isFinite(latitude) ||
		!Number.isFinite(longitude) ||
		latitude < -90 ||
		latitude > 90 ||
		longitude < -180 ||
		longitude > 180
	) {
		return { ok: false, message: '지도에서 핀 위치를 지정해 주세요.' };
	}
	if (!locationGuide || locationGuide.length > 160) {
		return { ok: false, message: '위치 안내는 160자 이내로 입력해 주세요.' };
	}
	if (scopeValue === 'outside' && !zoneIdValue) {
		return { ok: false, message: '교외 시설이 속한 상권 구역을 선택해 주세요.' };
	}
	if (!Number.isInteger(displayPriority) || displayPriority < 0 || displayPriority > 9999) {
		return { ok: false, message: '표시 순서는 0부터 9999 사이의 정수로 입력해 주세요.' };
	}

	return {
		ok: true,
		value: {
			id,
			name,
			scope: scopeValue,
			categorySlug,
			zoneId: scopeValue === 'campus' ? null : zoneIdValue,
			latitude,
			longitude,
			locationGuide,
			description,
			operatingHours: optionalText(formData.get('operatingHours')),
			phone: optionalText(formData.get('phone')),
			displayPriority,
			isVisible: formData.get('isVisible') === 'on'
		}
	};
}
