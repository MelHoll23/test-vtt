
Hooks.once('init', function() {
	console.log("Init gameboard config settings");
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
		name: 'OnGameboard',
		hint: 'Maps actor ids to the shape id from the gameboard so tokens are paired with shapes', 
		default: {},
		type: Object,
		scope: 'world',
		config: false
	});

    //On Web, show warning for larger image sizes / downscale too large of images
    //On gameboard
    //change UI
    //init token pairing logic
    //change zoom level + disable zoom (match grid size)
});


Hooks.on("canvasInit", function() { 
	console.log("Apply fog of war fix");
    //Fix fog of war crash
    SightLayer.MAXIMUM_FOW_TEXTURE_SIZE = 4096 / 2;
});

var tokenMoveEventMap = {};

function onTokMessageReceived(tokMessage) {
	console.log(tokMessage);
	var actorMap = game.settings.get('gameboard', 'actorIdMap');

	var parsedTokMessage = JSON.parse(tokMessage)[0];//TODO handle array
	var actorId = actorMap[parsedTokMessage.typeId];

	console.log(actorId);
	//Check if token is paired already, if so move token to location on board
	if(actorId) {
		moveTokenToLocation(actorId, parsedTokMessage); 
	} else {
		pairToken(actorMap, parsedTokMessage);
	}
}

function moveTokenToLocation(actorId, tokMessage) {
 	//Move token (local vs pushing data)
	console.log("tok", tokMessage.positionX, tokMessage.positionY);

	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
	var rotation = ((tokMessage.angle + 3) * 60) % 360;

 	console.log("positions", positions.x, positions.y);
	console.log("rotation", tokMessage.angle, rotation)

	//canvas.grid.getSnappedPosition() //TODO snap after done moving for a while

	//TODO map tokens
	//"aI5BE5F5wS9M3V8n"
	canvas.scene.tokens.get(actorId).update({
		x: positions.x, 
		y: positions.y,
		rotation: rotation
	});
}

function calculateCanvasPosition(positionX, positionY){
	console.log("tok x/y", positionX, positionY);
	var viewPosition = canvas.scene._viewPosition;
	var scale = viewPosition.scale;

	var canvasViewWidth =  window.innerWidth * (1 + scale);
	var canvasViewHeight = window.innerHeight * (1 + scale);

	console.log("canvasWidth/canvasHeight:", canvasViewWidth, canvasViewHeight);

	var topX = viewPosition.x - canvasViewWidth/2; 
	var topY = viewPosition.y - canvasViewHeight/2; 

	console.log("topx/y", topX, topY);

	var distanceDiffX = positionX * canvasViewWidth;
	var distanceDiffY = positionY * canvasViewHeight;

	console.log("diff", distanceDiffX, distanceDiffY);

	actualPositionX = topX + distanceDiffX;
	actualPositionY = topY + distanceDiffY;

	console.log("x, y, scale, actualX, actualY", viewPosition.x, viewPosition.y, scale, actualPositionX, actualPositionY);
	return {x: actualPositionX, y: actualPositionY}
	//return canvas.grid.getSnappedPosition(actualPositionX, actualPositionY, 1);
}

function pairToken(actorMap, tokMessage) {
	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
	//If not paired, if actor is selected and not paired, pair
	//canvas.tokens.controlled
	console.log("trying to pair at", positions.x, positions.y);
	console.log(canvas.tokens.ownedTokens.length);
	canvas.tokens.ownedTokens.filter(owned => !Object.values(actorMap).includes(owned.data._id)).forEach((token) => {
		let tokenPosition = new PIXI.Rectangle(token.x, token.y, token.w, token.h);
		console.log(tokenPosition.x, tokenPosition.y);
		if(tokenPosition.contains(positions.x, positions.y)) {
			console.log("paired!", token.data._id);
			//pair token
			actorMap[tokMessage.typeId] = token.data._id;
			console.log("save actorMap", JSON.stringify(Object.values(actorMap)));
			game.settings.set("gameboard", "actorIdMap", actorMap);
		}
	});
	//If not paired and actor selected is paired, remove previous pairing and re-pair
}
