const MODULE_NAME = 'gameboard-support';

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

    game.settings.register(MODULE_NAME, 'squaresNumber', {
		name: 'Number of squares shown on screen',
		hint: 'Will set the gameboard view to show this number of squares on the screen.', 
		default: 16,
		type: Number,
		scope: 'client',
		config: true, 
		onChange: () => canvas.ready ? updateCanvasScale() : null
	});

    //On Web, show warning for larger image sizes / downscale too large of images
    //On gameboard
    //change UI
});

Hooks.once('setup', () => {
	game.settings.set('core', 'fontSize', 9);
	game.settings.set('core', 'performanceMode', 'SETTINGS.PerformanceModeLow');

	//Don't throw any errors if they don't have touch-vtt
	try {
		game.settings.set('touch-vtt', 'gestureMode', 'split');
		game.settings.set('touch-vtt', 'directionalArrows', false);
		game.settings.set('touch-vtt', 'largeButtons', true);
	} catch{}
})

function updateCanvasScale(){
	var squareSize = canvas.grid.w;
	var multiSquareWidth = squareSize*game.settings.get(MODULE_NAME, 'squaresNumber');

	var scale = window.innerWidth / multiSquareWidth;

	canvas.pan({scale: scale, forceScale: true});
}

Hooks.on("canvasInit", () => { 
	console.log("Apply fog of war fix");
    //Fix fog of war crash
    SightLayer.MAXIMUM_FOW_TEXTURE_SIZE = 4096 / 2;
});

Hooks.on("canvasReady", (canvas) => { 
	//Override to prevent other actions from scaling
	canvas.pan = ({x=null, y=null, scale=null, forceScale = false}={}) => {  
		const constrained = canvas._constrainView({x, y, scale});
		const scaleChange = constrained.scale !== canvas.stage.scale.x;
	   
		// Set the pivot point
		canvas.stage.pivot.set(constrained.x, constrained.y);

		 // Set the zoom level
		 if ( scaleChange && forceScale ) {
			canvas.stage.scale.set(constrained.scale, constrained.scale);
			canvas.updateBlur(constrained.scale);
		  }
	
		// Update the scene tracked position
		canvas.scene._viewPosition = constrained;
	
		Hooks.callAll("canvasPan", canvas, constrained);
	
		// Align the HUD
		canvas.hud.align();
	}

	updateCanvasScale();
});

function saveMovement(actor, positions, rotation, snap = true) { 
	var snappedPosition = game.settings.get(MODULE_NAME, 'snapTokenToGrid') && snap ? 
							canvas.grid.getSnappedPosition(positions.x, positions.y, 1) : 
							positions;
				
	console.log("saveRotation:", rotation);
	actor.update({
			x: snappedPosition.x, 
			y: snappedPosition.y,
			rotation: rotation
		}, {animate: false});
 }

var debouncedSaveMovement = foundry.utils.debounce(saveMovement, 500); 
		
var throttleSaveMovement = throttle(saveMovement, 1000);

function onTokMessageReceived(tokMessage) {
	var parsedTokMessages = JSON.parse(tokMessage);

	parsedTokMessages.forEach(parsedTokMessage => {
		var tokenMap = game.settings.get(MODULE_NAME, 'tokenIdMap');

		var tokenId = tokenMap[parsedTokMessage.typeId]; //"aI5BE5F5wS9M3V8n"

		//Check if token is paired already, if so move token to location on board
		if(tokenId && tokenIsPresent(tokenId)) {
			moveTokenToLocation(tokenId, parsedTokMessage);
		} else {
			removePairing(tokenMap, tokenId); //If the token isn't present, remove it?
			debouncedPairToken(tokenMap, parsedTokMessage);
		}
	});
}

function moveTokenToLocation(tokenId, tokMessage) {
 	//Move token (local vs pushing data)
	var actor = canvas.scene.tokens.get(tokenId);

	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
	var rotation = ((tokMessage.angle + 3) * 60) % 360;

	var tokenCenteredPositions = {x: positions.x - (actor._object.width/2), y: positions.y - (actor._object.height/2)};

	actor._object.setPosition(tokenCenteredPositions.x, tokenCenteredPositions.y);
	actor.data.update({
		rotation: rotation
	});
	actor._object.updateSource(); //Updates local vision with rotation (token not rotated)

	//Send movements to backend on occasion
	throttleSaveMovement(actor, tokenCenteredPositions, rotation, false);
	//Snap and save after not moving for a while
	debouncedSaveMovement(actor, tokenCenteredPositions, rotation);
}

function calculateCanvasPosition(positionX, positionY) {
	var viewPosition = canvas.scene._viewPosition;
	var scale = viewPosition.scale;

	var canvasViewWidth =  window.innerWidth / scale;
	var canvasViewHeight =  window.innerHeight / scale;

	var topX = viewPosition.x - canvasViewWidth/2; 
	var topY = viewPosition.y - canvasViewHeight/2; 

	var distanceDiffX = positionX * canvasViewWidth;
	var distanceDiffY = positionY * canvasViewHeight;

	actualPositionX = topX + distanceDiffX;
	actualPositionY = topY + distanceDiffY;

	return {x: actualPositionX, y: actualPositionY}
}

function tokenIsPresent(tokenId){
	return canvas.tokens.ownedTokens.map(owned => owned.data._id).includes(tokenId)
}

function removePairing(tokenMap, tokenId){
	delete tokenMap[Object.keys(tokenMap).find(key => tokenMap[key] === tokenId)]
}

var debouncedPairToken =  foundry.utils.debounce(pairToken, 500);

function pairToken(tokenMap, tokMessage) {
	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
	//If not paired, if actor is selected and not paired, pair
	console.log("Trying to pair at ", positions.x, positions.y);

	canvas.tokens.ownedTokens.filter(owned => !Object.values(tokenMap).includes(owned.data._id)).forEach((token) => {
		let tokenPosition = new PIXI.Rectangle(token.x, token.y, token.w, token.h);

		if(tokenPosition.contains(positions.x, positions.y)) {
			//Unpair if needed
			if(Object.values(tokenMap).includes(token.data._id)) {
				removePairing(tokenMap, token.data._id);
			}
			//Pair token
			tokenMap[tokMessage.typeId] = token.data._id;
			game.settings.set(MODULE_NAME, "tokenIdMap", tokenMap);
			
			ui.notifications.info(`Token '${token.data.name}' paired!`);
		}
	});
}

function throttle (callback, limit) {
    var waiting = false;                      
    return function () {                      
        if (!waiting) {                       
            callback.apply(this, arguments);  
            waiting = true;                   
            setTimeout(function () {          
                waiting = false;              
            }, limit);
        }
    }
}
