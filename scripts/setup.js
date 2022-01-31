
Hooks.once('init', () => {
    // Register module settings.
	game.settings.register('gameboard', 'isOnGameboard', {
		name: 'OnGameboard',
		hint: 'True if the instance is running on a gameboard. False if running elsewhere.', 
		default: false,
		type: Boolean,
		scope: 'client',
		config: false
	});

    game.settings.register('gameboard', 'actorIdMap', {
		name: 'OnGameboard',
		hint: 'Maps actor ids to the shape id from the gameboard so tokens are paired with shapes', 
		default: {},
		type: Object,
		scope: 'world',
		config: false
	});

    //Check if on gameboard or on web
    //On Web, show warning for larger image sizes / downscale too large of images
    //On gameboard
    //change UI
    //init token pairing logic
    //change zoom level + disable zoom

});


Hooks.on("canvasInit", () => {
    //Fix fog of war crash
    SightLayer.MAXIMUM_FOW_TEXTURE_SIZE = 4096 / 2;
});

