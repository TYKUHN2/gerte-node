'use strict';

const Address = require("./Address.js");
const Database = require("./KeyDatabase.js");
const crypto = require("crypto");

/**
 * A GERTe identity.
 */
class Identity {
    #address
    #key

    /**
     * Creates a GERTe identity from an address and a key.
     *
     * @param {string | Address} address
     * @param {Buffer | crypto.KeyObject | CryptoKey} key
     */
    constructor(address, key) {
        if (typeof address === "string")
            address = new Address(address);
        else if (!address instanceof Address)
            throw TypeError("Identity address is neither string nor address class");

        if (key instanceof crypto.webcrypto.CryptoKey)
            key = crypto.KeyObject.from(key);
        else if (key instanceof Buffer)
            key = crypto.createPrivateKey({key: key, format: "der", type: "pkcs8"});

        if (key.type !== "private" || key.asymmetricKeyType !== "ec")
            throw RangeError("Identity key was not a private EC key.");

        // Normalize, to minimize buffer.
        if (address.external)
            this.#address = new Address(address.external);
        else
            this.#address = address;

        this.#key = key;
    }

    get address() {
        return this.#address;
    }

    get key() {
        return this.#key;
    }
}

module.exports = Identity;