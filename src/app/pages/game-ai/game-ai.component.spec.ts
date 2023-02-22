import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Cell, GameComponent } from './game-ai.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [GameComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });



  describe('fire method', () => {
    type NewType = Cell;

    let grid: NewType[][];
    let findCellSpy: jest.SpyInstance;
    let messageSpy: jest.SpyInstance;

    beforeEach(() => {
        grid = [[{x: 0, y: 0, type: 'ship1'}, {x: 0, y: 1, type: 'ship1'}], [{x: 1, y: 0, type: 'ship2'}, {x: 1, y: 1, type: 'ship2'}]];
        findCellSpy = jest.spyOn(GameComponent.prototype, 'findCell').mockReturnValue({x: 0, y: 0, type: 'ship1'});
        messageSpy = jest.spyOn(GameComponent.prototype, 'message');
    });

    afterEach(() => {
        findCellSpy.mockClear();
        messageSpy.mockClear();
    });

    it('should return false if the cell has already been hit', () => {
        const testClass = new GameComponent();
        grid[0][0].hit = true;
        expect(testClass.fire(grid, {x: 0, y: 0})).toBe(false);
    });

    it('should return false if the cell has already been missed', () => {
        const testClass = new GameComponent();
        grid[0][0].miss = true;
        expect(testClass.fire(grid, {x: 0, y: 0})).toBe(false);
    });

    it('should return true if the cell is a ship and not sunk', () => {
        const testClass = new GameComponent();
        expect(testClass.fire(grid, {x: 0, y: 0})).toBe(true);
        expect(grid[0][0].hit).toBe(true);
    });

    it('should mark the ship as sunk if all cells of the same type have been hit', () => {
        const testClass = new GameComponent();
        testClass.fire(grid, {x: 0, y: 0});
        testClass.fire(grid, {x: 0, y: 1});
        expect(grid[0][0].sunk).toBe(true);
        expect(grid[0][1].sunk).toBe(true);
    });

    it('should display message if the ship is destroyed', () => {
        const testClass = new GameComponent();
        testClass.fire(grid, {x: 0, y: 0});
        testClass.fire(grid, {x: 0, y: 1});
        expect(messageSpy).toHaveBeenCalledWith('ship1 destroyed!');
    });

    it('should display game over message if all ships have been destroyed', () => {
        const testClass = new GameComponent();
        testClass.fire(grid, {x: 0, y: 0});
        testClass.fire(grid, {x: 0, y: 1});
        testClass.fire(grid, {x: 1, y: 0});
        testClass.fire(grid, {x: 1, y: 1});
        expect(messageSpy).toHaveBeenCalledWith('GAME OVER');
      });
    });
});
