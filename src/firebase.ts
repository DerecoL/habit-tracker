import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyBi_GH3RspP0rhBFmtzshxEAVUP4YxLxsE',
  authDomain: 'habit-tracker-90ac2.firebaseapp.com',
  databaseURL: 'https://habit-tracker-90ac2-default-rtdb.firebaseio.com',
  projectId: 'habit-tracker-90ac2',
  storageBucket: 'habit-tracker-90ac2.firebasestorage.app',
  messagingSenderId: '959394584248',
  appId: '1:959394584248:web:73d3e794e66e54652a464d',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const rtdb = getDatabase(app)
export const googleProvider = new GoogleAuthProvider()
