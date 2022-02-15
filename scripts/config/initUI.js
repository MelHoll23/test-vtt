import { MODULE_NAME, TOKEN_MAP } from "./settings";

const gameboardUIStyle = `
#controls ol .scene-control, #controls ol .control-tool{
    width: 85px;
    height: 85px;
    font-size: 35px;
}

li.scene-control .fas, li.control-tool .fas, li.scene-control .far, li.control-tool .far{
    line-height: 2.5;
}

#controls ol.main-controls {
    width: 125px;
}

#sidebar {
    width: 500px;
}

#sidebar-tabs {
    --sidebar-tab-height: 40px;
    --sidebar-tab-width: 40px;
}

#sidebar-tabs > .item {
    font-size: 24px;
}

`;

export function initGameboardUI() {
    console.log('Gameboard | Initializing UI updates');

    //Add gameboard specific styles
    const style = $(`<style id='gameabord-styles' type='text/css'> ${gameboardUIStyle} </style>`);
    style.appendTo("head");

    //Add button to exit out of the app
    const exitButton = $(`<button><i class="fas fa-door-closed"></i> Exit</button>`);
        exitButton.on('click', function(){
        window.exitToGameboard()
    });
    $('#settings-access').append(exitButton);

    //Add button to remove pairings
    const removePairingButton = $(`<button><i class="fas fa-trash"></i> Remove Token Pairings</button>`);
    removePairingButton.on('click', function(){
        Dialog.prompt({
            title: "Are you sure?", 
            content: "Doing this will remove all pairings to physical tokens. You will need to pair again to use the tokens.", 
            label: "Remove Pairings", 
            callback: (data) => { 
                //Remove all paired tokens
                game.settings.set(MODULE_NAME, TOKEN_MAP, {});
                ui.notifications.info('Token pairings have been removed.');
            },
            rejectClose: false
        });
    });
    $('#settings-game').append(removePairingButton);

    //Make chat readonly
    $('#chat-controls').remove();
    $('#chat-form').remove();
}