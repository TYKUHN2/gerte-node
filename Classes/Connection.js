'use strict';

const net = require("net");
const crypto = require("crypto");
const Identity = require("./Identity.js");
const EventEmitter = require("events");
const Address = require("./Address.js");
const Packet = require("./Packet.js");
const KeyDatabase = require("./KeyDatabase.js");

/**
 * Represents a connection to a peer and handles negotiation and communication.
 */
class Connection extends EventEmitter {
    /**
     * @type {net.Socket}
     */
    #socket;

    /**
     * @type {Identity}
     */
    #identity;

    #ready = false;

    /**
     * @type {[Packet]}
     */
    #pending = [];

    /**
     * @type {[Packet]}
     */
    #packets = [];

    /**
     * Connects to the given peer using a given identity.
     *
     * @param {string} ip
     * @param {number} port
     * @param {Identity} identity
     */
    constructor(ip, port, identity) {
        super();

        if (!net.isIP(ip))
            throw RangeError("Connection ip is not a valid IP address");
        else if (typeof port !== "number")
            throw TypeError("Connection port is not an integer");
        else if (port > 65535)
            throw RangeError("Connection port is above 65535");
        else if (!identity instanceof Identity)
            throw TypeError("Connection identity is not an Identity");

        this.#identity = identity;
        this.#socket = net.createConnection(port, ip, () => {
            let packet = Buffer.from([2, 0]);
            packet = Buffer.concat([packet, identity.address.buffer], 5);

            let fthis = this;

            this.#socket.on("close", () => { fthis.emit("close"); });

            this.#socket.once("data", (data) => {
                fthis.#handshake(data)
            });
            this.#socket.write(packet);
        });
    }

    /**
     * Sends a Packet
     * @param {Packet} packet
     */
    write(packet) {
        if (!packet instanceof Packet)
            throw TypeError("Connection write packet is not a Packet");

        packet.source.external = this.#identity.address.address;

        if (!this.#ready) {
            this.#pending.push(packet);
            return;
        }

        let buf = Buffer.alloc(22 + packet.data.length);
        buf.writeUInt16BE(packet.data.length);
        packet.source.buffer.copy(buf, 2);
        packet.destination.buffer.copy(buf, 8);
        packet.data.copy(buf, 14);

        let bigi = BigInt(Math.floor(Date.now() / 1000));
        buf.writeBigUInt64BE(bigi, 14 + packet.data.length); // Timestamp

        const sig = crypto.sign("sha256", buf, this.#identity.key);

        const sigBuf = Buffer.alloc(1);
        sigBuf.writeUInt8(sig.length);

        this.#socket.write(Buffer.concat([buf, sigBuf, sig], buf.length + sig.length + 1));
    }

    /**
     * Reads a packet if available.
     *
     * @returns {Packet|null}
     */
    read() {
        if (this.#packets.length > 0)
            return this.#packets.shift();

        return null;
    }

    /**
     * @param {Buffer} data
     */
    #handshake(data) {
        if (data[0] === 0 && data[1] === 0) {
            if (data[2] === 0)
                this.emit("error", Error("Peer does not support our version"));
            else if (data[2] === 1)
                this.emit("error", Error("Peer does not recognize our identity"));
            else if (data[2] === 2)
                this.emit("error", Error("Peer had an internal error"));
            else
                this.emit("error", Error("Peer had an unrecognized error"));

            this.#socket.end();
            return;
        }

        this.#ready = true;

        let fthis = this;
        this.#socket.on("data", (data) => {
            let packet = fthis.#parse(data);

            if (packet !== null) {
                fthis.#packets.push(packet);
                fthis.emit("data");
            }
        });

        /*if (this.#pending.length === 0) {
            let buf = Buffer.alloc(10, 0x00);

            let bigi = BigInt(Math.floor(Date.now() / 1000));
            buf.writeBigUInt64LE(bigi, 2); // Timestamp
            const sig = crypto.sign("sha256", buf, this.#identity.key);

            this.#socket.write(Buffer.concat([buf, sig], buf.length + 32));
        } else {*/
            for (let i = 0; i < this.#pending.length; i++)
                this.write(this.#pending.shift());
        //}

        this.emit("ready");
    }

    /**
     * @param {Buffer} data
     * @return {Packet | null} data
     */
    #parse(data) {
        let length = data.readUInt16BE();
        let source = new Address(data.slice(2, 8));
        let destination = new Address(data.slice(8, 14));
        let dat = data.slice(14, length + 14);
        let timestamp = data.readBigInt64BE(length + 14);
        let sigLength = data.readUInt8(length + 22);
        let sig = data.slice(length + 23, length + 23 + sigLength);
        let key = KeyDatabase.getKey(source);

        let now = BigInt(Math.floor(Date.now() / 1000));

        if (now - timestamp > 60 || key === null)
            return null;
        else if (crypto.verify("sha256", dat, key, sig)) { // Decrypt error, instant abort.
            this.#socket.end();
            return null;
        }

        return new Packet(source, destination, dat);
    }
}

module.exports = Connection;