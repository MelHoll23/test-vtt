const SIDEBAR_WIDTH = 700;

const gameboardUIStyle = `
#controls ol .scene-control, #controls ol .control-tool{
    width: 85px;
    height: 85px;
    font-size: 35px;
}

li.scene-control i[class^=fa], li.control-tool i[class^=fa]{
    line-height: 2.5;
}

#controls ol.main-controls {
    width: 125px;
}

#sidebar {
    width: ${SIDEBAR_WIDTH}px;
    height: 50%;
}

#sidebar .collapse .fas{
    font-size: 40px;
    padding-top: 21px;
}

#sidebar.collapsed #sidebar-tabs .item, #sidebar .action-buttons{
    display: none;
}

.header-search {
    font-size: 35px;
}

.header-search input{
    height: 40px;
}

#sidebar-tabs {
    --sidebar-tab-height: 60px;
    --sidebar-tab-width: 50px;
}

#sidebar-tabs > .item, #sidebar-tabs > .item i[class^=fa]{
    font-size: 36px;
    padding: 5px;
}

#settings button {
    line-height: 45px;
}

#hotbar {
    width: 700px;
    height: 82px;
    --macro-size: 80px;
}

.dnd5e.sheet.actor .traits i.fas {
    font-size: 24px;
    padding: 5px;
}
.dnd5e.sheet .window-content {
    font-size: 20px;
}

.window-app .window-header {
    font-size: 20px;
    flex: 0 0 30px;
}

.window-app .window-header a {
    margin: 0 0 0 20px;
}

`;

export function initGameboardUI() {
    initStyleHooks();
    initGameboardStyles();
}

function initStyleHooks() {
    Hooks.on('collapseSidebar', (sidebar, collapsed) => {
        sidebar.element.width(collapsed ? 80: SIDEBAR_WIDTH);
    })

    Hooks.on('renderSettings', (settings, context, user) => { 
        modifySettingsMenu(context);
    })

    Hooks.on('renderChatLog ', (chat, context) => {
        //Make chat readonly
        $('#chat-controls', context).remove();
        $('#chat-form', context).remove();
    })
}

function initGameboardStyles() {
    console.log('Gameboard | Initializing UI updates');

    //Add gameboard specific styles
    const style = $(`<style id='gameabord-styles' type='text/css'> ${gameboardUIStyle} </style>`);
    style.appendTo("head");
}

function modifySettingsMenu(context = window) {
    //Add button to exit out of the app
    const exitButton = $(`<button><i class="fas fa-door-closed"></i> Exit</button>`);
        exitButton.on('click', function(){
        window.exitToGameboard()
    });
    $('#settings-access', context).append(exitButton);

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
    $('#settings-game', context).append(removePairingButton);
}