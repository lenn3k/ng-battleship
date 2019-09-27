import { Component, OnInit } from '@angular/core';
import { isNullOrUndefined } from 'util';

interface Cell {
  x: number;
  y: number;
  hit?: boolean;
  miss?: boolean;
  type?: string;
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

  findCell(grid: Cell[][], x: number, y: number) {
    return grid
      .reduce((acc, curr) => acc.concat(curr), [])
      .find(cell => cell.x === x && cell.y === y);
  }

  array(n: number) {
    return new Array(n);
  }

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

  enemyFire() {
    switch (this.enemy.mode) {
      case 'HUNT':
        let parity = 1;
        let x = 0;
        let y = 0;
        while (parity !== 0) {
          x = Math.round(Math.random() * 10) % 9;
          y = Math.round(Math.random() * 10) % 9;

          parity = (x + y) % 2;
        }

        const cell = { x, y };

        if (this.enemy.targetList.find(c => c.x === x && c.y === y)) {
          this.enemyFire();
          return;
        }

        this.enemy.targetList.push(cell);

        console.log('firing at ', cell);
        if (this.fire(this.playerGrid, cell)) {
          // Hit => go into 'KILL' mode
          console.log('KILL MODE');

          this.enemy.mode = 'KILL';
          // Add surrounding cells to the targetStack
          this.enemy.targetStack = [
            ...this.enemy.targetStack,
            ...this.getSurroundingCells(cell, this.playerGrid)
          ];
        } else {
          // Miss => better luck next time!
        }
        break;

      case 'KILL':
        console.log(this.enemy.targetStack);

        if (this.enemy.targetStack.length > 0) {
          const cell = this.enemy.targetStack.shift();
          if (this.fire(this.playerGrid, cell)) {
            // Hit => add surrounding cells to target list
            this.enemy.targetStack = [
              ...this.enemy.targetStack,
              ...this.getSurroundingCells(cell, this.playerGrid)
            ];
          } else {
            // Miss => better luck next time!
          }
        } else {
          this.enemy.mode = 'HUNT';
          console.log('HUNT MODE');

          this.enemyFire();
        }
        break;
      default:
        break;
    }
  }

  getSurroundingCells(cell: Cell, grid: Cell[][]): Cell[] {
    const list = [];
    const x = cell.x;
    const y = cell.y;

    const c1 = this.findCell(grid, x - 1, y);
    const c2 = this.findCell(grid, x + 1, y);
    const c3 = this.findCell(grid, x, y - 1);
    const c4 = this.findCell(grid, x, y + 1);
    if (c1) {
      list.push(c1);
    }
    if (c2) {
      list.push(c2);
    }
    if (c3) {
      list.push(c3);
    }
    if (c4) {
      list.push(c4);
    }

    return list.filter(
      c => isNullOrUndefined(c.hit) && isNullOrUndefined(c.miss)
    );
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
        console.log(gridCell.type + ' destroyed!');
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
}
