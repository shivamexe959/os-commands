// Firebase initialisation — uses config from appConfig.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth }      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { APP_CONFIG }   from '../../config/appConfig.js';

const app  = initializeApp(APP_CONFIG.firebase);
export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
