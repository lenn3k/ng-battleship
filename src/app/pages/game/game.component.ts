import { Component, OnInit } from '@angular/core';
import { isNullOrUndefined } from 'util';

interface Cell {
  x: number;
  y: number;
  hit?: boolean;
  miss?: boolean;
  type?: string;
  count?: number;
  prob?: number;
  sunk?: boolean;
}

interface Enemy {
  targetStack: Cell[];
  mode: 'HUNT' | 'KILL';
  targetList: Cell[];
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  probGrid: Cell[][];
  constructor() {}

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
    { type: 'destroyer', size: 2, placed: false }
  ];
  ngOnInit() {
    this.gameState = 'PLACEMENT';
    this.enemyGrid = [];
    this.playerGrid = [];
    this.enemy = {
      targetStack: [],
      mode: 'HUNT',
      targetList: []
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

  message(text: string) {
    console.log('MESSAGE: ' + text);
  }

  /**
   * Utility method to deep-copy objects
   * @param element object to copy
   */
  copy(element: any): any {
    return JSON.parse(JSON.stringify(element));
  }

  startShipPlacement(cell: Cell) {
    this.startCell = cell;
  }

  endShipPlacement(cell: Cell) {
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
    const ship = this.ships.find(s => s.size === length && s.placed === false);
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

      const hasOverlap = shipCells.find(shipCell => !!shipCell.type);
      if (!hasOverlap) {
        shipCells.forEach(shipCell => {
          const gridCell = this.findCell(
            this.playerGrid,
            shipCell.x,
            shipCell.y
          );
          gridCell.type = ship.type;
        });
        ship.placed = true;
      }
      if (!this.ships.find(s => !s.placed)) {
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
  findCell(grid: Cell[][], x: number, y: number) {
    return grid
      .reduce((acc, curr) => acc.concat(curr), [])
      .find(cell => cell.x === x && cell.y === y);
  }

  /**
   * Utility function to draw the ships
   * @param n Length of array
   */
  array(n: number) {
    return new Array(n);
  }

  /**
   * Handle player fire logic and trigger enemyFire
   * @param cell Cell to fire upon
   */
  playerFire(cell: Cell) {
    switch (this.gameState) {
      case 'PLACEMENT':
        this.message('Place your ships before firing!');
        break;
      case 'COMBAT':
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
  getSurroundingCells(cell: Cell, grid: Cell[][]): Cell[] {
    const list = [];
    const x = cell.x;
    const y = cell.y;

    list.push(this.findCell(grid, x - 1, y));
    list.push(this.findCell(grid, x + 1, y));
    list.push(this.findCell(grid, x, y - 1));
    list.push(this.findCell(grid, x, y + 1));

    return list
      .filter(e => e)
      .filter(c => isNullOrUndefined(c.hit) && isNullOrUndefined(c.miss));
  }

  /**
   *
   * @param grid The grid to shoot on
   * @param cell The target Cell to shoot at
   *
   * @returns boolean True on Hit, False on Miss
   */
  fire(grid: Cell[][], cell: Cell): boolean {
    const gridCell = this.findCell(grid, cell.x, cell.y);
    if (gridCell.hit || gridCell.miss) {
      return false;
    }
    if (gridCell.type) {
      gridCell.hit = true;

      // check if the ship is destroyed
      const isShipAlive = grid
        .reduce((acc, curr) => acc.concat(curr), [])
        .find(c => c.type === gridCell.type && !c.hit);

      if (!isShipAlive) {
        this.message(gridCell.type + ' destroyed!');
        grid
          .reduce((acc, curr) => acc.concat(curr), [])
          .filter(c => c.type === gridCell.type && c.hit)
          .forEach(c => {
            c.sunk = true;
          });
      }

      const isAnythingAlive = grid
        .reduce((acc, curr) => acc.concat(curr), [])
        .find(c => c.type && !c.hit);
      if (!isAnythingAlive) {
        this.message('GAME OVER');
        this.gameState = 'GAMEOVER';
      }

      return true;
    } else {
      gridCell.miss = true;
      return false;
    }
  }

  /**
   * Methode to contain all enemy ship placing logic
   * Ship placement for enemy is random
   */
  placeEnemyShips() {
    const enemyShips = this.ships.map(s => ({ ...s, placed: false }));
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

          shipCells = shipCells.filter(c => c);

          if (shipCells.length !== ship.size) {
            // We went off the board :(
            continue;
          }

          const hasOverlap = shipCells.find(shipCell => !!shipCell.type);
          if (!hasOverlap) {
            shipCells.forEach(shipCell => {
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
    this.probGrid = this.copy(grid);

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

              shipCells = shipCells.filter(c => c);

              if (shipCells.length !== ship.size) {
                // We went off the board :(
                continue;
              }

              if (shipCells.find(c => c.sunk || c.miss)) {
                continue;
              }

              let increment = 1;
              if (shipCells.find(c => c.hit)) {
                increment = 10;
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
      .filter(c => c.count)
      .reduce((acc, curr) => Math.max(acc, curr.count || 0), 0);

    this.probGrid = this.probGrid.map(row =>
      row.map(c => ({ ...c, prob: c.count / max }))
    );
  }
}
