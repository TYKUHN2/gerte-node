const net = require("net");
const Event = require("events");
const Version = require("../main.js").version;
const Packet = require("./Packet.js");
const Status = require("./Status.js");

function convAddr(addr) {
	let parts = addr.split(".");
	let buf = Buffer.alloc(3);
	
	parts[0] = parseInt(parts[0], 10);
	parts[1] = parseInt(parts[1], 10);
	
	buf[0] = parts[0] >> 4;
	buf[1] = ((parts[0] << 4) & 0xF0) | parts[1] >> 8;
	buf[2] = parts[1] & 0xFF;
	
	return buf;
}

function ondata(data) {
	if (this._buffer.length > 0) {
		data = Buffer.concat([this._buffer, data], this._buffer.length + data.length);
	}
	
	while (data.length > 0) {
		switch(data[0]) {
			case 0x00:
				let status;
			
				try {
					status = Status(data.slice(1));
					
					this.emit("status", status);
					data = data.slice(1 + status.size);
					break;
				} catch (e) {
                    this._buffer = data;
					
					if (e.message != "data") {
						throw e;
					} else {
						return;
					}
				}
			case 0x01:
				throw new Error("GEDS returned an invalid command [REGISTER]");
			case 0x02:
				let packet;
				
				try {
					packet = Packet(data.slice(1));
					
					this.emit("data", packet);
					data = data.slice(14 + packet.data.length);
					break;
				} catch (e) {
                    this._buffer = data;
					
					if (e.message != "data") {
						throw e;
					} else {
						return;
					}
				}
			case 0x03:
				this.emit("close");
				data = data.slice(1);
		}
    }

    this._buffer = new Buffer.alloc(0);
}

/*
	EVENTS:
	
	error:		(Error error)		Connection error occurred during negotiation.
	connected:	()					Connection has finished negotiating.
	status:		(Status status)		GEDS has sent a new STATUS message. Connection will internally handle this.
	registered:	(String address)	GEDS has accepted the address-key pair and data can now be sent.	NOTE: If address is "" then it is unknown
	data:		(Packet data)		GEDS has sent a new data packet.
	close:		()					The connection has been closed through one of many means.
	
	FUNCTIONS:
	
	send:		(String target, String source, String/Buffer data)	(Promise)	Send data to a specified GERTc target from the GERTi source. Data cannot be bigger than 255 bytes. Returns a promise for the result which will be null on success and the error code on failure (resolve vs reject.)
	register:	(String address, String key)                        ()     		Register the GERTe address using the 20 byte key. Does not return, listen for the registered event.
    close:      ()                                                  ()          Safely closes the connection.
	
	VARIABLES:
	address:	The currently registered GERTe address or an empty string if not registered. Can be "unknown".
*/

function onSocketClose() {
	this.emit("close");
};

function onClose() {
	this._socket.off("close", onSocketClose);
	this._socket.destroy();
}

function onConnected(status) {
	if (status.state == "connected") {
		this.emit("connected");
		this.on("status", onStatus);
	} else {
		this.emit("error", new Error("GEDS did not accept the connection."));
	}
}

function onRegistered(status, newAddr) {
	if (status.state == "assigned") {
		this._addr = newAddr;
		this.emit("registered", newAddr);
		return;
	} else if (status.state == "failure") {
		if (status.error == "already registered") {
			this.emit("error", new Error("GEDS reported a double registration"));
			this._addr = "unknown";
			this.emit("registered", "")
			return;
		} else if (status.error == "bad key") {
			this.emit("error", new Error("GEDS rejected the supplied key"));
			return;
		} else if (status.error == "address taken") {
			this.emit("error", new Error("GEDS reports that the requested address is already claimed"));
			return;
		}
	} else {
		this.once("status", (status) => {
			onRegistered.call(this, status, newAddr);
		});
	}
}

function onStatus(status) {
    if (status.state == "failure") {
        if (status.error == "not registered") {
            this._addr = "";
            this.emit("error", "GEDS lost the registration");
            this._outstanding.pop().reject("not registered");
        } else if (status.error == "no route") {
            this._outstanding.pop().reject("no route");
        }
    } else if (status.state == "sent") {
        this._outstanding.pop().resolve();
    } else if (status.state == "closed") {
        this.emit("close");
    }
}

class Connection extends Event {
    constructor(port, ip) {
        super();

		let _this = this;
		
        let socket = net.connect(port, ip, () => {
			socket.on("data", (data) => {
				ondata.call(_this, data);
			});
			
			this.once("status", onConnected);
			
			this.on("close", onClose);
			
			socket.on("close", () => {
				onSocketClose.call(_this);
            });

            socket.write(Version);
            _this._connected = true;
		});
		
        socket.on("error", (e) => {
            if (e.code == "ECONNRESET" || e.code == "ECONNREFUSED" || e.code == "ETIMEDOUT" ) {
                return;
            }

			_this.emit("error", e);
			this.destroy();
		});
		
		this._socket = socket;
		this._addr = "";
        this._buffer = new Buffer.alloc(0);
        this._outstanding = [];
        this._connected = false;
	}
	
	send(tgt, src, data) {
		if (this._socket.destroyed) {
			throw new Error("Connection has been destroyed");
		} else if (this._addr == "") {
			throw new Error("Connection has not been registered");
		}
		
		if (typeof(data) == "string") {
			data = Buffer.from(data);
		}
		
		if (data.length > 255) {
			throw new Error("Data cannot exceed 255 bytes");
		}
		
		tgt = tgt.split(":");
		let tgte = convAddr(tgt[0]);
		let tgti = convAddr(tgt[1]);
		src = convAddr(src);
		
		let packet = Buffer.alloc(11 + data.length);

        packet[0] = 0x02;
		tgte.copy(packet, 1);
		tgti.copy(packet, 4);
		src.copy(packet, 7);
		packet[10] = data.length;
		data.copy(packet, 11);
		
		this._socket.write(packet);
		
		let promise = new Promise((resolve, reject) => {
			this._outstanding.push({
				"resolve": resolve,
				"reject": reject
			});
		});
		
		return promise;
	}
	
	register(newAddr, key) {
		if (this._socket.destroyed) {
			throw new Error("Connection has been destroyed");
		} else if (this._addr != "") {
			throw new Error("Connection has already been given an address");
		} else if (this._addr == "unknown") {
			console.warn("Connection is registered but address is unknown, assuming the address set was intended to fix this");
			this._addr = newAddr;
			return;
		} else if (key.length != 20) {
			throw new Error("Provided key is not the correct length");
		}
		
		let data = convAddr(newAddr);
		
		let packet = Buffer.alloc(24);
		packet[0] = 0x01;
		data.copy(packet, 1);
        packet.write(key, 4, 20);

		if (!this._connected) {
			this.on("connected", () => {
				this._socket.write(packet);
				
				this.once("status", (status) => {
					onRegistered.call(this, status, newAddr);
				});
			});
        } else {
            this._socket.write(packet);

			this.once("status", (status) => {
				onRegistered.call(this, status, newAddr);
			});
		}
	}
	
	get address() {
		return this._addr || "none";
    }

    close() {
        this._socket.write(0x03);
        this._socket.end();
    }
}

module.exports = Connection;