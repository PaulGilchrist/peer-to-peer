import { Component, OnInit } from '@angular/core';

import { IpfsService } from './services/ipfs.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  channel = "global";
  chatMessage = "";
  displayName = "";
  thread: string[] = [];

  constructor(private ipfsService: IpfsService) {}

  ngOnInit() {
    // Improve this to wait for ipfsService to have connected
    this.ipfsService.ready$.subscribe((ready) => {
      if(ready) {
        this.start();
      }
    });
  }

  async start() {
    console.log(`app.start()`);
    await this.ipfsService.subscribe(this.channel, (msg: any) => this.out(msg));
  }

  handleChatKeydown(event: any) {
    // block for translating an enter keypress while in the chat input as a message submission
    if (!event) { event = window.event; }
    // Enter is pressed
    if (event.keyCode == 13) {
      event.preventDefault();
      this.ipfsService.sendMsg(`[${this.displayName}] ${this.chatMessage}`, this.channel);
      this.chatMessage = "";
    }
  }

  // usage: await joinChan("example_channel");
  async out(msg: any) {
    console.log(`app.out()`);
    // processing recieved messages
    // let stringMessage = new TextDecoder().decode(msg.data);
    this.thread.push(msg.data);
  }

}
