import { ChangeType, ClientFactory } from "@lastgameboard/boardservice-client";

export class GameBoardListener {
    userPresences = {};
    boardClient;
    startTime;

    events = {
        GameSessionStarted: 'GAME_SESSION_STARTED', 
        GameSessionEnded: 'GAME_SESSION_ENDED'
    }

    async run() {
        const boardId = Gameboard.getBoardId();
        const url = window.Gameboard?.getBoardServiceWebSocketUrl();
        if (boardId === undefined || url === undefined) {
            if (boardId !== undefined) console.error("Gameboard | COULD NOT CONNECT TO GB WS");
            return;
        }
        console.log(`Gameboard | gameBoardClient connecting boardId=${boardId} url=${url}`);

        this.boardClient = ClientFactory.createSocketGameBoardClientWithRetries(url, boardId, 2).withGameBoardListener(
            this,
        );

        try {
            await this.boardClient.connectionManager.connect();
        } catch (e) {
            console.log('Gameboard | ' + JSON.stringify(e));
        }
        console.log(`Gameboard | gameBoardClient connected`);
        this.userPresences = await this.boardClient.getUserPresenceList();

        this.gameSessionStart();
    }

    gameSessionStart() {
        window.GameboardAnalytics?.sendEvent(
            this.events.GameSessionStarted,
            JSON.stringify({ userIds: Object.keys(this.userPresences) }),
        );
        this.startTime = performance.now();
    }

    disconnect() {
        if (this.startTime === undefined) return;

        const playTime = performance.now() - this.startTime;
        window.GameboardAnalytics?.sendEvent(
            this.events.GameSessionEnded,
            JSON.stringify({
                userIds: Object.keys(this.userPresences),
                secondsElapsed: playTime / 1000,
            }),
        );
    }

    onUserPresenceChange(userPresence) {
        console.log('Gameboard | user presence change', userPresence);
        if (userPresence.change == ChangeType.REMOVE) {
            const index = this.userPresences.map(x => x.userId).indexOf(userPresence.userId);
            delete this.userPresences[index];
        } else if(ChangeType.ADD) {
            this.userPresences.push(userPresence);
        }
    }

    onDiceRolled(diceRolled) {}

    onCardButtonPressed(cardButtonPressed) {}

    onButtonPressed(buttonPressed) {}

    onCardPlayed(cardPlayed) {}

    onFetchAsset(assetId) {}
}
