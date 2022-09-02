import GameboardTextureLoader from '../classes/GameboardTextureLoader.js'
import { initGameboardUI } from './gameboardUI.js';
import { registerSettings, SQUARES_NUMBER } from './settings.js';
import { MODULE_NAME } from './settings.js';
import { overrideMethods } from './util.js';
import { GameBoardListener } from '../classes/GameboardListener.js';

export function registerHooks() {
    Hooks.once('init', () => {
        registerSettings();
        
        //Set custom loader
        //Currently shows a warning when loading images that are too large for gameboard.
        TextureLoader.loader = new GameboardTextureLoader();

        if(window.isOnGameboard) {
            //Add gameboard specific styles/buttons
            initGameboardUI()
            overrideMethods();

            console.log('Gameboard | setup boardListener');
            window.boardListener = new GameBoardListener();
            console.log('Gameboard | run boardListener');
            window.boardListener.run();
        }
    });

    Hooks.once('setup', () => {
        if(window.isOnGameboard) {
            game.settings.set('core', 'fontSize', 9);
            game.settings.set('core', 'performanceMode', 'SETTINGS.PerformanceModeLow');

            try {
                game.settings.set('touch-vtt', 'gestureMode', 'split');
                game.settings.set('touch-vtt', 'directionalArrows', false);
                game.settings.set('touch-vtt', 'largeButtons', true);
            } catch{
                ui.notifications.error('TouchVTT add on not detected. TouchVTT module is required for Gameboard. https://foundryvtt.com/packages/touch-vtt', {permanent: true});
            }
        }
    })

    Hooks.on('canvasInit', () => { 
        if(window.isOnGameboard) {
            console.log('Gameboard | Apply fog of war fix');
            //Fix fog of war crash
            if(SightLayer) SightLayer.MAXIMUM_FOW_TEXTURE_SIZE = 4096 / 2;
        }
    });

    Hooks.on('canvasReady', (canvas) => { 
        if(window.isOnGameboard) {
            //Override to prevent other actions from scaling
            const originalPan = canvas.pan.bind(canvas);

            canvas.pan = ({x=null, y=null, scale=null, forceScale = false}={}) => { 
                if((x == null || y == null) && !forceScale) return;
                if(!forceScale) {
                    originalPan({x, y, scale});
                } else {
                    originalPan({x, y, scale: canvas.stage.scale.x})
                }
            }
            
            updateCanvasScale();
        }
    });
    
    Hooks.on('changeSidebarTab', (options) => {
        if(window.isOnGameboard && options.tabName) {
            Gameboard.hideDrawers(options.tabName !== 'settings');
        }
    });

    Hooks.on('collapseSidebar', (options) => {
        if(window.isOnGameboard) {
           Gameboard.hideDrawers(options._tabs[0].active !== 'settings' || options._collapsed);
        }
    });

    var updateCanvasScale = function () {
        var squareSize = canvas.grid.w;
        var multiSquareWidth = squareSize*game.settings.get(MODULE_NAME, SQUARES_NUMBER);

        var scale = window.innerWidth / multiSquareWidth;

        canvas.pan({scale: scale, forceScale: true});
    }
}