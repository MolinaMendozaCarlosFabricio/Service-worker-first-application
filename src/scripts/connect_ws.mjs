if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/ws.js')
            .then(reg => {
                console.log("[main] Service Worker registrado con scope:", reg.scope);
            })
            .catch(err => {
                console.error("[main] Error al registrar SW:", err);
            });
    });
}