import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import RootLayout from '../../routes/+layout.svelte';

const children = createRawSnippet(() => ({ render: () => '' }));

describe('앱 문서 셸', () => {
	it('호이 핀 PNG를 전역 파비콘으로 사용한다', () => {
		const { head } = render(RootLayout, { props: { children } });

		expect(head).toContain('<link rel="icon" type="image/png" href="/icon.png"/>');
		expect(head).not.toContain('svelte-logo');
	});
});
