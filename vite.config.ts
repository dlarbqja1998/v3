import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { cloudflareAdapterWithCafeteriaSchedule } from './scripts/cafeteria-scheduled-worker-adapter.js';

export default defineConfig({
	server: {
		host: '0.0.0.0',
		allowedHosts: [
			'softball-shows-selecting-doors.trycloudflare.com',
			'dating-head-routes-beer.trycloudflare.com'
		]
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: cloudflareAdapterWithCafeteriaSchedule()
		})
	]
});
