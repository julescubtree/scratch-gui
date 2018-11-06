/**
 * @file Provides Firebase functionality to be used with/by storage.
 * @author Julius Diaz Panoriñgan
 */

import firebase from 'firebase/app'
import 'firebase/storage'

const config = {
  apiKey: 'AIzaSyBOk85Sqxim1pI7OMZWaWsEkOXBkfazcX8',
  authDomain: 'windy-access-221123.firebaseapp.com',
  databaseURL: 'https://windy-access-221123.firebaseio.com',
  projectId: 'windy-access-221123',
  storageBucket: 'jct-scratch-graphical-asset-sandbox',
  messagingSenderId: '933195205612'
}
/* const firebaseApp = */ firebase.initializeApp(config)

/**
 * The Firebase Storage instance to be exported.
 * @constant
 * @type {Object}
 * @exports firebaseStorage
 */
export const firebaseStorage = firebase.storage()

export default firebaseStorage
