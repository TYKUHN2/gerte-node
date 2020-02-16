# Changelog
This changelog adheres to Semantic Versioning with a slight twist:  
*The first version is the API, the second is the protocol the API implements.*

## v1.1.1 - v1.1.0
Increment node requirement
Added API version to exports, see `api`
Fixed error in processing CONNECTED status
Fixed error where CONNECTED event required data not present
Moved the onRegister re-registration into an else block
Removed connection version information, the API cannot get this easily
Specified hex versus using a string in the close method.

## v1.1.0
First release of the GERTe NodeJS gateway
