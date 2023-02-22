import { Component, OnInit } from '@angular/core';
import { Cell, copy, Enemy } from '../utils/interfaces';



@Component({
  selector: 'app-game-ai',
  templateUrl: './game-ai.component.html',
  styleUrls: ['./game-ai.component.scss'],
})
export class GameAiComponent implements OnInit {
  probGrid: Cell[][];

  gameState: 'PLACEMENT' | 'COMBAT' | 'GAMEOVER';

  playerGrid: Cell[][];
  enemyGrid: Cell[][];
  startCell: Cell;
  endCell: Cell;

  enemy: Enemy;

  ships = [
    { type: 'carrier', size: 5, placed: false },
    { type: 'battleship', size: 4, placed: false },
    { type: 'submarine', size: 3, placed: false },
    { type: 'cruiser', size: 3, placed: false },
    { type: 'destroyer', size: 2, placed: false },
  ];
  public ngOnInit(): void {
    this.gameState = 'PLACEMENT';
    this.enemyGrid = [];
    this.playerGrid = [];
    this.enemy = {
      targetStack: [],
      mode: 'HUNT',
      targetList: [],
    };

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

  public message(text: string): void {
    console.log('MESSAGE: ' + text);
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
    const dir = x1 < x2 ? 'V' : x2 < x1 ? 'V' : y1 < y2 ? 'H' : 'H';
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
      case 'V':
        for (let n = xStart; n < xStart + length; n++) {
          shipCells.push(this.findCell(this.playerGrid, n, yStart));
        }
        break;

      case 'H':
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
        console.log('all ships placed');
        this.placeEnemyShips();
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
  public playerFire(cell: Cell):void {
    switch (this.gameState) {
      case 'PLACEMENT':
        this.message('Place your ships before firing!');
        break;
      case 'COMBAT':
        if (cell.hit || cell.miss) {
          break;
        }
        this.fire(this.enemyGrid, cell);
        this.enemyFire();
        break;
      case 'GAMEOVER':
        this.message('The game is over!');
        break;
      default:
        break;
    }
  }
  /**
   * Handle all enemy fire logic
   */
  enemyFire() {
    this.calculateProbability(this.ships, this.playerGrid);

    const targetCells = this.probGrid
      .reduce((acc, curr) => acc.concat(curr), [])
      .filter(c => c.prob === 1);
    const targetCell = targetCells.pop();

    this.enemy.targetList.push(targetCell);

    this.fire(this.playerGrid, targetCell);
  }

  /**
   *  This method returns the surrounding cells of input cell on input grid
   * @param cell Center cell to find surrounding cells of
   * @param grid Grid needed for findCell method
   */
  private getSurroundingCells(cell: Cell, grid: Cell[][]): Cell[] {
    const list: Cell[] = [];
    const x = cell.x;
    const y = cell.y;

    list.push(this.findCell(grid, x - 1, y));
    list.push(this.findCell(grid, x + 1, y));
    list.push(this.findCell(grid, x, y - 1));
    list.push(this.findCell(grid, x, y + 1));

    return list
      .filter((e) => e)
      .filter((c) => c.hit === undefined && c.miss === undefined);
  }

  public fire(grid: Cell[][], cell: Cell): boolean {
    // Find the target cell in the grid
    const gridCell = this.findCell(grid, cell.x, cell.y);

    // If the cell has already been hit or missed, return false
    if (gridCell.hit || gridCell.miss) {
      return false;
    }

    // If the cell is a ship
    if (gridCell.type) {
      // Mark the cell as hit
      gridCell.hit = true;

      // Check if the ship is destroyed
      if (!grid.flat().find(c => c.type === gridCell.type && !c.hit)) {
        // If all cells of the same type have been hit, mark all as sunk and display message
        this.message(gridCell.type + ' destroyed!');
        grid.flat().filter(c => c.type === gridCell.type && c.hit).forEach(c => {
          c.sunk = true;
        });
      }

      // Check if all ships have been destroyed
      if (!grid.flat().find(c => c.type && !c.hit)) {
        this.message('GAME OVER');
        this.gameState = 'GAMEOVER';
      }

      return true;
    } else {
      // If the cell is not a ship, mark as miss
      gridCell.miss = true;
      return false;
    }
  }

  /**
   * Methode to contain all enemy ship placing logic
   * Ship placement for enemy is random
   */
  private placeEnemyShips():void {
    const enemyShips = this.ships.map((s) => ({ ...s, placed: false }));
    for (const s in enemyShips) {
      if (enemyShips.hasOwnProperty(s)) {
        const ship = enemyShips[s];
        while (!ship.placed) {
          const xStart = Math.round(Math.random() * 10) % 9;
          const yStart = Math.round(Math.random() * 10) % 9;
          const dir = Math.round(Math.random()) === 0 ? 'H' : 'V';
          const length = ship.size;

          let shipCells = [];
          switch (dir) {
          case 'V':
            for (let n = xStart; n < xStart + length; n++) {
              shipCells.push(this.findCell(this.enemyGrid, n, yStart));
            }
            break;
          case 'H':
            for (let n = yStart; n < yStart + length; n++) {
              shipCells.push(this.findCell(this.enemyGrid, xStart, n));
            }
            break;
          }

          shipCells = shipCells.filter((c) => c);

          if (shipCells.length !== ship.size) {
            // We went off the board :(
            continue;
          }

          const hasOverlap = shipCells.find((shipCell) => !!shipCell.type);
          if (!hasOverlap) {
            shipCells.forEach((shipCell) => {
              const gridCell = this.findCell(
                this.enemyGrid,
                shipCell.x,
                shipCell.y
              );
              gridCell.type = ship.type;
            });
            ship.placed = true;
          }
        }
      }
    }
    this.gameState = 'COMBAT';
    this.message('Combat has started!');
  }

  calculateProbability(ships: any[], grid: Cell[][]) {
    this.probGrid = copy(grid);

    for (const s in ships) {
      if (this.ships.hasOwnProperty(s)) {
        const ship = this.ships[s];
        const length = ship.size;
        for (let d = 0; d < 2; d++) {
          const dir = d === 0 ? 'H' : 'V';

          for (let xStart = 0; xStart < 10; xStart++) {
            for (let yStart = 0; yStart < 10; yStart++) {
              let shipCells = [];
              switch (dir) {
              case 'V':
                for (let n = xStart; n < xStart + length; n++) {
                  shipCells.push(this.findCell(this.probGrid, n, yStart));
                }
                break;
              case 'H':
                for (let n = yStart; n < yStart + length; n++) {
                  shipCells.push(this.findCell(this.probGrid, xStart, n));
                }
                break;
              }

              shipCells = shipCells.filter((c) => c);

              if (shipCells.length !== ship.size) {
                // We went off the board :(
                continue;
              }

              if (shipCells.find(c => c.sunk || c.miss)) {
                continue;
              }

              let increment = 1;
              if (shipCells.find(c => c.hit)) {
                increment = 20;
              }

              shipCells.forEach(c => {
                if (c.count) {
                  c.count = c.count + increment;
                } else {
                  c.count = increment;
                }
                if (c.hit) {
                  c.count = 0;
                }
              });
            }
          }
        }
      }
    }
    const max = this.probGrid
      .reduce((acc, curr) => acc.concat(curr), [])
      .filter((c) => c.count)
      .reduce((acc, curr) => Math.max(acc, curr.count || 0), 0);

    this.probGrid = this.probGrid.map((row) =>
      row.map((c) => ({ ...c, prob: c.count / max }))
    );
  }
}
