import { registerHooks } from "./config/hooks.js";
import TokenMovementAdaptor from "./classes/MovementAdaptor.js";
import { GameBoardListener } from "./classes/GameboardListener.js";

window.gameboardModuleEnabled = true;

console.log('Gameboard | ', window);
// if(window.isOnGameboard) {
// 	console.log('Gameboard | setup boardListener');
// 	window.boardListener = new GameBoardListener();
// 	console.log('Gameboard | run boardListener');
// 	window.boardListener.run();
// }

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

window.exitToGameboard = function(){
	if(Gameboard){
		Gameboard.exit();
	}
}


