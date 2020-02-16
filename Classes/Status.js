"use strict";

/*
	Status:
	
	state:		State as reported by GEDS
	error:		If GEDS reported a failure, this error will be set to it
	version:	If GEDS finished the handshake, the version the connection is using
	spare:		Any data returned by GEDS not used in constructing the Status
	size:		Used internally to determine how much data was processed
*/

function getError(data) {
	switch(data) {
		case 0:
			return "version";
		case 1:
			return "bad key";
		case 2:
			return "already registered";
		case 3:
			return "not registered";
		case 4:
			return "no route";
		case 5:
			return "address taken";
		default:
			return "unknown";
	}
}

function makeStatus(data) {
	let Status = {
		"state": "unknown",
		"size": 0
	};
	
	switch(data[0]) {
		case 0:
			Status.state = "failure";
			Status["error"] = getError(data[1]);
			
			Status.size = 2;
			return Status;
		case 1:
			Status.state = "connected";
			
			Status.size = 1;
			return Status;
		case 2:
			Status.state = "assigned";
			
			Status.size = 1;
			return Status;
		case 3:
			Status.state = "closed";
			
			Status.size = 1;
			return Status;
		case 4:
			Status.state = "sent";
			
			Status.size = 1;
			return Status;
	}
}

module.exports = makeStatus;