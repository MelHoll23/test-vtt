import { registerHooks } from "./config/hooks.js";
import TokenMovementAdaptor from "./classes/MovementAdaptor.js";
import { throttle } from "./config/util.js"
import { MODULE_NAME } from "./config/settings.js"

registerHooks();

window.onTokMessageReceived = function(tokMessage) {
	var parsedTokMessages = JSON.parse(tokMessage);

	parsedTokMessages.forEach(parsedTokMessage => {
		if(window.useMovementAdaptor){ 
			var tokenMovementAdaptor = new TokenMovementAdaptor(parsedTokMessage);

			//Check if token is paired already, if so move token to location on board
			if(tokenMovementAdaptor.shouldMoveToken()) {
				tokenMovementAdaptor.moveTokenToLocation();
			} else {
				tokenMovementAdaptor.cleanupAndPairToken();
			}
		} else {
			var tokenMap = game.settings.get(MODULE_NAME, 'tokenIdMap');

			var tokenId = tokenMap[parsedTokMessage.typeId]; //"aI5BE5F5wS9M3V8n"

			//Check if token is paired already, if so move token to location on board
			if(tokenId && tokenIsPresent(tokenId)) {
				moveTokenToLocation(tokenId, parsedTokMessage);
			} else {
				removePairing(tokenMap, tokenId); //If the token isn't present, remove it?
				debouncedPairToken(tokenMap, parsedTokMessage);
			}
		}
	});

}


function saveMovement(actor, positions, rotation, snap = true) { 
	var snappedPosition = game.settings.get(MODULE_NAME, 'snapTokenToGrid') && snap ? 
							canvas.grid.getSnappedPosition(positions.x, positions.y, 1) : 
							positions;
	if(snap) console.log('debouncedSave', `${snappedPosition.x}, ${snappedPosition.y}`);
	if(!snap) console.log('throttleSave', `${snappedPosition.x}, ${snappedPosition.y}`)
	actor.update({
			x: snappedPosition.x, 
			y: snappedPosition.y,
			rotation: rotation
		}, {animate: false});
 }

var debouncedSaveMovement = foundry.utils.debounce(saveMovement, 500); 
		
var throttleSaveMovement = throttle(saveMovement, 1000);

function moveTokenToLocation(tokenId, tokMessage) {
 	//Move token (local vs pushing data)
	var actor = canvas.scene.tokens.get(tokenId);

	var positions = calculateCanvasPosition(tokMessage.positionX, tokMessage.positionY);
	var rotation = ((tokMessage.angle + 3) * 60) % 360;

	var tokenCenteredPositions = {x: positions.x - (actor._object.width/2), y: positions.y - (actor._object.height/2)};

	console.log('move to', `${tokenCenteredPositions.x}, ${tokenCenteredPositions.y}`);
	
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

	var actualPositionX = topX + distanceDiffX;
	var actualPositionY = topY + distanceDiffY;

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

