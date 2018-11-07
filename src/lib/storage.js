import ScratchStorage from 'scratch-storage';

import FirebaseHelper from './storage-firebase-helper';

import defaultProject from './default-project';

/**
 * Wrapper for ScratchStorage which adds default web sources.
 * @todo make this more configurable
 */
class Storage extends ScratchStorage {
    constructor () {
        super();

        /**
         * A FirebaseHelper that is added to the helpers. Note that it is
         * currently accessible as a named member (as opposed to an anonymouse
         * new FirebaseHelper() passed to addHelper() because 
         * ScratchStorage.store() does not currently iterate over the helpers
         * when attempting storage; store() here is overridden to manually use
         * this.firebaseHelper.
         * @member {FirebaseHelper} firebaseHelper
         */
        this.firebaseHelper = new FirebaseHelper(this);
        this.addHelper(this.firebaseHelper, 101);

        this.cacheDefaultProject();
        this.addWebStore(
            [this.AssetType.Project],
            this.getProjectGetConfig.bind(this),
            this.getProjectCreateConfig.bind(this),
            this.getProjectUpdateConfig.bind(this)
        );

        /* //
        // formerly used to get Cloud Storage assets via XML API and not Firebase
        this.addWebStore(
            [this.AssetType.ImageVector, this.AssetType.ImageBitmap],
            this.getGraphicalAssetGetConfig.bind(this)
        );
        // */

        /*
        Although the FirebaseHelper grabs things from the Cloud Storage server,
        we add another webstore as a fallback for assets that we don't have.
        */
        this.addWebStore(
            [this.AssetType.ImageVector, this.AssetType.ImageBitmap],
            this.getAssetGetConfig.bind(this)
        );

        this.addWebStore(
            [this.AssetType.Sound],
            this.getAssetGetConfig.bind(this)
        );
        this.addWebStore(
            [this.AssetType.Sound],
            asset => `static/extension-assets/scratch3_music/${asset.assetId}.${asset.dataFormat}`
        );
    }
    setProjectHost (projectHost) {
        this.projectHost = projectHost;
    }
    getProjectGetConfig (projectAsset) {
        return `${this.projectHost}/internalapi/project/${projectAsset.assetId}/get/`;
    }
    getProjectCreateConfig () {
        return {
            url: `${this.projectHost}/`,
            withCredentials: true
        };
    }
    getProjectUpdateConfig (projectAsset) {
        return {
            url: `${this.projectHost}/${projectAsset.assetId}`,
            withCredentials: true
        };
    }
    setAssetHost (assetHost) {
        this.assetHost = assetHost;
    }
    /**
     * Given an asset, provides a configuration url string for an HTTP GET
     * request. Note that the URL is that used by the Google Cloud Storage
     * XML API, and not that generated by Cloud Storage for Firebase. Getting
     * that isn't quite the same since the relevant function returns a promise;
     * it might require widespread changes to function/module synchronicity.
     * 
     * @deprecated While functional, this is no longer used; FirestoreHelper
     * has taken over this functionality.
     * 
     * @function getGraphicalAssetGetConfig
     * @param {Asset} asset An asset that can be fetched
     * @returns {string} A url from which the asset can be fetched
     */
    getGraphicalAssetGetConfig (asset) {
        // old URL for assets.scratch.mit.edu
        // return `${this.assetHost}/internalapi/asset/${asset.assetId}.${asset.dataFormat}/get/`;
        
        return `https://storage.googleapis.com/jct-scratch-graphical-asset-sandbox/${asset.assetId}.${asset.dataFormat}`;
        
        // this would require this and other functions to be async
        // return await firebaseStorage.child(`${asset.assetId}.${asset.dataFormat}`).getDownloadURL();
    }
    getAssetGetConfig (asset) {
        return `${this.assetHost}/internalapi/asset/${asset.assetId}.${asset.dataFormat}/get/`;
    }
    setTranslatorFunction (translator) {
        this.translator = translator;
        this.cacheDefaultProject();
    }
    cacheDefaultProject () {
        const defaultProjectAssets = defaultProject(this.translator);
        defaultProjectAssets.forEach(asset => this.builtinHelper._store(
            this.AssetType[asset.assetType],
            this.DataFormat[asset.dataFormat],
            asset.data,
            asset.id
        ));
    }

    /**
     * Stores a provided asset. For now, only attempts to store assets via
     * FirebaseHelper (and then BuiltinHelper on success). Utilizes the named
     * member firebaseHelper, roughly mirroring the process of
     * ScratchStorage.store(), which does the same with webHelper.
     * @function store
     * @param {AssetType} assetType - The type of asset to store.
     * @param {string} assetId - The ID of the asset to store: a project ID, MD5, etc.
     * @param {DataFormat} dataFormat - The file format / file extension of the asset to store: PNG, JPG, etc.
     * @return {Promise} A promise indicating the success of the attempted
     * storage.
     */
    store (assetType, dataFormat, data, assetId) {
        dataFormat = dataFormat || assetType.runtimeFormat;

        /* //
        // promise originally returned by ScratchStorage
        return new Promise(
            (resolve, reject) =>
                this.webHelper.store(assetType, dataFormat, data, assetId)
                    .then(body => {
                        this.builtinHelper._store(assetType, dataFormat, data, body.id);
                        return resolve(body);
                    })
                    .catch(error => reject(error))
        );
        // */

        return this.firebaseHelper.store(assetType, dataFormat, data, assetId)
            .then(() => {
                this.builtinHelper._store(assetType, dataFormat, data, assetId);
                return Promise.resolve(assetId);
            })
            .catch(error => Promise.reject(error));
    }
}

const storage = new Storage();

export default storage;
