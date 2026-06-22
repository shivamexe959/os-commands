import { db } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Ensure this matches the admin email
const ADMIN_EMAIL = "joshi.shivam12507@gmail.com";

/**
 * Saves or updates a user in the Firestore database.
 * @param {Object} user - The Firebase Auth user object
 * @param {string} collegeDomain - The domain of the user's email
 */
export async function saveUserToDatabase(user, collegeDomain) {
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        const role = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : "student";

        if (userSnap.exists()) {
            // User exists, update loginCount and lastLogin
            const data = userSnap.data();
            await updateDoc(userRef, {
                lastLogin: serverTimestamp(),
                loginCount: (data.loginCount || 0) + 1
            });
            console.log("Existing user updated in database.");
        } else {
            // New user, create document
            const userData = {
                uid: user.uid,
                name: user.displayName || "Unknown",
                email: user.email,
                photoURL: user.photoURL || "",
                collegeDomain: collegeDomain,
                firstLogin: serverTimestamp(),
                lastLogin: serverTimestamp(),
                loginCount: 1,
                role: role,
                semester: "", // Default empty
                branch: "",   // Default empty
                status: "active" // Default active
            };

            await setDoc(userRef, userData);
            console.log("New user created in database.");
        }
    } catch (error) {
        console.error("Error saving user to database: ", error);
        throw error;
    }
}
