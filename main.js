/*
	Exported variables:
	
	version:	GERTe protocol version (byte encoded)
	api:		API version (byte encoded)
	Connection:	Connection class for connecting to GERTe
	Config:		Config function that returns a array of peers
*/

exports["version"] = "\1\1";
exports["api"] = "\1\1\1";
exports["Connection"] = require("./Classes/Connection.js");
exports["Config"] = require("./Classes/Config.js");
