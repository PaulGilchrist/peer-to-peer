import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MessengerComponent } from './components/messenger/messenger.component';
import { PubSubComponent } from './components/pub-sub/pub-sub.component';

const routes: Routes = [
  { path: '', redirectTo: '/messenger', pathMatch: 'full' },
  { path: 'messenger', component: MessengerComponent },
  { path: 'pub-sub', component: PubSubComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
