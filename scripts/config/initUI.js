const gameboardUIStyle = `
#controls ol .scene-control, #controls ol .control-tool{
    width: 60px;
    height: 60px;
}

li.scene-control .fas, li.control-tool .fas{
    line-height: 2.5;
}

#controls ol.main-controls {
    width: 88px;
}
`;

export function initGameboardUI() {
    const style = $(`<style id='gameabord-styles' type='text/css'> ${gameboardUIStyle} </style>`)
    style.appendTo("head");

    const exitButton = $(`<button data-action="setup">
        <i class="fas fa-door-closed"></i> Exit to Gameboard
    </button>`)
    
    exitButton.on('click', function(){
        window.exitToGameboard()
    });

    $('#settings-access').append(exitButton);
}