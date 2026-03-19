import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAUi8c1YO35Sm3Y4In_JRr029nwMvmK8jA",
  authDomain: "feriacheck-1d1ee.firebaseapp.com",
  databaseURL: "https://feriacheck-1d1ee-default-rtdb.firebaseio.com",
  projectId: "feriacheck-1d1ee",
  storageBucket: "feriacheck-1d1ee.firebasestorage.app",
  messagingSenderId: "348441710361",
  appId: "1:348441710361:web:975fe4ae0493dd5d91bf88"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
