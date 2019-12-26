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

To be able to use this page, you must first edit the following lines in the JavaScript file **web/res/app.js**

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

![fc011](https://user-images.githubusercontent.com/34987997/71482609-d57d6800-2803-11ea-8204-d6749ce42581.png)

The first thing to do is register a user

![s0](https://user-images.githubusercontent.com/34987997/71482716-50468300-2804-11ea-8b2c-5fc13f7878fe.png)

![s2](https://user-images.githubusercontent.com/34987997/71482170-7cacd000-2801-11ea-9479-bd7cda105539.png)

Then you can log in

![s1](https://user-images.githubusercontent.com/34987997/71482186-9221fa00-2801-11ea-8552-007ad43153de.png)

Under settings you can change the user properties such as password, avatar, contacts and groups.  

![s4](https://user-images.githubusercontent.com/34987997/71482831-f2666b00-2804-11ea-84fb-452d432f9e74.png)

![s5](https://user-images.githubusercontent.com/34987997/71482221-c0073e80-2801-11ea-84b0-9645c8d92647.png)

![s6](https://user-images.githubusercontent.com/34987997/71482231-cac1d380-2801-11ea-965c-4b6b4a44a216.png)

## User, groups and contacts setting


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

