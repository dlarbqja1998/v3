import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import PinEditorPage from './+page.svelte';
import * as PinEditorPageModule from './+page.svelte';

const data = {
	pins: [],
	categories: [
		{
			id: 'category-id',
			slug: 'convenience-store',
			name: '편의점',
			icon: 'convenience_store_GS'
		}
	],
	zones: [],
	naverMapClientId: '',
	saved: false
};

describe('관리자 핀 에디터 화면', () => {
	it('교내·교외 범위와 시설 입력 항목을 제공한다', () => {
		const { body } = render(PinEditorPage, { props: { data, form: null } as never });

		expect(body).toContain('지도 핀 편집');
		expect(body).toContain('교내');
		expect(body).toContain('교외');
		expect(body).toContain('지도에 표시');
		expect(body).toContain('운영시간');
		expect(body).toContain('전화번호');
	});

	it('선택 카테고리의 20·24 아이콘을 미리 보여준다', () => {
		const { body } = render(PinEditorPage, { props: { data, form: null } as never });

		expect(body).toContain('/20 icon/convenience_store_GS.svg');
		expect(body).toContain('/24 icon/convenience_store_GS.svg');
		expect(body).not.toContain('아이콘 파일명');
	});

	it('표시 순서가 바텀시트 순서임을 명확히 안내한다', () => {
		const { body } = render(PinEditorPage, { props: { data, form: null } as never });

		expect(body).toContain('바텀시트 표시 순서');
	});

	it('선택한 핀은 기존 마커 목록에서 제외해 편집 마커와 중복되지 않게 한다', () => {
		const pins = [{ id: 'selected' }, { id: 'other' }];
		const getSavedPinsForEditor = (
			PinEditorPageModule as typeof PinEditorPageModule & {
				getSavedPinsForEditor?: <T extends { id: string }>(pins: T[], selectedPinId: string) => T[];
			}
		).getSavedPinsForEditor;

		expect(getSavedPinsForEditor?.(pins, 'selected')).toEqual([{ id: 'other' }]);
	});

	it('같은 핀을 편집하는 동안 좌표가 바뀌어도 저장 좌표를 다시 주입하지 않는다', () => {
		const shouldHydratePinEditorDraft = (
			PinEditorPageModule as typeof PinEditorPageModule & {
				shouldHydratePinEditorDraft?: (hydratedPinId: string, selectedPinId: string) => boolean;
			}
		).shouldHydratePinEditorDraft;

		expect(shouldHydratePinEditorDraft?.('', 'pin-1')).toBe(true);
		expect(shouldHydratePinEditorDraft?.('pin-1', 'pin-1')).toBe(false);
		expect(shouldHydratePinEditorDraft?.('pin-1', 'pin-2')).toBe(true);
	});

	it('저장하지 않은 수정사항이 있으면 이동 방식에 맞는 이탈 확인을 선택한다', () => {
		const getPinEditorLeaveGuard = (
			PinEditorPageModule as typeof PinEditorPageModule & {
				getPinEditorLeaveGuard?: (
					hasUnsavedChanges: boolean,
					allowNextNavigation: boolean,
					willUnload: boolean
				) => 'allow' | 'dialog' | 'native';
			}
		).getPinEditorLeaveGuard;

		expect(getPinEditorLeaveGuard?.(false, false, false)).toBe('allow');
		expect(getPinEditorLeaveGuard?.(true, true, false)).toBe('allow');
		expect(getPinEditorLeaveGuard?.(true, false, false)).toBe('dialog');
		expect(getPinEditorLeaveGuard?.(true, false, true)).toBe('native');
	});

	it('새 핀 저장 후 리다이렉트 주소의 핀 ID로 편집 상태를 전환한다', () => {
		const getSavedPinIdFromRedirect = (
			PinEditorPageModule as typeof PinEditorPageModule & {
				getSavedPinIdFromRedirect?: (location: string, currentPinId: string) => string;
			}
		).getSavedPinIdFromRedirect;

		expect(
			getSavedPinIdFromRedirect?.('/admin/pin-editor?saved=1&pin=new-pin-id', '')
		).toBe('new-pin-id');
		expect(getSavedPinIdFromRedirect?.('/admin/pin-editor?saved=1', 'existing-pin-id')).toBe(
			'existing-pin-id'
		);
	});

	it('핀 저장이 진행 중이면 연속 제출을 시작하지 않는다', () => {
		const canStartPinSave = (
			PinEditorPageModule as typeof PinEditorPageModule & {
				canStartPinSave?: (isSaving: boolean) => boolean;
			}
		).canStartPinSave;

		expect(canStartPinSave?.(false)).toBe(true);
		expect(canStartPinSave?.(true)).toBe(false);
	});

	it('네이버 SDK가 위치 스타일을 바꿔도 지도 높이가 유지되는 내부 컨테이너를 사용한다', () => {
		const { body } = render(PinEditorPage, { props: { data, form: null } as never });

		expect(body).toContain('class="absolute inset-0"><div class="h-full w-full"');
	});
});
