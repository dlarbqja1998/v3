<script lang="ts">
	import { onMount } from 'svelte';
	let supported = $state(false), subscribed = $state(false), pending = $state(false), message = $state('');
	onMount(() => {
		supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext;
		if (supported) void navigator.serviceWorker.getRegistration('/admin/events/inbox/').then(async (registration) => {
			const subscription = await registration?.pushManager.getSubscription();
			if (!subscription) return;
			const response = await fetch('/api/admin/event-notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', subscription: subscription.toJSON() }) });
			if (response.ok) subscribed = (await response.json()).subscribed === true;
		}).catch(() => undefined);
	});
	function publicKeyBytes(value: string) {
		const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='));
		return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
	}
	async function toggle() {
		pending = true; message = '';
		try {
			if (!supported) { message = '이 환경에서는 알림을 지원하지 않아요. 브라우저에서 승인함을 열어 주세요.'; return; }
			if (!subscribed && await Notification.requestPermission() !== 'granted') { message = '알림을 받으려면 브라우저 설정에서 알림을 허용해 주세요.'; return; }
			const registration = await navigator.serviceWorker.register('/event-inbox-sw.js', { scope: '/admin/events/inbox/' });
			if (!registration.active) await new Promise<void>((resolve, reject) => {
				const worker = registration.installing ?? registration.waiting;
				if (!worker) { reject(new Error('알림을 준비하지 못했습니다. 다시 시도해 주세요.')); return; }
				const timer = setTimeout(() => reject(new Error('알림 준비가 지연되고 있어요. 다시 시도해 주세요.')), 15000);
				worker.addEventListener('statechange', () => { if (worker.state === 'activated') { clearTimeout(timer); resolve(); } else if (worker.state === 'redundant') { clearTimeout(timer); reject(new Error('알림 준비에 실패했습니다.')); } });
			});
			let subscription = await registration.pushManager.getSubscription();
			if (subscribed && subscription) {
				const response = await fetch('/api/admin/event-notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unsubscribe', subscription: subscription.toJSON() }) });
				if (!response.ok) throw new Error('알림 설정을 저장하지 못했습니다.');
				await subscription.unsubscribe(); subscribed = false; message = '이 기기의 행사 알림을 껐어요.';
			} else {
				const config = await fetch('/api/admin/event-notifications');
				if (!config.ok) throw new Error('관리자 로그인 상태를 확인해 주세요.');
				const { publicKey } = await config.json();
				if (!publicKey) throw new Error('서버 알림 연결을 준비 중이에요.');
				subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKeyBytes(publicKey) });
				const response = await fetch('/api/admin/event-notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'subscribe', subscription: subscription.toJSON() }) });
				if (!response.ok) throw new Error('알림 설정을 저장하지 못했습니다. 다시 눌러 주세요.');
				subscribed = true; message = '이 기기에서 행사 확인 결과를 받을 수 있어요.';
			}
		} catch (error) { message = error instanceof Error ? error.message : '알림을 연결하지 못했습니다.'; }
		finally { pending = false; }
	}
</script>
<div><button type="button" class="min-h-11 text-[13px] text-brand-muted disabled:opacity-40" disabled={pending} onclick={toggle}>{pending ? '알림 연결 중…' : subscribed ? '이 기기 알림 끄기' : '행사 알림 받기'}</button>{#if message}<p class="m-0 text-[12px] leading-5 text-brand-muted" role="status">{message}</p>{/if}</div>
