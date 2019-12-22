# FamChat

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

My default settings for ports are as follows

```
HTTP: 8080
HTTPS: 443

WS: 8181
WSS: 444 
```

### Installing

The installation consists of just a few steps. Simply copy the directory web to any location and edit the 
FamChat.conf file. Then start the executable FamChat.jar.  

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
# email configuration
########################################

FamChat_SMTP_HOST:mail.gmx.net
FamChat_SMTP_PORT:587
FamChat_SMTP_USER:<user>
FamChat_SMTP_PWD:<password>
```

## Running the server

The server comes with a graphical user interface.

The information about the root directory and the ports have already been read from the configuration file. 
These can also be changed here at any time. Before changing these settings, however, the HTTP server and chat server 
must be stopped and restarted. The buffer size for log output can also be determined here.

That is all you have to do on the server. 

## Using client chat app

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

nalizadeh.org

## License

FamChat is an open source project.

## Acknowledgments

nalizadeh.org

