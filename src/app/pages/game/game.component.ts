import { Component, OnInit } from '@angular/core';

interface Cell {
  x: number;
  y: number;
  hit?: boolean;
  miss?: boolean;
  type?: string;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  constructor() {}

  playerGrid: Cell[][];
  enemyGrid: Cell[][];
  startCell: Cell;
  endCell: Cell;

  ships = [
    { type: 'carrier', size: 5, placed: false },
    { type: 'battleship', size: 4, placed: false },
    { type: 'submarine', size: 3, placed: false },
    { type: 'cruiser', size: 3, placed: false },
    { type: 'destroyer', size: 2, placed: false }
  ];
  ngOnInit() {
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
    }

    if (!this.ships.find(s => !s.placed)) {
      console.log('all ships placed');
      this.placeEnemyShips();
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
    this.fire(this.enemyGrid, cell);

    this.enemyFire();
  }

  enemyFire() {
    const x1 = Math.round(Math.random() * 10) % 9;
    const y1 = Math.round(Math.random() * 10) % 9;
    const cell = { x: x1, y: y1 };

    console.log('firing at ', cell);
    if (!this.fire(this.playerGrid, cell)) {
      this.enemyFire;
    }
  }

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
        console.log('GAME OVER');
      }
    } else {
      gridCell.miss = true;
    }
    return true;
  }

  placeEnemyShips() {
    const enemyShips = this.ships.map(s => ({ ...s, placed: false }));
    while (enemyShips.find(s => !s.placed)) {
      console.log('Placing enemy ship ...');
      const x1 = Math.round(Math.random() * 10) % 9;
      const y1 = Math.round(Math.random() * 10) % 9;
      const x2 = Math.round(Math.random() * 10) % 9;
      const y2 = Math.round(Math.random() * 10) % 9;

      // check for straight line
      if (x1 !== x2 && y1 !== y2) {
        continue;
      }
      const xStart = Math.min(x1, x2);
      const yStart = Math.min(y1, y2);
      const dir = x1 < x2 ? 'V' : x2 < x1 ? 'V' : y1 < y2 ? 'H' : 'H';
      const length = Math.abs(x1 - x2) + Math.abs(y1 - y2) + 1;

      // calculate length of ship to place
      // check if ship is already placed
      const ship = enemyShips.find(
        s => s.size === length && s.placed === false
      );
      if (ship) {
        // ship can be placed
        // get all cells
        const shipCells = [];
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
          default:
            break;
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
          console.log('placed enemy ' + ship.type);
          ship.placed = true;
        }
      }
    }
  }
}
