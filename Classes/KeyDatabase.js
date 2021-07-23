'use strict';

const fs = require("fs");
const crypto = require("crypto");
const Address = require("./Address.js");

class KeyDatabase {
    static #loaded = false;
    static #db = new Map();

    static load() {
        let buf = fs.readFileSync("resolutions.geds");

        for (let i = 0; i < buf.length;) {
            let addr = new Address(buf.slice(i, i + 3));

            let length = buf.readUInt16BE(i + 3);
            let key = crypto.createPublicKey({key: buf.slice(i + 5, i + 5 + length), format: "der", type: "spki"});

            this.#db.set(addr.address, key);

            i += 5 + length;
        }
    }

    /**
     * @param {Address} target
     * @return {crypto.KeyObject|undefined}
     */
    static getKey(target) {
        if (!KeyDatabase.#loaded)
            KeyDatabase.load();

        if (target.external !== null)
            return this.#db.get(target.external);
        else
            return this.#db.get(target.address);
    }
}

module.exports = KeyDatabase;
