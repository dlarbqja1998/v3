import { getShuttleMarkerCountdown } from '$lib/domain/shuttle-countdown';
import type { ShuttleStopId } from '$lib/domain/shuttle';

/** SDK 마커를 다시 만들지 않고 숫자와 안내 문구만 갱신한다. */
export function createShuttleMarker(pinHtml: string, stopId: ShuttleStopId, onSelect: () => void) {
	const element = document.createElement('div');
	element.style.cssText = 'position:relative;width:32px;height:32px;overflow:visible;';
	// 외부 데이터가 아니라 기존 markerHtml에서 만든 검증된 핀 도형이다.
	element.innerHTML = pinHtml;
	const label = document.createElement('button');
	label.type = 'button';
	label.dataset.shuttleCountdown = stopId;
	label.hidden = true;
	label.style.cssText = 'position:absolute;left:16px;bottom:calc(100% + 8px);transform:translateX(-50%);display:none;align-items:center;min-height:36px;white-space:nowrap;padding:6px 9px;border:1px solid #e7e1e3;border-radius:10px;background:#fff;color:#241318;cursor:pointer;font-family:inherit;line-height:1.4;';
	const time = document.createElement('strong');
	time.style.cssText = 'font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;';
	label.append(time);
	label.addEventListener('click', (event) => { event.stopPropagation(); onSelect(); });
	element.append(label);
	let previous = '';
	let hasCountdown = false;
	return {
		element,
		label,
		get hasCountdown() { return hasCountdown; },
		update(now: Date) {
			const countdown = getShuttleMarkerCountdown(now, stopId);
			hasCountdown = countdown !== null;
			if (!countdown) {
				previous = '';
				time.textContent = '';
				label.hidden = true;
				label.style.display = 'none';
				label.removeAttribute('aria-label');
				label.removeAttribute('title');
				return;
			}
			const signature = JSON.stringify([countdown.label, countdown.directionLabel, countdown.departureTime, countdown.status, countdown.isUrgent]);
			if (previous === signature) return;
			previous = signature;
			time.textContent = countdown.label;
			time.style.color = countdown.status === 'scheduled' ? '#a61942' : '#75666a';
			label.style.borderColor = countdown.isUrgent ? '#a61942' : '#e7e1e3';
			label.dataset.urgent = String(countdown.isUrgent);
			const description = `${countdown.directionLabel} · ${countdown.label} · 시간표 기준${countdown.departureTime ? ` · ${countdown.departureTime} 출발 예정` : ''}`;
			label.setAttribute('aria-label', description);
			label.title = `${description}. 임시 운휴·지연은 반영되지 않을 수 있어요.`;
		}
	};
}

export type ShuttleMarkerView = ReturnType<typeof createShuttleMarker>;

/** 가장자리에서는 라벨을 안쪽으로 옮기고, 겹치면 선택한 정류장을 우선한다. */
export function arrangeShuttleLabels(views: [string, ShuttleMarkerView][], bounds: DOMRect, activeId: string) {
	const occupied: DOMRect[] = [];
	const ordered = [...views].sort(([first], [second]) => Number(second === activeId) - Number(first === activeId));
	for (const [, view] of ordered) {
		if (!view.hasCountdown) {
			view.label.hidden = true;
			view.label.style.display = 'none';
			continue;
		}
		view.label.hidden = false;
		view.label.style.display = 'flex';
		const pin = view.element.getBoundingClientRect();
		if (pin.right < bounds.left || pin.left > bounds.right || pin.bottom < bounds.top || pin.top > bounds.bottom) {
			view.label.hidden = true;
			view.label.style.display = 'none';
			continue;
		}
		view.label.style.left = '16px';
		const rect = view.label.getBoundingClientRect();
		const shift = Math.max(0, bounds.left + 8 - rect.left) - Math.max(0, rect.right - (bounds.right - 8));
		view.label.style.left = `${16 + shift}px`;
		const adjusted = view.label.getBoundingClientRect();
		const overlaps = occupied.some((other) => adjusted.left < other.right + 4 && adjusted.right > other.left - 4 && adjusted.top < other.bottom + 4 && adjusted.bottom > other.top - 4);
		view.label.hidden = overlaps;
		view.label.style.display = overlaps ? 'none' : 'flex';
		if (!overlaps) occupied.push(adjusted);
	}
}
