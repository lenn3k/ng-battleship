import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SocketService } from "src/app/services/socket.service";
import { Cell } from "../utils/interfaces";

@Component({
  selector: "app-game-player",
  templateUrl: "./game-player.component.html",
  styleUrls: ["./game-player.component.scss"],
})
export class GamePlayerComponent implements OnInit, OnDestroy {
  private _destroy = new Subject<void>();
  public destroy$ = this._destroy as Observable<void>;

  probGrid: Cell[][];

  gameState: "WAITING" | "PLACEMENT" | "COMBAT" | "GAMEOVER";

  playerGrid: Cell[][];
  enemyGrid: Cell[][];
  startCell: Cell;
  endCell: Cell;

  ships = [
    { type: "carrier", size: 5, placed: false },
    { type: "battleship", size: 4, placed: false },
    { type: "submarine", size: 3, placed: false },
    { type: "cruiser", size: 3, placed: false },
    { type: "destroyer", size: 2, placed: false },
  ];
  gameId: string;
  name: string;
  enemyName: any;
  playerReady: boolean = false;
  enemyReady: boolean = false;
  isHost: boolean = false;
  canFire: boolean = false;
  targetCell: Cell;

  public constructor(
    private _socketService: SocketService,
    private _route: ActivatedRoute
  ) {}

  public ngOnInit(): void {
    this._route.params.subscribe((params: Params) => {
      this.gameId = params["gameId"];
      this.name = params["name"];
    });

    this._socketService
      .onPlayerJoined()
      .pipe(takeUntil(this.destroy$))
      .subscribe((session) => {
        this.enemyName = session.players.filter((name) => name !== this.name);
        this.isHost = session.name.includes(this.name)
        if (this.enemyName) {
          this.gameState = "PLACEMENT";
          console.log("Placement has begun");
        }
      });

    this._socketService
      .onPlayerLeft()
      .pipe(takeUntil(this.destroy$))
      .subscribe((player) => {
        console.log(`${player} has left the game.`);
      });

    this._socketService
      .onReady()
      .pipe(takeUntil(this.destroy$))
      .subscribe((player) => {
        if (player === this.name) {
          this.playerReady = true;
        } else {
          this.enemyReady = true;
        }
        console.log(`${player} is done placing his ships.`);
        if (this.playerReady && this.enemyReady) {
          this.gameState = "COMBAT";
          if (this.isHost) this.canFire = true;
          console.log("Combat has begun!",this.canFire);
        }
      });

    this._socketService.onShot().pipe(takeUntil(this.destroy$)).subscribe(
      (data)=>{
        const {playerName,cellX,cellY} = data
        if(playerName!== this.name){
          console.log('handleShot',data)
          this.handleShot(cellX,cellY)
        }
      }
    );

    this._socketService.onShotResult().pipe(takeUntil(this.destroy$)).subscribe(
      (data) =>{
        const {playerName, result, shipType} = data;
        if(playerName!==this.name){
          console.log('shotResult',data)
          this.handleShotResponse(result,shipType)
        }
      }
    )
    this._socketService.onDestroyed().pipe(takeUntil(this.destroy$)).subscribe(
      (data) =>{
        const {playerName, shipType} = data;
        if(playerName!==this.name){
          console.log('onDestroyed',data)
          this.handleDestroyed(shipType)
        }
      }
    )

    this.gameState = "WAITING";
    this.enemyGrid = [];
    this.playerGrid = [];

    for (let y = 0; y < 10; y++) {
      if (!this.enemyGrid[y]) {
        this.playerGrid.push([]);
        this.enemyGrid.push([]);
      }
      for (let x = 0; x < 10; x++) {
        this.playerGrid[y].push({ x, y });
        this.enemyGrid[y].push({ x, y });
      }
    }
  }

