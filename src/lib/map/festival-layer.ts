import type { Festival } from '$lib/domain/festival';

/** 축제 경계와 진입 핀은 한 레이어로 함께 생성·정리한다. */
export function createFestivalLayer(maps: any, map: any, festival: Festival, selected: boolean, onSelect: () => void) {
	const area = festival.area;
	const polygon = new maps.Polygon({ map, paths: area.boundary.map((p) => new maps.LatLng(p.latitude,p.longitude)), fillColor:'#a61942',fillOpacity:selected?0.14:0.08,strokeColor:'#a61942',strokeWeight:2,strokeOpacity:0.7,strokeStyle:area.approximate?'shortdash':'solid',zIndex:5 });
	const element = document.createElement('button');
	element.type = 'button';
	element.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;width:46px;height:46px;background:transparent;border:0;cursor:pointer;';
	const pin = document.createElement('img'); pin.src = '/images/map/event-pin.svg'; pin.alt = ''; pin.width = 46; pin.height = 46;
	const title = document.createElement('span'); title.textContent = festival.mapLabel || festival.name;
	title.style.cssText = 'position:absolute;bottom:50px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#fff;border:1px solid #e7e1e3;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:700;color:#a61942;';
	element.setAttribute('aria-label',`${festival.name} · 부스와 공연 보기`); element.append(pin);
	if (!selected) element.append(title);
	element.addEventListener('click',(event)=>{event.stopPropagation();onSelect();});
	const marker = new maps.Marker({map,position:new maps.LatLng(area.latitude,area.longitude),zIndex:150,icon:{content:element,size:new maps.Size(46,46),anchor:new maps.Point(23,43)}});
	maps.Event.addListener(polygon,'click',onSelect);
	return { dispose() { for(const item of [polygon,marker]) { maps.Event.clearInstanceListeners(item);item.setMap(null); } } };
}
