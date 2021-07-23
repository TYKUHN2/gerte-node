/*
	Exported variables:
	
	version:	GERTe protocol version (byte encoded)
	api:		API version (string encoded)
	Connection:	Connection class for connecting to GERTe
	Address: Address that represents a device
	Identity: GERTe Identity containing an external address and a key
	Packet: A packet containing a source, destination, and data.
*/

export let  version = "\2\0",
            api = "2.0.0";

export { default as Connection } from "Classes/Connection";
export { default as Address } from "Classes/Address";
export { default as Identity } from "Classes/Identity";
export { default as Packet } from "Classes/Packet";
