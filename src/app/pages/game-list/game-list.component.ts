import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, Subject } from "rxjs";
import { map, take, takeUntil } from "rxjs/operators";
import { SocketService } from "src/app/services/socket.service";
import {
  adjectives,
  animals,
  Config,
  uniqueNamesGenerator
} from "unique-names-generator";

@Component({
  selector: "game-list",
  templateUrl: "game-list.component.html",
  styleUrls: ["game-list.component.scss"],
})
export class GameListComponent implements OnInit {
  public availableSessions = [];
  private _destroy = new Subject<void>();
  public destroy$ = this._destroy as Observable<void>;
  private nameConfig: Config = {
    dictionaries: [adjectives, animals],
    separator: "",
    style: "capital",
  };
  public name = uniqueNamesGenerator(this.nameConfig);

  constructor(private _socketService: SocketService, private router: Router) {
    this._socketService
      .onAvailableSessions()
      .pipe(
        takeUntil(this.destroy$),
        map((data) => {
          this.availableSessions = [];
          for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
              const element = data[key];
              this.availableSessions = this.availableSessions.concat({
                gameId: key,
                ...element,
              });
            }
          }
        })
      )
      .subscribe();
  }

  /** Lifecycle hook called by angular framework when extended class dies. */
  ngOnDestroy(): void {
    this._destroy.next();
  }

  ngOnInit() {}

  public createGame(): void {
    if (this.name.length <= 1) {
      console.error("Name must be longer than 1 character");
      return;
    }
    if (
      this.availableSessions.filter((session) =>
        session.name.includes(this.name)
      ).length > 0
    ) {
      console.error("You have already created a session");
      return;
    }
    this._socketService.createGame(this.name);
    this._socketService
      .onGameCreated()
      .pipe(take(1))
      .subscribe((session) => {
        console.log(session);
        this.router.navigate(["game", session.gameId, this.name]);
      });
  }

  public joinGame(session): void {
    const { name, players } = session;
    if (players.length >= 2) {
      console.error("Session full, please try to join a different session");
      return;
    }

    this._socketService.joinGame(session.gameId, this.name);
    this.router.navigate(["game", session.gameId, this.name]);
  }
}
