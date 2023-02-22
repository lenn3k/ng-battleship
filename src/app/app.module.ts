import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GridComponent } from './components/grid/grid.component';
import { GameAiComponent } from './pages/game-ai/game-ai.component';
import { GameListComponent } from './pages/game-list/game-list.component';
import { GamePlayerComponent } from './pages/game-player/game-player.component';
import { SocketService } from './services/socket.service';

@NgModule({
  declarations: [
    AppComponent,
    GameAiComponent,
    GamePlayerComponent,
    GridComponent,
    GameListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    FormsModule
  ],
  providers: [SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
