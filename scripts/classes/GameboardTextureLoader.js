class GameboardTextureLoader extends TextureLoader {
    //Override
	async loadImageTexture(src) {
		const fetchResourceFunc = this._fetchResource ?
										this._fetchResource : 
										TextureLoader.fetchResource;
		const blob = await fetchResourceFunc(src);

		// Create the Image element
		const img = new Image();
		img.decoding = "async";
		img.loading = "eager";
	
		// Wait for the image to load
		return new Promise((resolve, reject) => {
		  // Create the texture on successful load
		  img.onload = () => {
			// Show warning if the image is too large
            if(img.naturalHeight > 4096 || img.naturalWidth > 4096){
                ui.notifications.error(`Image ${src} is too large to be loaded on Gameboard. Must be smaller than 4096x4096 px.`, {permanent: true});
            }

			URL.revokeObjectURL(img.src);
			img.height = img.naturalHeight;
			img.width = img.naturalWidth;

			const tex = PIXI.BaseTexture.from(img);
			this.setCache(src, tex);
			resolve(tex);
		  };
	
		  // Handle errors for valid URLs due to CORS
		  img.onerror = err => {
            console.log("Gameboard | Error");
			URL.revokeObjectURL(img.src);
			reject(err);
		  };
		  img.src = URL.createObjectURL(blob);
		});
	}
}


export default GameboardTextureLoader