class GameboardTextureLoader extends TextureLoader {
    //Override
	async loadImageTexture(src) {
		console.log("Override method", src);
		const blob = await this._fetchResource(src);
	
		// Create the Image element
		const img = new Image();
		img.decoding = "async";
		img.loading = "eager";
	
		// Wait for the image to load
		return new Promise((resolve, reject) => {
	
		  // Create the texture on successful load
		  img.onload = () => {
			URL.revokeObjectURL(img.src);
			img.height = img.naturalHeight;
			img.width = img.naturalWidth;

            //Show warning if the image is too large
            if(img.height > 4096 || img.width > 4096){
                ui.notifications.error(`Image ${img.src} is too large to be loaded on Gameboard.`, {permanent: true});
            }

			const tex = PIXI.BaseTexture.from(img);
			this.setCache(src, tex);
			resolve(tex);
		  };
	
		  // Handle errors for valid URLs due to CORS
		  img.onerror = err => {
			URL.revokeObjectURL(img.src);
			reject(err);
		  }
		  img.src = URL.createObjectURL(blob);
		});
	  }
}


export default GameboardTextureLoader