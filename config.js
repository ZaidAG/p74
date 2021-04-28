import * as firebase from 'firebase'
import firestore from 'firebase/firestore'
//require('@firebase/firestore')
 const firebaseConfig = {
    apiKey: "AIzaSyDnbJZwKRYRhIIFrwv-s93D7ctphE__Zpw",
    authDomain: "wily-af8a7.firebaseapp.com",
    projectId: "wily-af8a7",
    storageBucket: "wily-af8a7.appspot.com",
    messagingSenderId: "578575871646",
    appId: "1:578575871646:web:8711e97468751e062e558f",
    measurementId: "G-50EF5GHECP"
  };
  // Initialize Firebase
  //if(!firebase.apps.length)
  firebase.initializeApp(firebaseConfig);
  export default firebase.database()