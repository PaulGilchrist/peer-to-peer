import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, throwError as observableThrowError, Observable, of } from 'rxjs';
import { catchError, map, retryWhen, tap } from 'rxjs/operators';

import * as IPFS from 'ipfs';

@Injectable()
export class IpfsService {

    private ready = new BehaviorSubject<boolean>(false);
    ready$ = this.ready.asObservable(); // Must be true before using service

    private bootstraps = ['/dns6/ipfs.thedisco.zone/tcp/4430/wss/p2p/12D3KooWChhhfGdB9GJy1GbhghAAKCUR99oCymMEVS4eUcEy67nt', '/dns4/ipfs.thedisco.zone/tcp/4430/wss/p2p/12D3KooWChhhfGdB9GJy1GbhghAAKCUR99oCymMEVS4eUcEy67nt'];
    private prefix = "discochat-";
    private lastAlive = 0;	// last keep-alive we saw from a relay
    private lastPeer = 0; 	// last keep-alive we saw from another peer
    private lastBootstrap = 0; // used for tracking when we last attempted to bootstrap (likely to reconnect to a relay)
    private ipfs: any = null;
    private peerCount = 0; 	// this is kind of a janky way to track peer count. really it'd be better to store the peers in a map, along with their last "peer-alive", to track peer count in a stable way.

    constructor() {
        this.start();
    }

    private async start() {
        console.log(`IpfsService.start()`);
        this.ipfs = await IPFS.create({
            repo: 'ok' + Math.random(), // random so we get a new peerid every time, useful for testing
            relay: {
                enabled: true,
                hop: {
                    enabled: true
                }
            },
            config: {
                Addresses: {
                    Swarm: [
                        '/dns4/star.thedisco.zone/tcp/9090/wss/p2p-webrtc-star',
                        '/dns6/star.thedisco.zone/tcp/9090/wss/p2p-webrtc-star'
                    ]
                },
                // FIXME Announce: [ '/p2p/12D3KooWChhhfGdB9GJy1GbhghAAKCUR99oCymMEVS4eUcEy67nt/p2p-circuit' ],
            }
        });
        // add bootstraps for next time, and attempt connection just in case we're not already connected
        await this.doBootstrap(false);
        // publish and subscribe to keepalive to help keep the sockets open
        await this.ipfs.pubsub.subscribe(this.prefix + "keepalive");
        setInterval(() => { this.sendMsg("1", this.prefix + "keepalive"); }, 4000);
        setInterval(this.checkAlive, 1000);
        // process announcements over the relay network, and publish our own keep-alives to keep the channel alive
        await this.ipfs.pubsub.subscribe("announce-circuit", (addr: any) => { this.processAnnounce(addr) });
        setInterval(() => { this.ipfs.pubsub.publish("announce-circuit", "peer-alive"); }, 15000);
        this.ready.next(true);
    }

    // check if we're still connected to the circuit relay (not required, but let's us know if we can see peers who may be stuck behind NAT)
    private checkAlive() {
        // console.log(`checkAlive()`);
        const now = new Date().getTime();
        if (now - this.lastAlive >= 35000) {
            if (now - this.lastPeer >= 35000) {
                // Red
            } else {
                // Yellow
            }
            this.doBootstrap(true); // sometimes we appear to be connected to the bootstrap nodes, but we're not, so let's try to reconnect
        } else {
            // Green;
        }
    }

    // if reconnect is true, it'll first attempt to disconnect from the bootstrap nodes
    private async doBootstrap(reconnect: boolean) {
        console.log(`IpfsService.doBootstrap(${reconnect})`);
        const now = new Date().getTime();
        if (now - this.lastBootstrap < 60000) { // don't try to bootstrap again if we just tried within the last 60 seconds
            return;
        }
        this.lastBootstrap = now;
        for (let i in this.bootstraps) {
            if (reconnect) {
                try {
                    await this.ipfs.swarm.disconnect(this.bootstraps[i]);
                } catch (e) {
                    console.log(e);
                }
            } else {
                await this.ipfs.bootstrap.add(this.bootstraps[i]);
            }
            await this.ipfs.swarm.connect(this.bootstraps[i]);
        }
    }

    public async subscribe(chan: string, handleMessage: any) {
        console.log(`IpfsService.subscribe(${chan})`);
        await this.ipfs.pubsub.subscribe(this.prefix + chan, handleMessage);
    }

    // processes a circuit-relay announce over pubsub
    private async processAnnounce(addr: any) {
        // console.log(`processAnnounce(${addr})`);
        // get our peerid
        let me = await this.ipfs.id();
        me = me.id;
        // not really an announcement if it's from us
        if (addr.from == me) {
            return;
        }
        // process the recieved address
        addr = new TextDecoder().decode(addr.data);
        if (addr == "peer-alive") {
            // console.log(addr);
            this.peerCount += 1;
            setTimeout(() => {
                this.peerCount -= 1;
            }, 15000);
            this.lastPeer = new Date().getTime();
            return;
        }
        // keep-alives are also sent over here, so let's update that global first
        this.lastAlive = new Date().getTime();
        if (addr == "keep-alive") {
            // console.log(addr);
            return;
        }
        const peer = addr.split("/")[9];
        console.log("Peer: " + peer);
        console.log("Me: " + me);
        if (peer == me) {
            return;
        }
        // get a list of peers
        const peers = await this.ipfs.swarm.peers();
        for (let i in peers) {
            // if we're already connected to the peer, don't bother doing a circuit connection
            if (peers[i].peer == peer) {
                return;
            }
        }
        // log the address to console as we're about to attempt a connection
        console.log(addr);
        // connection almost always fails the first time, but almost always succeeds the second time, so we do this:
        try {
            await this.ipfs.swarm.connect(addr);
        } catch (err) {
            console.log(err);
            await this.ipfs.swarm.connect(addr);
        }
    }

    // used for triggering a sendmsg from user input
    public async sendMsg(msg: string, chan: string) {
        // console.log(`sendMsg(${msg}, ${chan})`);
        await this.ipfs.pubsub.publish(this.prefix + chan, msg);
    }

}
