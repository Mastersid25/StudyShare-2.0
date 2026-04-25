StudyShare 🎓
The Ultimate Resource Hub for Mumbai University Engineering Students
StudyShare is a modern, community-driven web application designed to help engineering students under Mumbai University share and access academic resources. From lecture notes to previous year question papers and solutions, StudyShare organizes content by Year, Branch, and Subject to make studying efficient and collaborative.

✨ Key Features
Personalized Dashboard: Dynamic content based on the user's Year (FE to BE) and Branch (Comp, AIML, DS, EXTC, Civil, Mech).
Resource Categorization: Materials are sorted into 4 clear categories: Notes, Textbooks, Question Papers, and Paper Solutions.
Advanced Upload System: Supports various file types (PDF, Word, Images, ZIP) with real-time upload progress bars.
Smart Preview & Download: In-browser document previewing using Google Docs Viewer and secure blob-based downloading.
Community Gamification: Integrated upvoting system to highlight the most helpful resources.
Global Search: Instant search across the entire database for subjects or specific file titles.
Responsive UI: Clean, minimalist design inspired by Notion, built with Tailwind CSS for a seamless mobile and desktop experience.
🛠️ Tech Stack
Frontend: HTML5, Modern CSS (Tailwind CSS via CDN), Vanilla JavaScript (ES6+).
Backend-as-a-Service: Firebase v10
Authentication: Email/Password & Profile Management.
Firestore: NoSQL Database for metadata and user records.
Cloud Storage: Secure hosting for study materials.
Icons & Fonts: FontAwesome 6, Google Fonts (Inter).
📁 Project Structure
text

studyshare/
├── index.html          # Landing, Login, and Signup page
├── explore.html        # Year/Branch selection & Subject directory
├── subject.html        # Resource hub (Notes, Papers, etc.) for a specific subject
├── profile.html        # User profile management & personal upload history
├── css/
│   └── custom.css      # Custom animations and UI tweaks
├── js/
│   ├── firebase-config.js # Firebase initialization & Subject data mapping
│   ├── auth.js            # Authentication logic & session management
│   ├── explore.js         # Logic for rendering subject grids
│   ├── subject.js         # Logic for file uploads, previews, and upvoting
│   ├── profile.js         # Logic for user profile updates and file deletion
│   └── search.js          # Global search bar logic
├── cors.json           # Configuration for Firebase Storage CORS
└── README.md           # Project documentation
🚀 Getting Started
1. Prerequisites
A code editor (e.g., VS Code).
A local server (e.g., Live Server extension for VS Code).
Node.js installed (for Firebase CLI).
2. Firebase Console Setup
Create a new project at Firebase Console.
Authentication: Enable Email/Password provider.
Firestore: Create a database in Production Mode.
Storage: Enable Cloud Storage.
Web App: Register a new web app and copy the firebaseConfig object into js/firebase-config.js.
3. Configure CORS (Critical for Downloads)
To allow users to download and preview files from your local machine, you must set the Cross-Origin Resource Sharing (CORS) policy:

Install Firebase CLI: npm install -g firebase-tools.
Login: firebase login.
Locate your cors.json file in the project root.
Run the following command (replace with your bucket name found in Firebase Storage):
Bash

gsutil cors set cors.json gs://your-project-id.firebasestorage.app
4. Security Rules
Deploy these rules in your Firebase Console:

Firestore Rules:

JavaScript

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /materials/{materialId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uploaderId == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.uploaderId == request.auth.uid;
      match /votes/{voteId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
Storage Rules:

JavaScript

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // Allows previews via Google Docs Viewer
      allow write: if request.auth != null && request.resource.size < 50 * 1024 * 1024;
    }
  }
}
5. Running Locally
Clone the repository.
Open the folder in VS Code.
Right-click index.html and select Open with Live Server.
Register a test account and start exploring!
📈 Database Schema (Firestore)
users Collection:
uid, name, email, year, branch, createdAt
materials Collection:
title, description, fileURL, fileType, fileSize, year, branch, subject, category, uploaderId, uploaderName, upvotes, createdAt
votes (Sub-collection): userId mapped to timestamp.