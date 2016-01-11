# homebridge-VeraLite
Vera plugin for homebridge

This plugin is created to connect Vera to your homekit using homebridge by nfarina. (https://github.com/nfarina/homebridge)


#Installation
##Working progress (Using OsX as an example)

Step 1: Install HomeBridge  
$ sudo npm install -g homebridge  
  
Step 2: Run HomeBridge  
$ homebridge  
You should see the following message (if no plugins are installed)  
No plugins found. See the README for information on installing plugins.  
Couldn't find a config.json file at '/Users/bertinjacobs/.homebridge/config.json'. Look at config-sample.json for examples of how to format your config.js and add your home accessories.  

#Configuration
Edit the config.json file by adding the IP of your Vera.
The plugin has the ability to ignore certain device ID's. Just add these ID's as shown in the sample-config.json file.

#Supported Devices
The following devices have been tested:

* VeraLite UI7 (Although it shoud work on Vera3 and VeraEdge)
* Fibaro Dimmer
* Fibaro Dimmer 2
* Fibaro RGBW (Yes! It has a colour wheel)
* Aeon Gen5 6-in-1 Sensor 

#Known Issues
The Aeon sensor seems to be only partially supported. This could be due to functionality issues on the front-end apps.


