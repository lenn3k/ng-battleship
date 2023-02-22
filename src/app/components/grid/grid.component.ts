import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Cell } from "src/app/pages/utils/interfaces";

@Component({
  selector: "grid",
  templateUrl: "grid.component.html",
  styleUrls: ["grid.component.scss"],
})
export class GridComponent {
  private _showShips: boolean = false;
  private _canFire: boolean = false;
  private _canPlace: boolean = false;

  @Input()
  public set showShips(value: boolean) {
    this._showShips = coerceBooleanProperty(value);
  }

  @Input()
  public set canFire(value: boolean) {
    this._canFire = coerceBooleanProperty(value);
  }

  @Input()
  public set canPlace(value: boolean) {
    this._canPlace = coerceBooleanProperty(value);
  }
  @Input() grid: Cell[] = [];

  @Output() mouseDown = new EventEmitter<Cell>();
  @Output() mouseUp = new EventEmitter<Cell>();
  @Output() mouseClick = new EventEmitter<Cell>();

  public get showShips(): boolean {
    return this._showShips;
  }
  public get canFire(): boolean {
    return this._canFire;
  }
  public get canPlace(): boolean {
    return this._canPlace;
  }

  public handleMouseDown(cell: Cell) {
    if (!this.canPlace) return;
    this.mouseDown.emit(cell);
  }

  public handleMouseUp(cell: Cell) {
    if (!this.canPlace) return;
    this.mouseUp.emit(cell);
  }

  public handleClick(cell: Cell) {
    if (!this.canFire) return;
    this.mouseClick.emit(cell);
  }
}
