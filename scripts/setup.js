
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
		moveTokenToLocation("testId", tokMessage);
	// } else {
	// 	pairToken(tokMessage);
	// }
}

function moveTokenToLocation(actorId, tokMessage) {
	if(tokenMoveEventMap[actorId] == tokMessage.sessionId) {
		console.log("mouseMove/up",window.innerWidth * tokMessage.xPosition,
		 window.innerWidth * tokMessage.yPosition)
		var evtMove = new MouseEvent("mousemove", {
			view: window,
			bubbles: true,
			cancelable: true,
			clientX: window.innerWidth * tokMessage.xPosition,
			clientY: window.innerWidth * tokMessage.yPosition,
		});
		var evtUp = new MouseEvent("mouseUp", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		$(document).dispatchEvent(evtMove);
		$(document).dispatchEvent(evtUp);
	} else {
		console.log("mouseDown",window.innerWidth * tokMessage.xPosition,
		 window.innerWidth * tokMessage.yPosition)
		tokenMoveEventMap[actorId] = tokMessage.sessionId;
		var evtDown = new MouseEvent("mousedown", {
			view: window,
			bubbles: true,
			cancelable: true,
			clientX: window.innerWidth * tokMessage.xPosition,
			clientY: window.innerWidth * tokMessage.yPosition,
		});
		$(document).dispatchEvent(evtDown);
	}

 	//Move token (local vs pushing data)

	// var canvasX = calculateCanvasPosition(tokMessage.xPosition); // TODO calculate location based on zoom/pan of canvas
	// var canvasY = tokMessage.yPosition; 

 	// _token.setPosition(canvasX, canvasY);
}

// function calculateCanvasPosition(position){
// 	var viewPosition = canvas.scene._viewPosition;
// 	var scale = viewPosition.scale;
// 	//Need to figure out visible canvas width to screen width?
// 	var width = canvas.dimensions.sceneWidth + canvas.dimensions.paddingX;
// 	var height = canvas.dimensions.sceneHeight + canvas.dimensions.paddingY;

// 	var topX = viewPosition.x - (width * (1 - scale)/2); 
// 	var topY = viewPosition.y - (height * (1 - scale)/2); 

// 	var bottomX = viewPosition.x + (width * (1 - scale)/2); 
// 	var bottomY = viewPosition.y + (height * (1 - scale)/2); 
// }

function pairToken(tokMessage) {
	//If not paired, trigger click on canvas and if actor is selected and not paired, pair
	//If not paired and actor selected is paired, remove previous pairing and re-pair
}
