export const MODULE_NAME = 'gameboard-support';

export function registerSettings() {
    console.log("Init Gameboard config settings");

    // Register module settings.
    game.settings.register(MODULE_NAME, 'tokenIdMap', {
        name: 'TokenMap',
        hint: 'Maps token ids to the shape id from the gameboard so tokens are paired with shapes', 
        default: {},
        type: Object,
        scope: 'client',
        config: false,
        restricted: false,
    });

    game.settings.register(MODULE_NAME, 'snapTokenToGrid', {
        name: 'Snap token after movement',
        hint: 'After moving the token, the token will snap to the grid.', 
        default: true,
        type: Boolean,
        scope: 'client',
        config: true
    });

    game.settings.register(MODULE_NAME, 'squaresNumber', {
        name: 'Number of squares shown on screen',
        hint: 'Will set the gameboard view to show this number of squares on the screen.', 
        default: 16,
        type: Number,
        scope: 'client',
        config: true, 
        onChange: () => canvas.ready ? updateCanvasScale() : null
    });

    window.isGameboardModuleOn = true;
}