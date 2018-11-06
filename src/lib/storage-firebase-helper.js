/**
 * @file A helper that loads/stores assets from Firebase.
 * @author Julius Diaz Panoriñgan
 */

import nets from 'nets'

import ScratchStorage from 'scratch-storage'

import firebaseStorage from './firebase'

const Asset = ScratchStorage.Asset
const AssetType = ScratchStorage.AssetType

/**
 * Pulled from
 * https://github.com/LLK/scratch-storage/blob/19f4699ac49070958551348742308b0716090975/src/Helper.js
 * since the interface isn't exported.
 * @interface Helper
 * @classdesc Base class for asset load/save helpers.
 */
class Helper {
  constructor (parent) {
    this.parent = parent
  }

/**
 * Fetch an asset but don't process dependencies.
 * @param {AssetType} assetType - The type of asset to fetch.
 * @param {string} assetId - The ID of the asset to fetch: a project ID, MD5, etc.
 * @param {DataFormat} dataFormat - The file format / file extension of the asset to fetch: PNG, JPG, etc.
 * @return {Promise.<Asset>} A promise for the contents of the asset.
 */
  load (assetType, assetId, dataFormat) {
    return Promise.reject(new Error(`No asset of type ${assetType} for ID ${assetId} with format ${dataFormat}`))
  }
}

/**
 * @class {FirebaseHelper} FirebaseHelper
 * @classdesc An implementation of the Helper interface that loads/stores assets
 * (currently just graphical assets) from/to Cloud Storage for Firebase.
 * @exports FirebaseHelper
 */
class FirebaseHelper extends Helper {
  constructor (parent) {
    super(parent)
    this.firebaseStorage = firebaseStorage
  }

  /**
   * Fetches an asset from Cloud Firestore for Firebase, if possible. Aims to
   * mirror the implementation of WebHelper.load in scratch-storage as much as
   * possible, including the use of nets.
   * @function load
   * @param {AssetType} assetType - The type of asset to fetch.
   * @param {string} assetId - The ID of the asset to fetch: a project ID, MD5, etc.
   * @param {DataFormat} dataFormat - The file format / file extension of the asset to fetch: PNG, JPG, etc.
   * @return {Promise.<Asset>} A promise for the contents of the asset.
   */
  load (assetType, assetId, dataFormat) {
    // console.log("loading from cloud storage for firebase");
    const asset = new Asset(assetType, assetId, dataFormat)
    
    switch (assetType) {
      case AssetType.ImageBitmap:
      case AssetType.ImageVector:
        return this.firebaseStorage.ref().child(`${assetId}.${dataFormat}`)
          .getDownloadURL()
          .then(
            url => new Promise((resolve, reject) => {
              nets({method: 'get', url}, (err, resp, body) => {
                // body is a Buffer
                if (err || Math.floor(resp.statusCode / 100) !== 2) {
                  resolve(null)
                } else {
                  asset.setData(body, dataFormat)
                  resolve(asset)
                }
              })
            }),
            () => Promise.reject()
          )
      default:
        return Promise.resolve(null)
    }
  }

  /**
   * Stores an asset on Cloud Storage for Firebase. Currently, the returned
   * promise does not provide any status (beyond resolved/rejected), unlike
   * WebHelper.store in scratch-storage, which provides an HTTP response body.
   * @function store
   * @param {AssetType} assetType - The type of asset to store.
   * @param {string} assetId - The ID of the asset to store: a project ID, MD5, etc.
   * @param {DataFormat} dataFormat - The file format / file extension of the asset to store: PNG, JPG, etc.
   * @return {Promise} A promise indicating the success of the attempted
   * storage.
   */
  store (assetType, dataFormat, data, assetId) {
    switch (assetType) {
      case AssetType.ImageBitmap:
      case AssetType.ImageVector:
        return new Promise((resolve, reject) => {
          const uploadTask = this.firebaseStorage.ref().child(`${assetId}.${dataFormat}`)
            .put(data)
          uploadTask.on('state_changed', {
            // next: () => {
            //   console.log("upload uploading")
            // },
            error: error => {
              // console.log("error on firebase upload")
              reject(error)
            },
            complete: () => {
              // console.log("completed firebase upload")
              resolve()
            }
          })
        })
      default:
        return Promise.reject()
    }
  }
}

export default FirebaseHelper
