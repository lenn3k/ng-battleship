import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameAiComponent } from './pages/game-ai/game-ai.component';
import { GameListComponent } from './pages/game-list/game-list.component';
import { GamePlayerComponent } from './pages/game-player/game-player.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'game' },
  { path: 'game', component: GameAiComponent },
  { path: 'game/:gameId/:name', component: GamePlayerComponent },
  { path: 'lobby', component: GameListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule {}
