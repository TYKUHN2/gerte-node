const addrPattern = /^(?:(\d{1,4}\.\d{1,4}):)?(\d{1,4}\.\d{1,4})$/;
const partPattern = /^\d{1,4}\.\d{1,4}$/;
const numberPattern = /\d{1,4}/g;

/**
 * Tests compliance of an arbitrary string containing an address.
 *
 * @param {string} address Address to test compliance of.
 * @returns {boolean}
 */
function compliant(address) {
    const matches = address.match(addrPattern);
    if (matches == null)
        return false;

    if (matches[3] && matches[1] === "0.0")
        return false;

    for (const num of address.matchAll(numberPattern)) {
        const numval = parseInt(num);
        if (numval > 4095 || numval < 0)
            return false;
    }

    return true;
}

/**
 * Decodes an address, usually from the network.
 *
 * @param {Buffer} addr
 * @returns {string}
 */
function unparseAddr(addr) {
    if (addr.length === 6)
        return unparseAddr(addr.slice(0, 3)) + ":" + unparseAddr(addr.slice(3, 6));
    else if (addr.length !== 3)
        throw RangeError("Encoded address is not 3 or 6 long");

    const parts = [
        ((addr[0] << 4) | (addr[1] >> 4)).toString(),
        (((addr[1] & 0x0F) << 8) | addr[2]).toString()
    ];

    return parts[0] + "." + parts[1];
}

/**
 * Class containing a validated GERTe address.
 */
export default class Address {
    #internal
    #external

    /**
     * Creates a new validated Address object from a given address.
     *
     * @constructor
     * @param address
     */
    constructor(address) {
        this.address = address;
    }

    set address(address) {
        if (address instanceof Buffer)
            address = unparseAddr(address);
        if (typeof address === "string") {
            if (!compliant(address))
                throw RangeError("Address received an invalid address");
        } else
            throw TypeError("Address received an address that is not a string");

        const matches = address.match(addrPattern);
        if (matches[2]) {
            this.#internal = matches[2];
            this.#external = matches[1];
        } else {
            this.#internal = matches[1];
            this.#external = undefined;
        }
    }

    get address() {
        if (this.external)
            return this.external + ":" + this.internal;
        else
            return this.internal;
    }

    get buffer() {
        const matches = this.address.match(numberPattern);
        const buf = Buffer.alloc((matches.length / 2) * 3);

        const externalUpper = parseInt(matches[0]);
        const externalLower = parseInt(matches[1]);

        buf[0] = externalUpper >> 4;
        buf[1] = ((externalUpper & 0x0F) << 4) | (externalLower >> 8);
        buf[2] = externalLower & 0xFF;

        if (this.#external) {
            const internalUpper = parseInt(matches[2]);
            const internalLower = parseInt(matches[3]);

            buf[3] = internalUpper >> 4;
            buf[4] = ((internalUpper & 0x0F) << 4) | (internalLower >> 8);
            buf[5] = internalLower & 0xFF;
        }

        return buf;
    }

    get external() {
        return this.#external || null;
    }

    set external(newExt) {
        if (typeof newExt !== "string")
            throw TypeError("Address received an address that is not a string");
        else if (!partPattern.test(newExt))
            throw RangeError("Address received an address that is not valid");

        this.#external = newExt;
    }

    get internal() {
        return this.#internal || null;
    }

    set internal(newExt) {
        if (typeof newExt !== "string")
            throw TypeError("Address received an address that is not a string");
        else if (!partPattern.test(newExt))
            throw RangeError("Address received an address that is not valid");

        this.#internal = newExt;
    }

    toString() {
        return this.address;
    }
}
