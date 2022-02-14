const gameboardUIStyle = `
#controls ol .scene-control, #controls ol .control-tool{
    width: 85px;
    height: 85px;
    font-size: 35px;
}

li.scene-control .fas, li.control-tool .fas{
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
    console.log('Gameboard | Initializing larger UI');

    const style = $(`<style id='gameabord-styles' type='text/css'> ${gameboardUIStyle} </style>`);
    style.appendTo("head");

    const exitButton = $(`<button data-action="setup">
        <i class="fas fa-door-closed"></i> Exit to Gameboard
    </button>`);
    
    exitButton.on('click', function(){
        window.exitToGameboard()
    });

    $('#settings-access').append(exitButton);
}