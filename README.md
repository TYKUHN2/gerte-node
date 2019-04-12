# GERTe Gateway (NodeJS)
*This repository is dedicated to the NodeJS version of the GERTe Gateway*  
For more information on GERTe or its gateways see the [main repository.](https://github.com/GlobalEmpire/GERT)

## Installing
Simply install the npm package (`npm i gerte` or other methods) and `require` it.

## Usage
The API provided by this package has two parts: *Config* and *Connection*.

### Reading Configuration
The API can read configuration files often distributed with GERTe gateways via the `Config` function exported by the main file.  
To read a configuration file, simply pass the filename into the `Config` function which will then attempt to synchronously read the file and return an array of "peers" it finds within the file.  
The peer objects have three values: `ip`, `gport`, and `pport`. For the purposes of this API, only `ip` and `gport` are needed.

### Connecting to GEDS
The main file exports a class called `Connection` which, when constructed, connects to and negotiates with the selected GEDS server.  
To construct a `Connection` call `new Connection(port, ip)` where `port` is a number and `ip` is a string.

The `Connection` class has the following events: *error*, *connected*, *status*, *registered*, *data*, and *close*. Socket errors beyond `ECONNRESET`, `ECONNREFUSED`, and `ETIMEDOUT` will be emitted by the `Connection` class as well.

#### Events
Most applications will only require the *registered* and *data* events, with *close* and *error* for safety. *connected*, and *status* are not required as the internal implementation will use them.

#### Registering an Address
***This documentation assumes you already have an address from the GERT maintainers.***  
In order to register an address, call `Connection.register(address, key)` where address is a string with a valid GERTe dot format address and key is a valid 20-byte string.  
*If the gateway has not finished negotiating the registration will be deferred until the negotiation is complete.*

Once registration is complete, the `Connection` object will emit a *registered* event with the address as an argument.

The current address as known by the gateway can be retrieved from `Connection.address`.  
*Note: This address can be either an empty string if no known address is registered, `unknown` if the address is unknown due to a reported error, or a GERTe dot format address.*

#### Sending Data
*Reminder: Sending and receiving data requires being registered*  
*Prior to sending data, ensure the* registered *event has been thrown*  
To send data call `Connector.send(tgt, src, data)` where tgt is a dot-colon format GERTc address, src is a dot format GERTi address, and data is either a string or a buffer.  
***Data cannot exceed 255 bytes excluding headers***

The function will return a promise. The promise will be resolved on a positive response from GEDS or rejected with the error message on a negative response from GEDS.

#### Receiving Data
*Reminder: Sending and receiving data requires being registered*  
When the API receives data from GEDS it will be parsed into an object and emitted in a *data* event.  
The data object has three values: `source`, `target`, `data`.  
The source address is a GERTc dot-colon format address from which the message was sent, the target address is a GERTc dot-colon format address to which the message is addressed, and data is a buffer of the data received.

#### Closing the Connection
Whilst NodeJS and GEDS should be able to handle practically any form of closure, a safe way to ensure the address is freed is to call `Connection.close()` and await the *close* event.  
Calling `Connection.close()` immediately sends a close request to GEDS and shutdowns the writing functionality of the connection. The *close* event will be thrown once GEDS responds to the request.

## Licensing
The project is currently listed as `UNLICENSED` otherwise known as "all rights reserved."  
This has more to do with a rush to publish and less to do with restrictions on modifications. General rule: play nice.  
*Give credit where credit is due, be willing to submit your changes to this repository, do not "steal" outside reasonable redistribution, etc.*

Officially all rights are reserved but if you play nice there is no reason to worry.
