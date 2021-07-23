/*
	Exported variables:
	
	version:	GERTe protocol version (byte encoded)
	api:		API version (string encoded)
	Connection:	Connection class for connecting to GERTe
	Address: Address that represents a device
	Identity: GERTe Identity containing an external address and a key
	Packet: A packet containing a source, destination, and data.
*/

exports["version"] = "\2\0";
exports["api"] = "2.0.0";
exports["Connection"] = require("./Classes/Connection");
exports["Address"] = require("./Classes/Address");
exports["Identity"] = require("./Classes/Identity");
exports["Packet"] = require("./Classes/Packet");
