"use strict";

/*
	Packet:
	
	source:	GERTc source address
	target:	GERTc target address
	data:	NodeJS buffer storing the data
*/

function parseAddr(data) {
	let first = (data[0] << 4) | (data[1] >> 4);
	let second = ((data[1] & 0x0F) << 8) | data[2];
	
	return first.toString() + "." + second.toString();
}

function makePacket(data) {
	if (data.length < 13) {
		throw new Error("data");
	}
	
	let source = parseAddr(data.slice(0, 3)) + ":" + parseAddr(data.slice(3, 6));
	let target = parseAddr(data.slice(6, 9)) + ":" + parseAddr(data.slice(9, 12));
	let len = data[12];
	
	if (data.length < 13 + len) {
		throw new Error("data");
	}
	
	return {
		"source": source,
		"target": target,
		"data": data.slice(13, 13 + len)
	}
}

module.exports = makePacket;
