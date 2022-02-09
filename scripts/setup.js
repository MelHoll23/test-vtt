const MODULE_NAME= MODULE_NAME;

Hooks.once('init', () => {
	console.log("Init Gameboard config settings");
    // Register module settings.
	game.settings.register(MODULE_NAME, 'isOnGameboard', {
		name: 'OnGameboard',
		hint: 'True if the instance is running on a gameboard. False if running elsewhere.', 
		default: window.isOnGameboard || false,
		type: Boolean,
		scope: 'client',
		config: false
	});

    game.settings.register(MODULE_NAME, 'tokenIdMap', {
		name: 'TokenMap',
		hint: 'Maps token ids to the shape id from the gameboard so tokens are paired with shapes', 
		default: {},
		type: Object,
		scope: 'client',
		config: false,
		restricted: false,
	});

    game.settings.register(MODULE_NAME, 'snapTokenToGrid', {
		name: 'Snap token after movement',
		hint: 'After moving the token, the token will snap to the grid.', 
		default: true,
		type: Boolean,
		scope: 'client',
		config: true
	});

    //On Web, show warning for larger image sizes / downscale too large of images
    //On gameboard
    //change UI
    //change zoom level + disable zoom (match grid size)
});


Hooks.on("canvasInit", () => { 
	console.log("Apply fog of war fix");
    //Fix fog of war crash
    SightLayer.MAXIMUM_FOW_TEXTURE_SIZE = 4096 / 2;

	//TODO Calculate grid size and scale accordingly, disable zoom
	//canvas.grid.w
	//canvas.pan({scale: 1})
});

var debouncedSaveMovement = foundry.utils.debounce((actor, positions, rotation) => { 
	var snappedPosition = game.settings.get(MODULE_NAME, 'snapTokenToGrid') ? 
							canvas.grid.getSnappedPosition(positions.x, positions.y, 1) : 
							positions;
							
	actor.update({
			x: snappedPosition.x, 
			y: snappedPosition.y,
			rotation: rotation
		}, {animate: false});
 }, 500); 
		
function onTokMessageReceived(tokMessage) {
	//console.log(tokMessage);
	var tokenMap = game.settings.get(MODULE_NAME, 'tokenIdMap');

	var parsedTokMessages = JSON.parse(tokMessage);

	parsedTokMessages.forEach(parsedTokMessage => {
		var tokenId = tokenMap[parsedTokMessage.typeId]; //"aI5BE5F5wS9M3V8n"

		//Check if token is paired already, if so move token to location on board
		if(tokenId && tokenIsPresent(tokenId)) {
			moveTokenToLocation(tokenId, parsedTokMessage);
		} else {
			removePairing(tokenMap, tokenId); //If the token isn't present, remove it?
			pairToken(tokenMap, parsedTokMessage);
		}
	});
}

function moveTokenToLocation(tokenId, tokMessage) {
 	//Move token (local vs pushing data)
	var actor = canvas.scene.tokens.get(tokenId);

	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
	var rotation = ((tokMessage.angle + 3) * 60) % 360;

	var tokenCenteredPositions = {x: positions.x - (actor._object.width/2), y: positions.y - (actor._object.height/2)};

	//TODO Set temporary angle/position until saving the movement
	actor._object.rotation = tokMessage.angle;
	actor._object.setPosition(tokenCenteredPositions.x, tokenCenteredPositions.y);

	//Snap and save after not moving for a while
	debouncedSaveMovement(actor, tokenCenteredPositions, rotation);
}

function calculateCanvasPosition(positionX, positionY){
	var viewPosition = canvas.scene._viewPosition;
	var scale = viewPosition.scale;

	var isOnGameboard = game.settings.get(MODULE_NAME, "isOnGameboard");
	var canvasViewWidth =  (isOnGameboard ? 1920 : window.innerWidth) / scale;
	var canvasViewHeight = (isOnGameboard ? 1920 : window.innerHeight) / scale;

	var topX = viewPosition.x - canvasViewWidth/2; 
	var topY = viewPosition.y - canvasViewHeight/2; 

	var distanceDiffX = positionX * canvasViewWidth;
	var distanceDiffY = positionY * canvasViewHeight;

	actualPositionX = topX + distanceDiffX;
	actualPositionY = topY + distanceDiffY;

	// console.log("tok x/y", positionX, positionY);
	// console.log("viewPosition", JSON.stringify(viewPosition));
	// console.log("screen width", window.innerWidth);
	// console.log("canvasWidth/canvasHeight:", canvasViewWidth, canvasViewHeight);
	console.log("top x/y", topX, topY);
	// console.log("diff", distanceDiffX, distanceDiffY);
	console.log("actualX, actualY",  actualPositionX, actualPositionY);

	return {x: actualPositionX, y: actualPositionY}
}

function tokenIsPresent(tokenId){
	return canvas.tokens.ownedTokens.map(owned => owned._id).includes(tokenId)
}

function removePairing(tokenMap, tokenId){
	delete tokenMap[Object.keys(tokenMap).find(key => tokenMap[key] === tokenId)]
}

function pairToken(tokenMap, tokMessage) {
	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
	//If not paired, if actor is selected and not paired, pair
	console.log("Trying to pair at ", positions.x, positions.y);

	canvas.tokens.ownedTokens.filter(owned => !Object.values(tokenMap).includes(owned.data._id)).forEach((token) => {
		let tokenPosition = new PIXI.Rectangle(token.x, token.y, token.w, token.h);
		console.log(tokenPosition.x, tokenPosition.y);
		if(tokenPosition.contains(positions.x, positions.y)) {
			//Unpair if needed
			if(Object.values(tokenMap).includes(token.data._id)) {
				removePairing(tokenMap, token.data._id);
			}
			//Pair token
			tokenMap[tokMessage.typeId] = token.data._id;
			game.settings.set(MODULE_NAME, "tokenIdMap", tokenMap);
			
			ui.notifications.info(`Token ${token.data._id} paired!`);
		}
	});
}

function setGameSetting(id, value){
	var currentIsGMSetting = game.user.isGM;
	game.user.isGM = true;
	
	game.settings.set(MODULE_NAME, id, value);

	game.user.isGM = currentIsGMSetting;
}
