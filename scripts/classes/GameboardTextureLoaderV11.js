class GameboardTextureLoaderV11 extends TextureLoader {
    //Override
    async loadImageTexture(src) {
        const asset = await PIXI.Assets.load(src);

        if(asset.orig.height >= 4096 || asset.orig.width >= 4096)
        {
            ui.notifications.error(`Image ${src} is too large to be loaded on Gameboard. Must be smaller than 4096x4096 px.`, {permanent: true});
        }

        this.setCache(src, asset);
        return asset;
    }
}

export default GameboardTextureLoaderV11