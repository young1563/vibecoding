// Firebase 설정
const firebaseConfig = {
    // TODO: Firebase 콘솔에서 설정값을 가져와서 입력하세요
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    databaseURL: "YOUR_DATABASE_URL",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화
var database;
if (typeof firebase !== 'undefined') {
    try {
        // Only initialize database if the URL is valid and not a placeholder
        const isValidUrl = firebaseConfig.databaseURL &&
            firebaseConfig.databaseURL.startsWith('https://') &&
            firebaseConfig.databaseURL !== "YOUR_DATABASE_URL";

        firebase.initializeApp(firebaseConfig);

        if (isValidUrl) {
            database = firebase.database();
        } else {
            console.warn("Firebase Database URL is not configured. Local fallback will be used.");
        }
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
} else {
    console.warn("Firebase SDK not loaded. Rankings will be disabled.");
}