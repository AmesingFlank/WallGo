
export class GameConfig {
    public boardSize: number = 7;
    public numPlayers: number = 2;
    public stonesPerPlayer: number = 2;
}

export class StonePosition {
    constructor(public x: number, public y: number) { }
}

export class Stone {
    constructor(public player: number, public index: number, public position: StonePosition) {

    }

    public equals(other: Stone): boolean {
        return this.player === other.player && this.index === other.index && this.position.x === other.position.x && this.position.y === other.position.y;
    }
}

export enum GamePhase {
    PlacingStones,
    Moving,
    Over,
}

export enum WallDirection {
    Horizontal,
    Vertical,
}

export class Wall {
    constructor(public player: number, public direction: WallDirection, public x: number, public y: number) {

    }

    public equals(other: Wall): boolean {
        return this.player === other.player && this.direction === other.direction && this.x === other.x && this.y === other.y;
    }
}

class ReachableRegion {
    public cells: boolean[][];
    public size: number;
    constructor(public config: GameConfig) {
        this.cells = Array(this.config.boardSize).fill(null).map(() =>
            Array(this.config.boardSize).fill(false)
        );
        this.size = 0;
    }
}

export class GameResult {
    constructor(public winner: number, public regions: ReachableRegion[]) { }
}

export class WallGoGame {
    private config: GameConfig;

    private cells: (Stone | null)[][];
    private horizontalWalls: (Wall | null)[][];
    private verticalWalls: (Wall | null)[][];

    // stones for each player
    private stones: Stone[][];

    private currentPlayer: number;
    private remainingStepsAllowedForCurrentPlayer: number;
    private gamePhase: GamePhase;

    constructor(config: GameConfig) {
        this.config = config;
        this.cells = Array(this.config.boardSize).fill(null).map(() =>
            Array(this.config.boardSize).fill(null)
        );
        this.horizontalWalls = Array(this.config.boardSize + 1).fill(null).map(() =>
            Array(this.config.boardSize).fill(null)
        );
        this.verticalWalls = Array(this.config.boardSize).fill(null).map(() =>
            Array(this.config.boardSize + 1).fill(null)
        );
        this.stones = Array(this.config.numPlayers).fill(null).map(() =>
            []
        );
        this.currentPlayer = 0;
        this.gamePhase = GamePhase.PlacingStones;
        this.remainingStepsAllowedForCurrentPlayer = 2;
    }

    public getCurrentPlayer(): number {
        return this.currentPlayer;
    }

    public startNextPlayer(): void {
        this.currentPlayer = (this.currentPlayer + 1) % this.config.numPlayers;
        this.remainingStepsAllowedForCurrentPlayer = 2;
    }

    public getGamePhase(): GamePhase {
        return this.gamePhase;
    }

    public getCells(): (Stone | null)[][] {
        return this.cells;
    }

    public getHorizontalWalls(): (Wall | null)[][] {
        return this.horizontalWalls;
    }

    public getVerticalWalls(): (Wall | null)[][] {
        return this.verticalWalls;
    }

    public getStones(): Stone[][] {
        return this.stones;
    }

    public canPlaceStone(x: number, y: number): boolean {
        if (this.gamePhase !== GamePhase.PlacingStones) {
            return false;
        }
        if (this.cells[x][y] !== null) {
            return false;
        }
        return true;
    }

    private allPlayersPlacedStones(): boolean {
        return this.stones.every((stones) => stones.length === this.config.stonesPerPlayer);
    }

    public placeStone(x: number, y: number) {
        if (!this.canPlaceStone(x, y)) {
            throw new Error("Cannot place stone at this position");
        }
        let newStoneIndex = this.stones[this.currentPlayer].length;
        let newStone = new Stone(this.currentPlayer, newStoneIndex, new StonePosition(x, y));
        this.cells[x][y] = newStone;
        this.stones[this.currentPlayer].push(newStone);

        // if all players have placed their stones, switch to moving phase
        if (this.allPlayersPlacedStones()) {
            this.gamePhase = GamePhase.Moving;
        }

        this.startNextPlayer();
    }

    public getRemainingStepsAllowedForCurrentPlayer(): number {
        return this.remainingStepsAllowedForCurrentPlayer;
    }

    public getReachablePositionsInOneStep(position: StonePosition): StonePosition[] {
        // in 1 step, each stone can rech the cell to the left, right, up, or down, as long as there are no walls blocking
        let reachablePositionsOneStep: StonePosition[] = [];
        if (position.x > 0 && this.horizontalWalls[position.x][position.y] === null) {
            reachablePositionsOneStep.push(new StonePosition(position.x - 1, position.y));
        }
        if (position.x < this.config.boardSize - 1 && this.horizontalWalls[position.x + 1][position.y] === null) {
            reachablePositionsOneStep.push(new StonePosition(position.x + 1, position.y));
        }
        if (position.y > 0 && this.verticalWalls[position.x][position.y] === null) {
            reachablePositionsOneStep.push(new StonePosition(position.x, position.y - 1));
        }
        if (position.y < this.config.boardSize - 1 && this.verticalWalls[position.x][position.y + 1] === null) {
            reachablePositionsOneStep.push(new StonePosition(position.x, position.y + 1));
        }
        return reachablePositionsOneStep.filter((pos) => this.cells[pos.x][pos.y] === null);
    }

