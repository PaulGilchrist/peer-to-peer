import { Component, OnInit } from '@angular/core';

import { IpfsService } from './../../services/ipfs.service'

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css']
})
export class MessengerComponent implements OnInit {
  channel = "private";
  message = {
    displayName: "",
    dateCreated: Date.now(),
    text: ""
  }
  thread: any = [];

  constructor(private ipfsService: IpfsService) {}

  ngOnInit() {
    const displayName = sessionStorage.getItem(`displayName`);
    if(displayName) {
      this.message.displayName = displayName;
    }
    const threadJson = sessionStorage.getItem(`thread-${this.channel}`);
    if(threadJson != null) {
      this.thread = JSON.parse(threadJson);
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

  getDateString(date: any) {
    let dateCreated = new Date(date);
    // Ensure minutes is always 2 characters
    const minutes = dateCreated.getMinutes();
    const stringMinutes = minutes < 10 ? `0${minutes}` : minutes;
    // Check to see if date is today or yesturday
    let dateString = `${dateCreated.getMonth()+1}/${dateCreated.getDate()}`;
    const now = new Date;
    if(dateCreated.getMonth() == now.getMonth()) {
      if(dateCreated.getDate() == now.getDate()) {
        dateString = 'Today';
      } else if(dateCreated.getDate() == now.getDate()-1) {
        dateString = 'Yesturday';
      }
    } 
    return `${dateString} ${dateCreated.getHours()}:${stringMinutes}`
  }

  handleChatKeydown(event: any) {
    // block for translating an enter keypress while in the chat input as a message submission
    if (!event) { event = window.event; }
    // Enter is pressed
    if (event.keyCode == 13) {
      event.preventDefault();
      this.message.dateCreated = Date.now();
      this.ipfsService.sendMsg(JSON.stringify(this.message), this.channel);
      this.message.text = "";
    }
  }

  async handleMessage(msg: any) {
    // processing recieved messages
    let messageJson = '';
    try {
      messageJson = new TextDecoder().decode(msg.data);
    } catch (ex) {
      messageJson = msg.data;
    }
    let message = JSON.parse(messageJson);
    this.thread.push(message);
    sessionStorage.setItem(`thread-${this.channel}`, JSON.stringify(this.thread));
    sessionStorage.setItem(`displayName`, this.message.displayName);
  }

}
