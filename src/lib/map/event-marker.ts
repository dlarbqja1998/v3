/** 숫자는 작게 유지하되 키보드·터치 선택 영역은 44px로 확보한다. */
export function createCampusEventBadge(name: string, count: number, active: boolean, onSelect: () => void) {
	const button = document.createElement('button');
	button.type = 'button';
	button.setAttribute('aria-label', `${name} 행사 ${count}개 보기`);
	button.dataset.campusEventBadge = 'true';
	button.style.cssText = 'display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;background:transparent;cursor:pointer;color:var(--color-brand,#a51c45)';
	const circle = document.createElement('span');
	circle.textContent = String(count);
	circle.style.cssText = `display:grid;place-items:center;min-width:26px;height:26px;padding:0 5px;box-sizing:border-box;border:2px solid white;border-radius:50%;background:currentColor;${active ? 'outline:3px solid #a51c4540;' : ''}`;
	const label = document.createElement('span');
	label.textContent = String(count);
	label.style.cssText = 'color:white;font-size:12px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums';
	circle.replaceChildren(label);
	button.append(circle);
	button.addEventListener('click', (event) => { event.stopPropagation(); onSelect(); });
	return button;
}
