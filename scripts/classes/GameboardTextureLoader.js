class GameboardTextureLoader extends TextureLoader {
    //Override
	async loadImageTexture(src) {
		//console.log("Gameboard | Override method", src);
		const blob = await this._fetchResource(src);
	
		// Create the Image element
		const img = new Image();
		img.decoding = "async";
		img.loading = "eager";
	
		// Wait for the image to load
		return new Promise((resolve, reject) => {
           console.log("Gameboard | Loading image", src);
	
		  // Create the texture on successful load
		  img.onload = () => {
            console.log("Gameboard | Image onload", 
                src, 
                img.naturalHeight, 
                img.naturalWidth, 
                img.height, 
                img.width, 
            );
            
            //Show warning if the image is too large
            if(img.naturalHeight > 4096 || img.naturalWidth > 4096){
                console.log("Gameboard | Show warning");
                ui.notifications.error(`Image ${src} is too large to be loaded on Gameboard. Must be smaller than 4096x4096 px.`, {permanent: true});
            }

			URL.revokeObjectURL(img.src);
			img.height = img.naturalHeight;
			img.width = img.naturalWidth;

			const tex = PIXI.BaseTexture.from(img);
            console.log("Gameboard | texture size", 
                src,
                tex.height, 
                tex.width,
                tex.valid
            );
			this.setCache(src, tex);
			resolve(tex);
		  };
	
		  // Handle errors for valid URLs due to CORS
		  img.onerror = err => {
            console.log("Gameboard | Error");
			URL.revokeObjectURL(img.src);
			reject(err);
		  }
		  img.src = URL.createObjectURL(blob);
		});
	  }
}


export default GameboardTextureLoader