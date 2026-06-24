// PWA service worker registration

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
	window.addEventListener('load', async () => {
		try {
			const registration = await navigator.serviceWorker.register('/service-worker.js', {
				scope: '/'
			});
			console.log('SW registered:', registration.scope);

			// Check for updates periodically
			setInterval(() => {
				registration.update();
			}, 60 * 60 * 1000); // Every hour
		} catch (error) {
			console.error('SW registration failed:', error);
		}
	});
}