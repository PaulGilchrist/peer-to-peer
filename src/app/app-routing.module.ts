import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MessengerComponent } from './components/messenger/messenger.component';

const routes: Routes = [
  { path: '', redirectTo: '/messenger', pathMatch: 'full' },
  { path: 'messenger', component: MessengerComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
