// Clear service worker and cache
// Run this in your browser console to clear all caches

// Clear service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      console.log("Unregistering service worker:", registration);
      registration.unregister();
    }
  });
}

// Clear all caches
if ("caches" in window) {
  caches.keys().then(function (names) {
    for (let name of names) {
      console.log("Deleting cache:", name);
      caches.delete(name);
    }
  });
}

// Clear local storage
localStorage.clear();
sessionStorage.clear();

console.log("All caches and service workers cleared!");
