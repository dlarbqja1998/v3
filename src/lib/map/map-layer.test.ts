import { describe, expect, it, vi } from 'vitest';
import { createMapLayer } from './map-layer';

describe('지도 객체 갱신', () => {
	it('같은 데이터를 새 배열로 받아도 객체를 재생성하지 않는다', () => {
		const dispose = vi.fn();
		const create = vi.fn((item: { id: string; signature: string }) => ({ id: item.id }));
		const layer = createMapLayer(dispose);
		layer.sync([{ id: 'a', signature: '기본' }], (item) => item, create);
		layer.sync([{ id: 'a', signature: '기본' }], (item) => item, create);
		expect(create).toHaveBeenCalledTimes(1);
		expect(dispose).not.toHaveBeenCalled();
	});

	it('선택이 달라진 마커만 교체하고 삭제·최종 정리도 한 번씩 수행한다', () => {
		const dispose = vi.fn();
		const create = vi.fn((item: { id: string; signature: string }) => ({ ...item }));
		const layer = createMapLayer(dispose);
		layer.sync([{ id: 'a', signature: '기본' }, { id: 'b', signature: '기본' }], (item) => item, create);
		layer.sync([{ id: 'a', signature: '선택' }, { id: 'b', signature: '기본' }], (item) => item, create);
		expect(create).toHaveBeenCalledTimes(3);
		expect(dispose).toHaveBeenCalledTimes(1);
		layer.sync([{ id: 'b', signature: '기본' }], (item) => item, create);
		layer.clear();
		layer.clear();
		expect(dispose).toHaveBeenCalledTimes(3);
	});
});
