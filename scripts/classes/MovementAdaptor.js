import { MODULE_NAME } from "../config/settings.js";
import { throttle } from "../config/util.js";

export default class TokenMovementAdaptor {
    constructor(tokMessage) {
        this.positionX = tokMessage.positionX;
        this.positionY = tokMessage.positionY;
        this.angle = tokMessage.angle;

        this.tokenMap = game.settings.get(MODULE_NAME, 'tokenIdMap');
        this.typeId = tokMessage.typeId;
        
        this.tokenId = this.tokenMap[this.typeId];
    }

    shouldMoveToken(){
        return this.tokenId && this.tokenIsPresent()
    }
    
    tokenIsPresent(){
        return canvas.tokens.ownedTokens.map(owned => owned.data._id).includes(this.tokenId)
    }
        
    moveTokenToLocation() {
        //Move token (local vs pushing data)
        var actor = canvas.scene.tokens.get(this.tokenId);

        var positions = this.calculateCanvasPosition(this.positionX, this.positionY);
        var rotation = ((this.angle + 3) * 60) % 360;

        var tokenCenteredPositions = {x: positions.x - (actor._object.width/2), y: positions.y - (actor._object.height/2)};

        actor._object.setPosition(tokenCenteredPositions.x, tokenCenteredPositions.y);
        actor.data.update({
            rotation: rotation
        });
        actor._object.updateSource(); //Updates local vision with rotation (token not rotated)

        //Send movements to backend on occasion
        this.throttleSaveMovement(actor, tokenCenteredPositions, rotation, false);
        //Snap and save after not moving for a while
        this.debouncedSaveMovement(actor, tokenCenteredPositions, rotation);
    }

    cleanupAndPairToken(){
        this.removePairing();
        this.debouncedPairToken();
    }

    removePairing(){
        delete this.tokenMap[Object.keys(this.tokenMap)
            .find(key => this.tokenMap[key] === this.tokenId)]
    }

    calculateCanvasPosition() {
        var viewPosition = canvas.scene._viewPosition;
        var scale = viewPosition.scale;

        var canvasViewWidth =  window.innerWidth / scale;
        var canvasViewHeight =  window.innerHeight / scale;

        var topX = viewPosition.x - canvasViewWidth/2; 
        var topY = viewPosition.y - canvasViewHeight/2; 

        var distanceDiffX = this.positionX * canvasViewWidth;
        var distanceDiffY = this.positionY * canvasViewHeight;

        var actualPositionX = topX + distanceDiffX;
        var actualPositionY = topY + distanceDiffY;

        return {x: actualPositionX, y: actualPositionY}
    }

    debouncedPairToken =  foundry.utils.debounce(this.pairToken, 500);

    pairToken() {
        var positions = this.calculateCanvasPosition();
        //If not paired, if actor is selected and not paired, pair
        console.log("Trying to pair at ", positions.x, positions.y);

        canvas.tokens.ownedTokens.filter(owned => !Object.values(this.tokenMap).includes(owned.data._id)).forEach((token) => {
            let tokenPosition = new PIXI.Rectangle(token.x, token.y, token.w, token.h);

            if(tokenPosition.contains(positions.x, positions.y)) {
                //Unpair if needed
                if(Object.values(this.tokenMap).includes(token.data._id)) {
                    this.removePairing(this.tokenMap, token.data._id);
                }
                //Pair token
                this.tokenMap[tokMessage.typeId] = token.data._id;
                game.settings.set(MODULE_NAME, "tokenIdMap", this.tokenMap);
                
                ui.notifications.info(`Token '${token.data.name}' paired!`);
            }
        });
    }

    saveMovement(actor, positions, rotation, snap = true) { 
        var snappedPosition = game.settings.get(MODULE_NAME, 'snapTokenToGrid') && snap ? 
                                canvas.grid.getSnappedPosition(positions.x, positions.y, 1) : 
                                positions;
                    
        actor.update({
                x: snappedPosition.x, 
                y: snappedPosition.y,
                rotation: rotation
            }, {animate: false});
    }

    debouncedSaveMovement = foundry.utils.debounce(this.saveMovement, 500); 
            
    throttleSaveMovement = throttle(this.saveMovement, 1000);
}