    public getReachableRegionForPlayer(player: number): ReachableRegion {
        let reachableRegion = new ReachableRegion(this.config);
        let visit = (pos: StonePosition) => {
            if (pos.x < 0 || pos.x >= this.config.boardSize || pos.y < 0 || pos.y >= this.config.boardSize) {
                return;
            }
            if (reachableRegion.cells[pos.x][pos.y]) {
                return;
            }
            reachableRegion.cells[pos.x][pos.y] = true;
            reachableRegion.size++;
            let reachablePositionsOneStep = this.getReachablePositionsInOneStep(pos);
            for (let pos of reachablePositionsOneStep) {
                visit(pos);
            }
        }
        for (let stone of this.stones[player]) {
            visit(stone.position);
        }
        return reachableRegion;
    }

    public canMoveStoneTo(stone: Stone, x: number, y: number): boolean {
        if (this.gamePhase !== GamePhase.Moving) {
            return false;
        }
        if(this.remainingStepsAllowedForCurrentPlayer  === 0){
            return false;   
        }
        let reachablePositions = this.getReachablePositionsInOneStep(stone.position);
        return reachablePositions.some((pos) => pos.x === x && pos.y === y);
    }


    private getPlacableWallForStone(stone: Stone): Wall[] {
        // after moving a stone, the player must place a wall in one of the 4 walls neighboring the new position of the stone.
        // there must not be an existing wall there
        let placableWalls: Wall[] = [];
        if (this.horizontalWalls[stone.position.x][stone.position.y] === null) {
            placableWalls.push(new Wall(stone.player, WallDirection.Horizontal, stone.position.x, stone.position.y));
        }
        if (this.horizontalWalls[stone.position.x][stone.position.y + 1] === null) {
            placableWalls.push(new Wall(stone.player, WallDirection.Horizontal, stone.position.x, stone.position.y + 1));
        }
        if (this.verticalWalls[stone.position.x][stone.position.y] === null) {
            placableWalls.push(new Wall(stone.player, WallDirection.Vertical, stone.position.x, stone.position.y));
        }
        if (this.verticalWalls[stone.position.x + 1][stone.position.y] === null) {
            placableWalls.push(new Wall(stone.player, WallDirection.Vertical, stone.position.x + 1, stone.position.y));
        }
        return placableWalls;
    }

    // returns available walls to place after moving a stone
    public moveStone(stone: Stone, x: number, y: number): Wall[] {
        if (!this.canMoveStoneTo(stone, x, y)) {
            throw new Error("Cannot move stone to this position");
        }
        if (stone.player !== this.currentPlayer) {
            throw new Error("It is not this player's turn");
        }
        this.cells[stone.position.x][stone.position.y] = null;
        stone.position.x = x;
        stone.position.y = y;
        this.cells[x][y] = stone;
        this.remainingStepsAllowedForCurrentPlayer--;
        return this.getPlacableWallForStone(stone);
    }

    public placeWallForStone(stone: Stone, wall: Wall): GameResult | null {
        if (stone.player !== this.currentPlayer) {
            throw new Error("It is not this player's turn");
        }
        if (!this.getPlacableWallForStone(stone).some((w) => w.equals(wall))) {
            throw new Error("Cannot place wall after moving stone");
        }
        if (wall.direction === WallDirection.Horizontal) {
            this.horizontalWalls[wall.x][wall.y] = wall;
        } else {
            this.verticalWalls[wall.x][wall.y] = wall;
        }
        this.startNextPlayer(); 
        let maybeResult = this.checkForGameCompletion();
        if(maybeResult) {
            this.gamePhase = GamePhase.Over;
        }
        return maybeResult;
    }

    public checkForGameCompletion(): GameResult | null {
        // a game is considered over if the walls divide the board into disconnected regions for each player
        let allPlayersReachableRegions: ReachableRegion[] = [];
        for (let player = 0; player < this.config.numPlayers; player++) {
            allPlayersReachableRegions.push(this.getReachableRegionForPlayer(player));
        }

        for(let x = 0; x < this.config.boardSize; x++) {
            for(let y = 0; y < this.config.boardSize; y++) {
                let foundFirstReachablePlayer = false;
                for(let player = 0; player < this.config.numPlayers; player++) {
                    if(foundFirstReachablePlayer){
                        // a stone is reachable by more than one player, the game is not over
                        return null;
                    }
                    if(allPlayersReachableRegions[player].cells[x][y]) {
                        foundFirstReachablePlayer = true;
                    }
                } 
            }
        }
        // find the player with the largest region
        let winner = 0;
        let maxRegionSize = allPlayersReachableRegions[0].size;
        for(let player = 1; player < this.config.numPlayers; player++) {
            if(allPlayersReachableRegions[player].size > maxRegionSize) {
                winner = player;
                maxRegionSize = allPlayersReachableRegions[player].size;
            }
        }
        return new GameResult(winner, allPlayersReachableRegions);
    }



    // TODO: Implement game logic methods
    // placeStone(row: number, col: number): boolean
    // getValidMoves(): [number, number][]
    // getCurrentPlayer(): number
    // switchPlayer(): void
    // isGameOver(): boolean
    // getWinner(): number | null
}
