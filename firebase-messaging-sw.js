importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBbOIXTr2Tvz1FvoTk5GZgP2jx24jpjlL4',
  authDomain: 'ceviches-y-cocteles-el-chava.firebaseapp.com',
  projectId: 'ceviches-y-cocteles-el-chava',
  storageBucket: 'ceviches-y-cocteles-el-chava.firebasestorage.app',
  messagingSenderId: '227568387475',
  appId: '1:227568387475:web:6ccd3e67e62d1bf4b0d466'
});

firebase.messaging();
