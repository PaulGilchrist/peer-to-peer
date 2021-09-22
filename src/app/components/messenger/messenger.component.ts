import { Component, OnInit } from '@angular/core';

import { IpfsService } from './../../services/ipfs.service'

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css']
})
export class MessengerComponent implements OnInit {
  channel = "private";
  chatMessage = "";
  displayName = "";
  thread: string[] = [];

  constructor(private ipfsService: IpfsService) {}

  ngOnInit() {
    const threadJson = sessionStorage.getItem(`thread-${this.channel}`);
    if(threadJson != null) {
      console.log(threadJson);
      this.thread = JSON.parse(threadJson);
      console.log(this.thread);

    }
    // Improve this to wait for ipfsService to have connected
    this.ipfsService.ready$.subscribe((ready) => {
      if(ready) {
        this.start();
      }
    });
  }

  async start() {
    console.log(`Subscribing to channel ${this.channel}`);
    await this.ipfsService.subscribe(this.channel, (msg: any) => this.handleMessage(msg));
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

  async handleMessage(msg: any) {
    // processing recieved messages
    try {
      msg = new TextDecoder().decode(msg.data);
    } catch (ex) {
      msg = msg.data;
    }
    this.thread.push(msg);
    sessionStorage.setItem(`thread-${this.channel}`, JSON.stringify(this.thread));
  }

}
