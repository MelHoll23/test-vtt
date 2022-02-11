import { registerHooks } from "./config/hooks";
import TokenMovementAdaptor from "./classes/MovementAdaptor";

registerHooks();

window.onTokMessageReceived = function(tokMessage) {
	var parsedTokMessages = JSON.parse(tokMessage);

	parsedTokMessages.forEach(parsedTokMessage => {
		var tokenMovementAdaptor = new TokenMovementAdaptor(tokMessage);

		//Check if token is paired already, if so move token to location on board
		if(tokenMovementAdaptor.shouldMoveToken()) {
			tokenMovementAdaptor.moveTokenToLocation();
		} else {
			tokenMovementAdaptor.cleanupAndPairToken();
		}
	});
}

