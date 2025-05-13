// Import 1st Gen Firebase Functions for Auth Triggers
const functions = require("firebase-functions");

// Import 2nd Gen Firebase Functions for HTTP Triggers
const functionsV2 = require("firebase-functions/v2");

// Import Firebase Admin SDK
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();



// HTTP function using 2nd Gen syntax
// exports.helloWorld = functionsV2.https.onRequest((req, res) => {
//      res.send("Hello from Firebase!")
//  });

// Auth trigger using 1st Gen syntax
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        // Log the new user's UID and email
        console.log(`New user created: UID=${user.uid}, Email=${user.email}`);

                // Randomly select between two profile images
        const profileImages = [
            "https://firebasestorage.googleapis.com/v0/b/actual-backend-app-e626b.firebasestorage.app/o/defaultprofile%2Ffemale.jpg?alt=media&token=22056dbe-5154-4fc9-af60-90cbd3917b92",
            "https://firebasestorage.googleapis.com/v0/b/actual-backend-app-e626b.firebasestorage.app/o/defaultprofile%2Fmale.png?alt=media&token=d8e3d25d-383d-4ef6-b79c-24542d21fe2e"
        ];
        const randomProfileImage = profileImages[Math.floor(Math.random() * profileImages.length)];
        // Store profileImage and userEmails directly in the user's document in the 'userProfile' field
        await admin.firestore().collection('users').doc(user.uid).set({
            userProfile: {
                profileImage: randomProfileImage,
                userEmail: user.email
            }
        }, { merge: true }); // Use merge to avoid overwriting existing fields, if any

        // If you have additional logic, add it here

    } catch (error) {
        console.error('Error handling new user creation:', error);
    }
});

