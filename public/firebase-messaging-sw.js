/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// Handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI',
  authDomain: 'elite-chiller-455712-c4.firebaseapp.com',
  projectId: 'elite-chiller-455712-c4',
  storageBucket: 'elite-chiller-455712-c4.firebasestorage.app',
  messagingSenderId: '7807661688',
  appId: '1:7807661688:web:5f96a5fe30b799f31d1f8d',
  measurementId: 'G-5KJJ3DD2G7'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const notificationTitle = payload.notification?.title ?? 'GigHub 通知';
  const notificationOptions = {
    body: payload.notification?.body ?? payload.data?.body,
    icon: payload.notification?.icon ?? '/assets/logo.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }

      return clients.openWindow('/');
    })
  );
});
