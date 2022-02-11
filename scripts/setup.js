import { registerHooks } from "./config/hooks.js";
import TokenMovementAdaptor from "./classes/MovementAdaptor.js";

registerHooks();

window.onTokMessageReceived = function(tokMessage) {
	var parsedTokMessages = JSON.parse(tokMessage);

	parsedTokMessages.forEach(parsedTokMessage => {
		var tokenMovementAdaptor = new TokenMovementAdaptor(parsedTokMessage);

		//Check if token is paired already, if so move token to location on board
		if(tokenMovementAdaptor.shouldMoveToken()) {
			tokenMovementAdaptor.moveTokenToLocation();
		} else {
			tokenMovementAdaptor.cleanupAndPairToken();
		}
	});

}


