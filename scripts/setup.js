Hooks.once('init', () => {
	console.log("Init Gameboard config settings");
    // Register module settings.
	game.settings.register('gameboard', 'isOnGameboard', {
		name: 'OnGameboard',
		hint: 'True if the instance is running on a gameboard. False if running elsewhere.', 
		default: window.isOnGameboard || false,
		type: Boolean,
		scope: 'client',
		config: false
	});

    game.settings.register('gameboard', 'actorIdMap', {
		name: 'ActorMap',
		hint: 'Maps actor ids to the shape id from the gameboard so tokens are paired with shapes', 
		default: {},
		type: Object,
		scope: 'world',
		config: false
	});

    game.settings.register('gameboard', 'snapTokenToGrid', {
		name: 'Snap token after movement',
		hint: 'After moving the token, the token will snap to the grid.', 
		default: true,
		type: Boolean,
		scope: 'world',
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
	var snappedPosition = game.settings.get('gameboard', 'snapTokenToGrid') ? 
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
	var actorMap = game.settings.get('gameboard', 'actorIdMap');

	var parsedTokMessage = JSON.parse(tokMessage)[0];//TODO handle array
	var actorId = actorMap[parsedTokMessage.typeId]; //"aI5BE5F5wS9M3V8n"

	//Check if token is paired already, if so move token to location on board
	if(actorId) {
		moveTokenToLocation(actorId, parsedTokMessage);
	} else {
		pairToken(actorMap, parsedTokMessage);
	}
}

function moveTokenToLocation(actorId, tokMessage) {
 	//Move token (local vs pushing data)
	var actor = canvas.scene.tokens.get(actorId);

	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
	var rotation = ((tokMessage.angle + 3) * 60) % 360;

	tokenCenter = actor._object.getCenter(positions.x, positions.y);

	//TODO Set temporary angle/position until saving the movement
	//actor._object.rotation = tokMessage.angle;
	// actor._object.setPosition(tokenCenter.x, tokenCenter.y, {animate: false});

	actor.update({
			x: tokenCenter.x, 
			y: tokenCenter.y,
			rotation: rotation
		}, {animate: false});
	
	//Snap and save after not moving for a while
	debouncedSaveMovement(actor, tokenCenter, rotation);
}

function calculateCanvasPosition(positionX, positionY){
	var viewPosition = canvas.scene._viewPosition;
	var scale = viewPosition.scale;

	var isOnGameboard = game.settings.get("gameboard", "isOnGameboard");
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

function pairToken(actorMap, tokMessage) {
	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
	//If not paired, if actor is selected and not paired, pair
	console.log("Trying to pair at ", positions.x, positions.y);

	canvas.tokens.ownedTokens.filter(owned => !Object.values(actorMap).includes(owned.data._id)).forEach((token) => {
		let tokenPosition = new PIXI.Rectangle(token.x, token.y, token.w, token.h);
		console.log(tokenPosition.x, tokenPosition.y);
		if(tokenPosition.contains(positions.x, positions.y)) {
			//Unpair if needed
			if(Object.values(actorMap).includes(token.data._id)){
				delete actorMap[Object.keys(actorMap).find(key => actorMap[key] === token.data._id)]
			}
			//Pair token
			actorMap[tokMessage.typeId] = token.data._id;
			game.settings.set("gameboard", "actorIdMap", actorMap);
			console.log("Paired!", token.data._id);
		}
	});
}
