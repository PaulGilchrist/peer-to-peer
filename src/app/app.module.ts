import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app/app.component';
import { MessengerComponent } from './components/messenger/messenger.component';
import { NavTopComponent } from './components/nav-top/nav-top.component';
import { PubSubComponent } from './components/pub-sub/pub-sub.component';

import { IpfsService } from './services/ipfs.service';


@NgModule({
  declarations: [
    AppComponent,
    MessengerComponent,
    NavTopComponent,
    PubSubComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [IpfsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
