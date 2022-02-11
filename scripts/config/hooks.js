import GameboardTextureLoader from './classes/GameboardTextureLoader'
import { registerSettings } from './settings';

export function registerHooks() {
    Hooks.once('init', () => {
        registerSettings();
        
        //Set custom loader
        //Currently shows a warning when loading images that are too large for gameboard.
        TextureLoader.loader = new GameboardTextureLoader();

        //On gameboard
        //change UI
    });

    Hooks.once('setup', () => {
        if(window.isOnGameboard) {
            game.settings.set('core', 'fontSize', 9);
            game.settings.set('core', 'performanceMode', 'SETTINGS.PerformanceModeLow');

            //Don't throw any errors if they don't have touch-vtt
            try {
                game.settings.set('touch-vtt', 'gestureMode', 'split');
                game.settings.set('touch-vtt', 'directionalArrows', false);
                game.settings.set('touch-vtt', 'largeButtons', true);
            } catch{}
        }
    })

    Hooks.on("canvasInit", () => { 
        console.log("Apply fog of war fix");
        //Fix fog of war crash
        SightLayer.MAXIMUM_FOW_TEXTURE_SIZE = 4096 / 2;
    });

    Hooks.on("canvasReady", (canvas) => { 
        if(window.isOnGameboard) {
            //Override to prevent other actions from scaling
            canvas.pan = ({x=null, y=null, scale=null, forceScale = false}={}) => {  
                const constrained = canvas._constrainView({x, y, scale});
                const scaleChange = constrained.scale !== canvas.stage.scale.x;
            
                // Set the pivot point
                canvas.stage.pivot.set(constrained.x, constrained.y);

                // Set the zoom level
                if ( scaleChange && forceScale ) {
                    canvas.stage.scale.set(constrained.scale, constrained.scale);
                    canvas.updateBlur(constrained.scale);
                }
            
                // Update the scene tracked position
                canvas.scene._viewPosition = constrained;
            
                Hooks.callAll("canvasPan", canvas, constrained);
            
                // Align the HUD
                canvas.hud.align();
            }

            updateCanvasScale();
        }
    });

    function updateCanvasScale() {
        var squareSize = canvas.grid.w;
        var multiSquareWidth = squareSize*game.settings.get(MODULE_NAME, 'squaresNumber');

        var scale = window.innerWidth / multiSquareWidth;

        canvas.pan({scale: scale, forceScale: true});
    }
}