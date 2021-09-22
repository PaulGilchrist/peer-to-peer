import { stripGeneratedFileSuffix } from '@angular/compiler/src/aot/util';
import { Component, OnInit } from '@angular/core';
import * as faker from 'faker';
import { phone } from 'faker';
import { IpfsService } from './../../services/ipfs.service'

@Component({
  selector: 'pub-sub',
  templateUrl: './pub-sub.component.html',
  styleUrls: ['./pub-sub.component.css']
})
export class PubSubComponent implements OnInit {
  channel = "pub-sub";

  user = {
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    zip: ''
  }

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
    console.log(`Subscribing to channel ${this.channel}`);
    await this.ipfsService.subscribe(this.channel, (msg: any) => this.handleMessage(msg));
  }

  generateUser() {
    const firstName = faker.name.firstName().replace(/[^a-zA-Z ]/g, "");
    const lastName = faker.name.lastName().replace(/[^a-zA-Z ]/g, "");
    this.user = {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      email: faker.internet.email(firstName, lastName).replace(/[^a-zA-Z@\. ]/g, ""),
      phoneNumber: faker.phone.phoneNumber(),
      street: faker.address.streetAddress().replace(/[^0-9a-zA-Z ]/g, ""),
      city: faker.address.city().replace(/[^a-zA-Z ]/g, ""),
      state: faker.address.stateAbbr(),
      zip: faker.address.zipCode(),
    }
  }

  async handleMessage(msg: any) {
    // processing recieved messages
    let userJson = '';
    try {
      userJson = new TextDecoder().decode(msg.data);
    } catch (ex) {
      userJson = msg.data;
    }
    this.user = JSON.parse(userJson);
  }

  sendUser() {
    this.ipfsService.sendMsg(JSON.stringify(this.user), this.channel);
  }

}
