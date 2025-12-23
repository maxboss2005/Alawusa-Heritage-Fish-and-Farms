import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDuxTHLfwiETTMO6Dx7YMehngZqWLgUlH0",
    authDomain: "alawusa-heritage-website.firebaseapp.com",
    projectId: "alawusa-heritage-website",
    storageBucket: "alawusa-heritage-website.firebasestorage.app",
    messagingSenderId: "857988164081",
    appId: "1:857988164081:web:ccac1200d344a8bd82bc50",
    measurementId: "G-TJQJMVVMZG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore();

// ------------------ CHECK AUTH STATE ------------------
// ------------------ CHECK AUTH STATE ------------------
onAuthStateChanged(auth, async (user) => {
    // Check if we're on the index page
    const currentPage = window.location.pathname;
    const isIndexPage = currentPage.includes('index.html') || 
                       currentPage === '/' || 
                       currentPage.endsWith('/') ||
                       currentPage.includes('dashboard');
    
    if (user) {
        // User is signed in
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();

                // Display user info - but only if elements exist
                const userNameElement = document.getElementById('userName');
                const userName2Element = document.getElementById('userName2');
                const userName3Element = document.getElementById('userName3');
                const userEmailElement = document.getElementById('userEmail');
                
                if (userNameElement) userNameElement.innerText = userData.name;
                if (userName2Element) userName2Element.innerText = userData.name;
                if (userName3Element) userName3Element.innerText = userData.name;
                if (userEmailElement) userEmailElement.innerText = user.email;

                // Save for other pages if needed
                localStorage.setItem("userName3", userData.name);
                localStorage.setItem("userEmail", user.email);

            } else {
                console.log("No user document found in Firestore!");
            }
        } catch (error) {
            console.error("Error fetching user document:", error);
        }
    } else {
        // No user is signed in
        console.log("No user logged in.");
        
        // Only redirect if we're NOT on the index page
        if (!isIndexPage) {
            console.log("Not on index page. Redirecting to login...");
            window.location.href = "account.html"; // login/register page
        } else {
            console.log("On index page - allowing access for non-logged-in users");
            // Index page should handle non-logged-in users with its own logic
        }
    }
});

// ------------------ LOGOUT ------------------
const logoutButton = document.getElementById('logoutButton');
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        localStorage.removeItem('userName3');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('loggedInUserId'); // optional, can remove if still used elsewhere
        window.location.href = "account.html"; // redirect to login/register
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

const logoutButtonOne = document.getElementById('logoutButtonOne');
logoutButtonOne.addEventListener('click', async () => {
    try {
        await signOut(auth);
        localStorage.removeItem('userName3');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('loggedInUserId'); // optional, can remove if still used elsewhere
        window.location.href = "account.html"; // redirect to login/register
    } catch (error) {
        console.error("Error signing out:", error);
    }
});
