import Address from "Address";

export default class Packet {
    #source;
    #destination;
    #data;

    /**
     * Creates a new packet from two addresses and data.
     *
     * @param {Address} source
     * @param {Address} destination
     * @param {string | Buffer} data
     */
    constructor(source, destination, data) {
        this.source = source;
        this.destination = destination;
        this.data = data;
    }

    get source() { return this.#source; }
    set source(address) {
        if (!address instanceof Address)
            throw TypeError("Packet source is not an address");

        this.#source = address;
    }

    get destination() { return this.#destination; }
    set destination(address) {
        if (!address instanceof Address)
            throw TypeError("Packet destination is not an address");

        this.#destination = address;
    }

    get data() { return this.#data; }
    set data(data) {
        if (typeof data === "string")
            data = Buffer.from(data);

        if (!data instanceof Buffer)
            throw TypeError("Packet data is not a string or buffer");

        this.#data = data;
    }
}
