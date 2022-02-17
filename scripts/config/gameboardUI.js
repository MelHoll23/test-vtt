import { MODULE_NAME, TOKEN_MAP } from "./settings.js";

const SIDEBAR_WIDTH = 850;
const OUTER_MARGIN = 50;
const BUTTON_HEIGHT = 80;

const generalUIStyles = `
:root {
    --form-field-height: 45px;
    --sidebar-item-height: ${BUTTON_HEIGHT}px;
}

#players, 
#logo,
#sidebar.collapsed #sidebar-tabs .item, 
#sidebar .action-buttons, 
#sidebar a.create-document, 
#sidebar a.create-folder, 
.window-header a[class^="header-button configure-"], 
.form-group.picker, 
#macro-directory {
    display: none !important;
}

#settings button {
    line-height: 45px;
}

#hotbar {
    height: ${BUTTON_HEIGHT + 2}px;
    --macro-size: ${BUTTON_HEIGHT}px;
    position: absolute;
    margin: ${OUTER_MARGIN}px;
    left: 0;
    bottom: 0;
}

#hotbar .bar-controls {
    flex: 0 0 ${BUTTON_HEIGHT}px;
}

#hotbar #hotbar-directory-controls a {
    line-height: ${BUTTON_HEIGHT}px;
    font-size: 40px;
}

#fps {
    right: 0;
    position: absolute;
}
`;

const leftControlStyles = `
#controls {
    margin: 130px ${OUTER_MARGIN}px;
}

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
    padding-left: 0;
}

#navigation {
    margin: ${OUTER_MARGIN}px;
    position: absolute;
    left: 0;
}

#navigation .nav-item {
    line-height: 55px;
    padding: 15px 8px;
    max-width: 280px;
    height: ${BUTTON_HEIGHT}px;
    text-overflow: ellipse;
    white-space: nowrap;
    overflow: hidden;
}

#navigation #nav-toggle {
    flex: 0 0 ${BUTTON_HEIGHT}px;
    height: ${BUTTON_HEIGHT}px;
    font-size: 36px;
}
`

const sidebarStyles = `
#sidebar {
    width: ${SIDEBAR_WIDTH}px;
    height: 50%;
    margin: ${OUTER_MARGIN}px;
}

#sidebar .collapse {
    height: ${BUTTON_HEIGHT}px;
}

#sidebar .collapse .fas {
    font-size: 40px;
    padding-top: 21px;
}

#sidebar-tabs {
    --sidebar-tab-height: ${BUTTON_HEIGHT}px;
    --sidebar-tab-width: 70px;
}

#sidebar-tabs > .item, #sidebar-tabs > .item i[class^=fa] {
    font-size: 36px;
    padding: 5px;
}

.header-search {
    font-size: 50px;
}

.header-search input{
    height: 60px;
}


li.folder > .folder-header {
    padding: 20px 6px;
}

#playlists h4 {
    height: 22px;
}

#playlists .global-control .playlist-header {
    padding: 20px 6px;
}

#playlists #global-volume li.sound {
    padding: 10px 0px;
}

#compendium li.compendium-pack{
    line-height: 40px
}

.directory .directory-list .directory-item h3, 
.directory .directory-list .directory-item h4 {
    font-size, 36px;
}
`;

const windowStyles = `
.window-app .window-header {
    font-size: 35px;
    flex: 0 0 60px;
    padding-top: 10px;
}

.window-app .window-header a.header-button {
    margin-left: 20px;
}

.window-app .window-header .window-title {
    padding-top: 5px;
}

.window-app {
    min-width: 50vw !important;
    min-height: 50vw  !important;
}

.window-app.dialog {
    min-width: 50vw !important;
    min-height: 14vw  !important;
}
`;

const characterSheetStyles = `
.dnd5e.sheet.actor .traits i.fas {
    font-size: 24px;
    padding: 5px;
}
.dnd5e.sheet .window-content {
    font-size: 20px;
}
`;

const gameboardUIStyle = generalUIStyles + leftControlStyles + sidebarStyles + windowStyles + characterSheetStyles;

export function initGameboardUI() {
    initStyleHooks();
    initGameboardStyles();
}

function initStyleHooks() {
    Hooks.on('collapseSceneNavigation', (scene, collapsed) => {
        if(collapsed) { 
            $('#controls').slideUp();
        } else {
            $('#controls').slideDown();
        }
    })

    Hooks.on('collapseSidebar', (sidebar, collapsed) => {
        sidebar.element.width(collapsed ?  BUTTON_HEIGHT : SIDEBAR_WIDTH);
    })

    Hooks.on('renderSettings', (settings, context, user) => { 
        modifySettingsMenu(context);
    })

    Hooks.on('renderChatLog', (chat, context) => {
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