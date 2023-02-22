import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import io from 'socket.io-client';


@Injectable({providedIn: 'root'})
export class SocketService {

  private socket;



  constructor() {
    this.socket = io('http://localhost:3000');
  }



  public sendShot(gameId, playerName, cellX, cellY): void {
    this.socket.emit('shot',gameId,  playerName, cellX, cellY);
  }

  public onShot(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('shot', (data) => {
        observer.next(data);
      });
    });
  }

  public sendReady(gameId:string, name:string):void {
    this.socket.emit('ready',gameId,name)
  }

  public onReady(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('playerReady', (data) => {
        observer.next(data);
      });
    });
  }

  public joinGame(game:string, playerName:string):void{
    this.socket.emit('joinGame',game||playerName+"'s game",playerName)
  }
  public createGame(playerName:string):void{
    this.socket.emit('createGame',playerName)
  }

  public leaveGame(gameId:string, playerName):void{
    this.socket.emit('leaveGame',gameId, playerName)
  }


  public onGameCreated():Observable<any>{
    return new Observable<any>(observer => {
      this.socket.on('gameCreated', (data) => {
        observer.next(data);
      });
    });
  }

  public onAvailableSessions(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('availableSessions', (data) => {
        observer.next(data);
      });
    });
  }

  public onPlayerJoined(): Observable<any>{
    return new Observable<any>(observer => {
      this.socket.on('playerJoined', (data) => {
        observer.next(data);
      });
    });
  }
  public onPlayerLeft(): Observable<any>{
    return new Observable<any>(observer => {
      this.socket.on('playerLeft', (data) => {
        observer.next(data);
      });
    });
  }


  sendGameOver(gameId: string, playerName: string):void {
    this.socket.emit('gameOver',gameId, playerName)
  }
  sendDestroyed(gameId: string, playerName: string, shipType: string):void {
    this.socket.emit('destroyed',gameId, playerName,shipType)
  }
  sendResult(gameId: string, playerName: string, result: string, shipType: string):void {
    this.socket.emit('shotResult',gameId, playerName, result, shipType)
  }

  onGameOver(): Observable<any>{
    return new Observable<any>(observer => {
      this.socket.on('gameOver', (data) => {
        observer.next(data);
      });
    });
  }

  onDestroyed(): Observable<any>{
    return new Observable<any>(observer => {
      this.socket.on('destroyed', (data) => {
        observer.next(data);
      });
    });
  }

  onShotResult(): Observable<any>{
    return new Observable<any>(observer => {
      this.socket.on('shotResult', (data) => {
        observer.next(data);
      });
    });
  }




}
