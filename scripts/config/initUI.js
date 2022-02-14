const gameboardUIStyle = `
li.scene-control{
    width: 60px;
    height: 60px;
}

li.scene-control .fas{
    line-height: 2.5;
}

#controls ol.main-controls {
    width: 88px;
}
`;

export function initGameboardUI() {
    const style = document.createElement('style')
    style.setAttribute('id', 'gameboard-styles')
    document.head.append(style)

    style.innerHTML = gameboardUIStyle;
}