  public ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this._socketService.leaveGame(this.gameId, this.name);
    this._destroy.next();
    this._destroy.complete();
  }

  public message(text: string): void {
    console.log("MESSAGE: " + text);
  }

  public startShipPlacement(cell: Cell): void {
    this.startCell = cell;
  }

  public endShipPlacement(cell: Cell): void {
    this.endCell = cell;
    const x1 = this.startCell.x;
    const y1 = this.startCell.y;
    const x2 = cell.x;
    const y2 = cell.y;
    // check for straight line
    if (x1 !== x2 && y1 !== y2) {
      return;
    }
    const xStart = Math.min(x1, x2);
    const yStart = Math.min(y1, y2);
    const dir = x1 < x2 ? "V" : x2 < x1 ? "V" : y1 < y2 ? "H" : "H";
    const length = Math.abs(x1 - x2) + Math.abs(y1 - y2) + 1;

    // calculate length of ship to place
    // check if ship is already placed
    const ship = this.ships.find(
      (s) => s.size === length && s.placed === false
    );
    if (ship) {
      // ship can be placed
      // get all cells
      const shipCells = [];
      switch (dir) {
        case "V":
          for (let n = xStart; n < xStart + length; n++) {
            shipCells.push(this.findCell(this.playerGrid, n, yStart));
          }
          break;

        case "H":
          for (let n = yStart; n < yStart + length; n++) {
            shipCells.push(this.findCell(this.playerGrid, xStart, n));
          }
          break;
        default:
          break;
      }

      const hasOverlap = shipCells.find((shipCell) => !!shipCell.type);
      if (!hasOverlap) {
        shipCells.forEach((shipCell) => {
          const gridCell = this.findCell(
            this.playerGrid,
            shipCell.x,
            shipCell.y
          );
          gridCell.type = ship.type;
        });
        ship.placed = true;
      }
      if (!this.ships.find((s) => !s.placed)) {
        this._socketService.sendReady(this.gameId, this.name);
        console.log("all ships placed");
      }
    }
  }

  /**
   * Method returns Cell from grid with input coordinates or Null when not found
   * @param grid Grid to scan for cell with coordinates x and y
   * @param x X coordinate of the cell
   * @param y Y coordinate of the cell
   */
  public findCell(grid: Cell[][], x: number, y: number): Cell {
    return grid
      .reduce((acc, curr) => acc.concat(curr), [])
      .find((cell) => cell.x === x && cell.y === y);
  }

  /**
   * Utility function to draw the ships
   * @param n Length of array
   */
  public array(n: number): unknown[] {
    return new Array(n);
  }

  /**
   * Handle player fire logic and trigger enemyFire
   * @param cell Cell to fire upon
   */
  public playerFire(cell: Cell): void {
    switch (this.gameState) {
      case "WAITING":
        this.message("Wait for an other player to join");
      case "PLACEMENT":
        this.message("Place your ships before firing!");
        break;
      case "COMBAT":
        if (cell.hit || cell.miss) {
          break;
        }
        if(this.canFire){
          this.fire(this.enemyGrid, cell);
        }
        break;
      case "GAMEOVER":
        this.message("The game is over!");
        break;
      default:
        break;
    }
  }

  /**
   * Handle all enemy fire logic
   */

  public fire(grid: Cell[][], cell: Cell): boolean {
    console.log('fire')
    // Find the target cell in the grid
    this.targetCell = this.findCell(grid, cell.x, cell.y);

    // If the cell has already been hit or missed, return false
    if (this.targetCell.hit || this.targetCell.miss) {
      return false;
    }

    this._socketService.sendShot(this.gameId, this.name, cell.x, cell.y);


  }


  public handleShot(cellX,cellY):void{
    console.log('handleShot')
    // Find the target cell in the grid
    const gridCell = this.findCell(this.playerGrid, cellX, cellY);
    this.canFire = true;

    // If the cell is a ship
    if (gridCell.type) {
      // Mark the cell as hit
      gridCell.hit = true;

      this._socketService.sendResult(this.gameId,this.name,'hit',gridCell.type)


      // Check if the ship is destroyed
      if (!this.playerGrid.flat().find((c) => c.type === gridCell.type && !c.hit)) {
        // If all cells of the same type have been hit, mark all as sunk and display message
        this.message(gridCell.type + " destroyed!");
        this._socketService.sendDestroyed(this.gameId,this.name,gridCell.type)
        this.playerGrid
          .flat()
          .filter((c) => c.type === gridCell.type && c.hit)
          .forEach((c) => {
            c.sunk = true;
          });
      }

      // Check if all ships have been destroyed
      if (!this.playerGrid.flat().find((c) => c.type && !c.hit)) {
        this.message("GAME OVER");
        this.gameState = "GAMEOVER";
        this._socketService.sendGameOver(this.gameId,this.name)
        this.canFire = false;
      }

    } else {
      // If the cell is not a ship, mark as miss
      this._socketService.sendResult(this.gameId,this.name,'miss',undefined)
      gridCell.miss = true;
    }
  }
  public handleShotResponse(result,type){
    this.canFire = false;
    if(result ==='miss'){
      this.targetCell.miss = true;
      return
    }

    this.targetCell.hit = true;
    this.targetCell.type = type;

  }

  public handleDestroyed(type){
    this.enemyGrid
          .flat()
          .filter((c) => c.type === type && c.hit)
          .forEach((c) => {
            c.sunk = true;
          });
  }
}
