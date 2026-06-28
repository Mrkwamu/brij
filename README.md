# Brij 

**API Key management infrastructure for developer**
 
## What is Brij? 

 Brij is a backend service that handles API access. Instead of building you own key issuance, hashing, validation, rotation and revocation logic, you point your API at Brij's verify endpoint. It tells you whether the incomin key is valid, the permissions it carries and how many requests are left.
