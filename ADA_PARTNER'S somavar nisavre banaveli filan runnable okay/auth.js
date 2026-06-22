import { auth } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { saveUserToDatabase } from "./database.js";

// Array of allowed domains
const ALLOWED_DOMAINS = [];

// UI Elements
const loginOverlay = document.getElementById("firebase-login-overlay");
const loginBtn = document.getElementById("google-login-btn");
const loginErrorMsg = document.getElementById("login-error-message");
const userProfileContainer = document.getElementById("user-profile-container");

// User Info Elements
const userPhoto = document.getElementById("user-photo");
const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

const provider = new GoogleAuthProvider();

// Initialize Auth
export function initAuth() {
    if (!loginBtn) return; // Ensure elements exist before binding
    
    // Bind click events
    loginBtn.addEventListener("click", handleGoogleLogin);
    if(logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in.
            const emailDomain = user.email.split('@')[1];
            
            // Check domain again in case onAuthStateChanged fires for an invalid session
            if (ALLOWED_DOMAINS.length > 0 && !ALLOWED_DOMAINS.includes(emailDomain)) {
                await signOut(auth);
                showLoginScreen("Unauthorized domain. Please use a college email.");
                return;
            }

            // Valid user
            showMainApplication(user);
        } else {
            // No user is signed in.
            showLoginScreen();
        }
    });
}

/**
 * Handles the Google Sign-In process
 */
async function handleGoogleLogin() {
    try {
        loginErrorMsg.textContent = "Signing in...";
        loginErrorMsg.style.display = "block";
        loginErrorMsg.style.color = "var(--text-secondary)";

        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const emailDomain = user.email.split('@')[1];

        // Check if the domain is in the allowed list
        if (ALLOWED_DOMAINS.length > 0 && !ALLOWED_DOMAINS.includes(emailDomain)) {
            // Invalid domain, sign out immediately
            await signOut(auth);
            loginErrorMsg.textContent = "Access denied. Only @vvpedulink.ac.in emails are allowed.";
            loginErrorMsg.style.color = "var(--accent-red)";
            return;
        }

        // Domain is valid, save to database
        await saveUserToDatabase(user, emailDomain);
        
        loginErrorMsg.style.display = "none";
        
        // showMainApplication is handled by onAuthStateChanged, but we can do any setup here if needed
        console.log("Login successful!");
        
    } catch (error) {
        console.error("Login Error:", error);
        loginErrorMsg.textContent = error.message || "An error occurred during login. Please try again.";
        loginErrorMsg.style.color = "var(--accent-red)";
    }
}

/**
 * Handles user logout
 */
async function handleLogout() {
    try {
        await signOut(auth);
        console.log("Logged out successfully");
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

/**
 * Hides the login screen and updates the header profile
 */
function showMainApplication(user) {
    if (loginOverlay) {
        loginOverlay.style.display = "none";
    }
    
    if (userProfileContainer) {
        userProfileContainer.style.display = "flex";
        
        // Update user details in header
        if (userPhoto) userPhoto.src = user.photoURL || "https://via.placeholder.com/40";
        if (userName) userName.textContent = user.displayName || "Student";
        if (userEmail) userEmail.textContent = user.email;
    }
}

/**
 * Shows the login screen and hides the header profile
 */
function showLoginScreen(errorMessage = "") {
    if (loginOverlay) {
        loginOverlay.style.display = "flex";
    }
    
    if (userProfileContainer) {
        userProfileContainer.style.display = "none";
    }
    
    if (errorMessage && loginErrorMsg) {
        loginErrorMsg.textContent = errorMessage;
        loginErrorMsg.style.display = "block";
        loginErrorMsg.style.color = "var(--accent-red)";
    } else if (loginErrorMsg) {
        loginErrorMsg.style.display = "none";
    }
}

// Automatically initialize auth when script loads
initAuth();
