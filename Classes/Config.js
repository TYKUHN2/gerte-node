"use strict";

const fs = require("fs");

/*
	Config:
	
	ip:		IP address of the peer
	gport:	Port for gateway connections
	pport:	Port for peer connections
*/

function readConfig(filename) {
	let data = fs.readFileSync(filename);
		
	let peers = [];
		
	for (i = 0; i < data.length; i++) {
		let peer = {
			"ip": data[i++].toString() + "." + data[i++].toString() + "." + data[i++].toString() + "." + data[i++].toString(),
			"gport": data.readUint16BE(i++),
			"pport": data.readUint16BE(++i)
		}
		
		i += 2;
		peers.push(peer);
	}
	
	return peers;
}

module.exports = readConfig;