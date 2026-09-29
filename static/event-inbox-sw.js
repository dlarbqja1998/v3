self.addEventListener('push', (event) => {
	let data;
	try { data = event.data?.json(); } catch { return; }
	if (!data || typeof data.title !== 'string') return;
	event.waitUntil(self.registration.showNotification(data.title, {
		body: typeof data.body === 'string' ? data.body : '',
		icon: '/icon.png',
		tag: 'event-inbox',
		data: { url: '/admin/events/inbox' }
	}));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	event.waitUntil((async () => {
		const destination = new URL('/admin/events/inbox', self.location.origin).href;
		const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
		const existing = windows.find((client) => client.url.startsWith(self.location.origin + '/admin/events/inbox'));
		if (existing) { await existing.navigate(destination); await existing.focus(); }
		else await self.clients.openWindow(destination);
	})());
});
