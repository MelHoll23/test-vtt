import { MODULE_NAME, SNAP_TO_GRID, TOKEN_MAP } from "../config/settings.js";
import { throttle } from "../config/util.js";

export default class TokenMovementAdaptor {
    constructor(tokMessage) {
        this.positionX = tokMessage.positionX;
        this.positionY = tokMessage.positionY;
        this.angle = tokMessage.angle;

        this.tokenMap = game.settings.get(MODULE_NAME, TOKEN_MAP);
        this.typeId = tokMessage.typeId;
        
        this.tokenId = this.tokenMap[this.typeId];
    }

    shouldMoveToken() {
        return this.tokenId && this.tokenIsPresent()
    }
    
    tokenIsPresent() {
        if(game.release.generation < 10) { 
            return canvas.tokens.ownedTokens.map(owned => owned.data._id).includes(this.tokenId);
        } else {
            return canvas.tokens.ownedTokens.map(owned => owned.id).includes(this.tokenId);
        }
    }
        
    moveTokenToLocation() {
        //Move token (local vs pushing data)
        var actor = canvas.scene.tokens.get(this.tokenId);
        actor._object.control({releaseOthers: false});

        var positions = this.calculateCanvasPosition(this.positionX, this.positionY);
        var rotation = ((this.angle + 3) * 60) % 360;

        var tokenCenteredPositions = {x: positions.x - (actor._object.width/2), y: positions.y - (actor._object.height/2)};

        if(game.release.generation >= 10){
            tokenCenteredPositions = {x: positions.x - (actor._object.hitArea.width/2), y: positions.y - (actor._object.hitArea.height/2)};
        }
        
        console.log('Gameboard | Move to', `${tokenCenteredPositions.x}, ${tokenCenteredPositions.y}`);

        if(game.release.generation < 10) { 
            actor._object.setPosition(tokenCenteredPositions.x, tokenCenteredPositions.y, {recenter: false});

            actor.data.update({
                rotation: rotation
            });
            actor._object.updateSource(); //Updates local vision with rotation (token not rotated until saveMovement)

            //Send movements to backend on occasion
            throttleSaveMovement(actor, tokenCenteredPositions, rotation, false);
        } else if(game.release.generation === 10){
            smallThrottleSaveMovement(actor, tokenCenteredPositions, rotation, false);
        } else {
            const update = {x: tokenCenteredPositions.x, y: tokenCenteredPositions.y, rotation: rotation};
            actor.updateSource(update); // Update token data locally

            // Update vision and lighting attributes
            actor.object.refreshSource();
            actor.object.renderFlags.set({refreshPosition: true});

            throttleSaveMovement(actor, tokenCenteredPositions, rotation, false);
        }

        //Snap and save after not moving for a while
        debouncedSaveMovement(actor, tokenCenteredPositions, rotation);
    }

    cleanupAndPairToken() {
        this.removePairing();
        this.throttlePairToken();
    }

    removePairing() {
        delete this.tokenMap[Object.keys(this.tokenMap)
            .find(key => this.tokenMap[key] === this.tokenId)]
    }

    calculateCanvasPosition() {
        var viewPosition = canvas.scene._viewPosition;
        var scale = viewPosition.scale;

        var canvasViewWidth =  window.innerWidth / scale;
	    var canvasViewHeight = window.innerHeight / scale;

        var topX = viewPosition.x - canvasViewWidth/2; 
        var topY = viewPosition.y - canvasViewHeight/2; 

        var distanceDiffX = this.positionX * canvasViewWidth;
        var distanceDiffY = this.positionY * canvasViewHeight;

        var actualPositionX = topX + distanceDiffX;
        var actualPositionY = topY + distanceDiffY;

        return {x: actualPositionX, y: actualPositionY}
    }

    throttlePairToken =  throttle(this.pairToken, 500);

    pairToken() {
        var positions = this.calculateCanvasPosition();
        //If not paired, if actor is selected and not paired, pair
        console.log('Gameboard | Trying to pair at ', positions.x, positions.y);

        if(game.release.generation <= 10) { 
            canvas.tokens.ownedTokens.filter(owned => !Object.values(this.tokenMap).includes(owned.data._id)).forEach((token) => {
                let tokenPosition = new PIXI.Rectangle(token.x, token.y, token.w, token.h);

                if(tokenPosition.contains(positions.x, positions.y)) {
                    //Unpair if needed
                    if(Object.values(this.tokenMap).includes(token.data._id)) {
                        this.removePairing(this.tokenMap, token.data._id);
                    }
                    //Pair token
                    this.tokenMap[this.typeId] = token.data._id;
                    game.settings.set(MODULE_NAME, TOKEN_MAP, this.tokenMap);
                    
                    ui.notifications.info(`Token '${token.data.name}' paired!`);
                }
            });
        } else {
            canvas.tokens.ownedTokens.filter(owned => !Object.values(this.tokenMap).includes(owned.id)).forEach((token) => {
                let tokenPosition = new PIXI.Rectangle(token.x, token.y, token.w, token.h);

                if(tokenPosition.contains(positions.x, positions.y)) {
                    //Unpair if needed
                    if(Object.values(this.tokenMap).includes(token.id)) {
                        this.removePairing(this.tokenMap, token.id);
                    }
                    //Pair token
                    this.tokenMap[this.typeId] = token.id;
                    game.settings.set(MODULE_NAME, TOKEN_MAP, this.tokenMap);
                    
                    ui.notifications.info(`Token '${token.name}' paired!`);
                }
            });
        }
    }

    static saveMovement(actor, positions, rotation, snap = true) { 
        var snappedPosition = game.settings.get(MODULE_NAME, SNAP_TO_GRID) && snap ? 
                                canvas.grid.getSnappedPosition(positions.x, positions.y, 1) : 
                                positions;

        var options = {
            animate: false, 
            recenter: false, 
            pan: false
        };
        var rotationAdjust = game.release.generation < 10 ? (Math.random()/10) : 0;

        if(game.release.generation === 11) {
            options.diff = false;
        }

        actor.update({
                x: snappedPosition.x, 
                y: snappedPosition.y,
                rotation: rotation + rotationAdjust// needed so the update pushed to the server?
            }, options);
    }
}

var debouncedSaveMovement = window.foundry.utils.debounce(TokenMovementAdaptor.saveMovement, 500);
var throttleSaveMovement = throttle(TokenMovementAdaptor.saveMovement, 1000);
var smallThrottleSaveMovement = throttle(TokenMovementAdaptor.saveMovement, 100);