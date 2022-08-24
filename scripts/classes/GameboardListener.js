import { ClientFactory } from "@lastgameboard/boardservice-client";

export class GameBoardListener {
    userPresences = {};
    boardClient;
    startTime;

    async run() {
        const boardId = Gameboard.getBoardId();
        const url = window.Gameboard?.getBoardServiceWebSocketUrl();
        if (boardId === undefined || url === undefined) {
            if (boardId !== undefined) console.error("COULD NOT CONNECT TO GB WS");
            return;
        }
        console.log(`gameBoardClient connecting boardId=${boardId} url=${url}`);

        this.boardClient = ClientFactory.createSocketGameBoardClientWithRetries(url, boardId, 2).withGameBoardListener(
            this,
        );

        try {
            await this.boardClient.connectionManager.connect();
        } catch (e) {
            console.log(JSON.stringify(e));
        }
        console.log(`gameBoardClient connected`);
    }

    getUserPresence() {
        return this.boardClient?.getUserPresence() || null;
    }

    gameSessionStart() {
        window.GameboardAnalytics?.sendEvent(
            "GAME_SESSION_STARTED",
            JSON.stringify({ userIds: Object.keys(this.userPresences) }),
        );
        this.startTime = performance.now();
    }

    disconnect() {
        if (this.startTime === undefined) return;

        const playTime = performance.now() - this.startTime;
        window.GameboardAnalytics?.sendEvent(
            "GAME_SESSION_ENDED",
            JSON.stringify({
                userIds: Object.keys(this.userPresences),
                secondsElapsed: playTime / 1000,
            }),
        );
    }

    onUserPresenceChange(userPresence) {}

    onDiceRolled(diceRolled) {}

    onCardButtonPressed(cardButtonPressed) {}

    onButtonPressed(buttonPressed) {}

    onCardPlayed(cardPlayed) {}

    onFetchAsset(assetId) {}
}
