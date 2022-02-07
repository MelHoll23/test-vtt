
Hooks.once('init', () => {
    // Register module settings.
	game.settings.register('gameboard', 'isOnGameboard', {
		name: 'OnGameboard',
		hint: 'True if the instance is running on a gameboard. False if running elsewhere.', 
		default: isOnGameboard,
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


Hooks.on("canvasInit", () => {
    //Fix fog of war crash
    SightLayer.MAXIMUM_FOW_TEXTURE_SIZE = 4096 / 2;
});

var tokenMoveEventMap = {};

function onTokMessageReceived(tokMessage) {
	console.log(tokMessage);
	//var actorMap = game && game.settings ? game.settings.get('gameboard', 'actorIdMap') : {}; 

	//var actorId = actorMap[tokMessage.typeId];

	//Check if token is paired already, if so move token to location on board
	//if(actorId) {
		moveTokenToLocation("testId", JSON.parse(tokMessage)[0]); //TODO fix return type to not be an array
	// } else {
	// 	pairToken(tokMessage);
	// }
}

function moveTokenToLocation(actorId, tokMessage) {
	// if(tokenMoveEventMap[actorId] == tokMessage.sessionId) {
	// 	console.log("mouseMove/up",window.innerWidth, tokMessage.positionX,
	// 	 window.innerHeight, tokMessage.positionY)
	// 	var evtMove = new MouseEvent("mousemove", {
	// 		view: window,
	// 		bubbles: true,
	// 		cancelable: true,
	// 		clientX: window.innerWidth * tokMessage.positionX,
	// 		clientY: window.innerHeight * tokMessage.positionY,
	// 	});
	// 	var evtUp = new MouseEvent("mouseUp", {
	// 		view: window,
	// 		bubbles: true,
	// 		cancelable: true,
	// 	});
	// 	$(document).dispatchEvent(evtMove);
	// 	$(document).dispatchEvent(evtUp);
	// } else {
	// 	console.log("mouseDown",window.innerWidth, tokMessage.positionX,
	// 	 window.innerHeight, tokMessage.positionY)
	// 	tokenMoveEventMap[actorId] = tokMessage.sessionId;
	// 	var evtDown = new MouseEvent("mousedown", {
	// 		view: window,
	// 		bubbles: true,
	// 		cancelable: true,
	// 		clientX: window.innerWidth * tokMessage.positionX,
	// 		clientY: window.innerHeight * tokMessage.positionY,
	// 	});
	// 	$(document).dispatchEvent(evtDown);
	// }

 	//Move token (local vs pushing data)
	 console.log("tok", tokMessage.positionX, tokMessage.positionY);

	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
 	console.log("positions", positions.x, positions.y);
	_token.setPosition(positions.x, positions.y);
	_token.rotate(((tokMessage.angle + 3) * 60) % 360);

	//TODO Push location to server
}

function calculateCanvasPosition(positionX, positionY){
	var viewPosition = canvas.scene._viewPosition;
	var scale = viewPosition.scale;

	var width =  window.innerWidth;
	var height = window.innerHeight;

	console.log("width/height:", width, height);

	canvas.scene._viewPosition.x + (window.innerWidth * (1 + scale))/2
	canvas.scene._viewPosition.y + (window.innerHeight * (1 + scale))/2

	var topX = viewPosition.x - (width * (1 + scale))/2; 
	var topY = viewPosition.y - (height * (1 + scale))/2; 

	var distanceDiffX = (positionX * window.innerWidth) * (1 + scale);
	var distanceDiffY = (positionY * window.innerHeight) * (1 + scale);

	console.log("diff", distanceDiffX, distanceDiffY);

	actualPositionX = topX + distanceDiffX;
	actualPositionY = topY + distanceDiffY;

	//TODO adjust for miniature token size (center instead of at top left corner)

	console.log("x, y, scale, actualX, actualY", viewPosition.x, viewPosition.y, scale, actualPositionX, actualPositionY);

	return {x: actualPositionX, y: actualPositionY}
}

function pairToken(tokMessage) {
	//If not paired, trigger click on canvas and if actor is selected and not paired, pair
	//If not paired and actor selected is paired, remove previous pairing and re-pair
}
