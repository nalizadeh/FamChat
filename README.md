# FamChat

![famchat](https://user-images.githubusercontent.com/34987997/71326782-0e65c600-2500-11ea-9c27-8ee2a03d24f7.png)

FamChat is a small but powerfull web chat app. It uses the TooTallNate_Java_WebSocket library. 
It can be used in any browser on desktop, android or ios.

FamChat offers a simple chat service through websockets. Using this technology means extremely low data usage. 
It runs on browser without app installation, so you can start chatting with clients immediately using your 
favorite web browser. Web browsers are common on smartphones, desktop/laptops or smart TVs. 

The messages or credentials or any file will be stored on your own server. Your chat is completely private 
within the channel you are subscribed.

Sinse it also comes with a webserver you don'nt need to have a provider.

## Getting Started

In order to access the FamChat from outside of your local network you have to make a few settings on your 
router and firewall. These include, for example, port sharing or forwarding for HTTP / HTTPS and WS / WSS. 
You may also have to set up your own certificates to use HTTPS and WSS. 

The default settings for ports are as follows

```
HTTP: 8080
HTTPS: 443

WS: 8181
WSS: 444 
```

### Installing

The installation consists of just a few steps. Simply copy the directory **web** to any location and edit the 
FamChat.conf file, then start the executable **FamChat.jar**

```
########################################
# Root configuration
########################################

FamChat_ROOT:/works/workspace/NmdrChat/web/

########################################
# Port configuration
########################################

FamChat_WS_Port:8080
FamChat_CS_Port:8181

########################################
# Secure port configuration
########################################

FamChat_WS_SS_Port:443
FamChat_CS_SS_Port:444

########################################
# SSL configuration
########################################

FamChat_KEYSTORE:/res/cert/nalizadeh.dynv6.net_nalizadehca.p12
FamChat_STOREPASSWORD:xxxxxx
FamChat_KEYPASSWORD:xxxxxx

########################################
# email configuration
########################################

FamChat_SMTP_HOST:mail.gmx.net
FamChat_SMTP_PORT:587
FamChat_SMTP_USER:<user>
FamChat_SMTP_PWD:<password>
```

## Running the server

The server comes with a graphical user interface.

![fc01](https://user-images.githubusercontent.com/34987997/71380406-51429f00-25cf-11ea-9f32-fffb974580ae.png)

The information about the root directory and the ports have already been read from the configuration file. 
These can also be changed here at any time. Before changing these settings, however, the HTTP server and chat server 
must be stopped and restarted. The buffer size for log output can also be determined here.

That is all you have to do on the server. 

## Client site settings

FamChat offers a nice HTML page. 

![fc2](https://user-images.githubusercontent.com/34987997/71380707-90252480-25d0-11ea-954d-a3769e53c587.png)

To be able to use this page, you must first adapt the following lines in the JavaScript file **web/res/app.js**

```
//=======================================================
// Public settings (needs to be adapted to your network)
//=======================================================

const MY_DOMAIN = "nalizadeh.dynv6.net";
const MY_HTTP_PORT = "8080";
const MY_HTTPS_PORT = "443";
const MY_WS_PORT = "8181";
const MY_WSS_PORT = "444";
```

## Using client chat app

Simply call `http://localhost:8080` in your browser. 

Depending on how the server is started, you can call the FamChat secure or unencrypted.

## Used libraries

TooTallNate Java_WebSocket
https://github.com/TooTallNate/Java-WebSocket

JSON
gson-2.8.5.jar

Java Mail
javax.mail.jar

## Built With

Eclipse 

## Minimum Required JDK

Java 1.7 and higher

## Authors

nalizadeh.org

## License

FamChat is licensed under an MIT license. See the `LICENSE` file for specifics.

