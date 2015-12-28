///////////////////////////////////////
// VeraLite Plugin for HomeBridge    //
// Version 2015_1228.0               //
// Author: Bertin					 //
///////////////////////////////////////

var Service, Characteristic;
var request = require("request");
var valueH, valueS, valueV;
var readValue = 0;

function VeraLitePlatform(log, config) {
	this.log          = log;
  	this.host     = config["VeraIP"];
  	this.excludedid =  config["excludeID"];
	//pollVera( this );	
}

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform("homebridge-VeraLite", "VeraLite", VeraLitePlatform);
}

VeraLitePlatform.prototype = {
	
	accessories: function(callback) {
	
		this.log("Looking for devices on VeraLite (" + this.host + ")...");
			
		var url = "http://" + this.host + ":3480/data_request?id=lu_sdata";
		var that = this;
		var DiscoveredAccessories = [];
		var exludelist = this.excludedid;;
		
		
		
		request({ url: url, json: true },
        function (error, response, body)
        {
            //console.log(body.devices);
            body.devices.forEach(function(device)
    		{
    			for (var i = 0; i < exludelist.length; i++){
    				
    				if (device.id == exludelist[i]){
    					that.log("Skipping device: " + device.id);
    					device.category = 0;
    					}
    			}//for
    			//Check HomeKitTypes.js for devices
    			switch (device.category)
        		{
            		case 2: 
                		that.log("Found dimmable device: " + device.name + " with status " + device.status + " at level " + device.level);
                		var accessory = null;
                		accessory = new VeraBridgedAccessory([{controlService: new Service.Lightbulb(device.name), characteristics: [Characteristic.On, Characteristic.Brightness]}]);
                		break;
            		case 3: 
                		that.log("Found switched device: " + device.name);
                		var accessory = null;
                		accessory = new VeraBridgedAccessory([{controlService: new Service.Lightbulb(device.name), characteristics: [Characteristic.On]}]);
                		break;
                	case 4:
                		that.log("Found motion sensor device: " + device.name);
                		accessory = new VeraBridgedAccessory([{controlService: new Service.MotionSensor(device.name), characteristics: [Characteristic.MotionDetected]}]);
                		break;
                	case 16:
                		that.log("Found humidity sensor device: " + device.name);
                		accessory = new VeraBridgedAccessory([{controlService: new Service.HumiditySensor(device.name), characteristics: [Characteristic.CurrentRelativeHumidity]}]);
                		break;
                	case 17:
                		that.log("Found temperature sensor device: " + device.name);
                		accessory = new VeraBridgedAccessory([{controlService: new Service.TemperatureSensor(device.name), characteristics: [Characteristic.CurrentTemperature]}]);
                		break;
                	case 18:
                		that.log("Found light sensor device: " + device.name);
                		accessory = new VeraBridgedAccessory([{controlService: new Service.LightSensor(device.name), characteristics: [Characteristic.CurrentAmbientLightLevel]}]);
                		break;
                	default:
                		that.log("Device not recognised... Skipping category: " + device.category);
                }//switch
                
        		if (device.color != undefined) {
        			that.log("Found colour device: " + device.name);
        			accessory = new VeraBridgedAccessory([{controlService: new Service.Lightbulb(device.name), characteristics: [Characteristic.On, Characteristic.Brightness, Characteristic.Hue, Characteristic.Saturation]}]);
                	
        		}
        		
        		if (accessory != null) {
        			
					accessory.getServices = function() {
  							return that.getServices(accessory);
  					};
  					  					
  					accessory.platform 			= that;
  					
				  	accessory.remoteAccessory	= device;
  					accessory.id 				= device.id;
  					accessory.name				= device.name;
  					accessory.model				= "Vera Accessory";
  					accessory.manufacturer		= "zWave Device";
  					accessory.serialNumber		= "Vera Device id:" + device.id;
            		DiscoveredAccessories.push(accessory);
            	}    
        
    		});//ForEach
    		    		
            callback(DiscoveredAccessories);            
        }
        
    );		
	},//Accessories
	
	command: function(commandSet ,value, that) {
		console.log("---------------------------------------");
		console.log("Commands received: " + commandSet + " for device: " + that.id);
		console.log("---------------------------------------");
		var url = null;
		var setColour = "000000";
	
		switch (commandSet){
			case "turnOn": 
               	url = "http://"+this.host+":3480/data_request?id=lu_action&output_format=xml&DeviceNum=" + that.id + "&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=1";
               	break;
            case "turnOff":
                 url = "http://"+this.host+":3480/data_request?id=lu_action&output_format=xml&DeviceNum=" + that.id + "&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=0";
                break;
            case "setDim":
            	url = "http://" + this.host + ":3480/data_request?id=lu_action&output_format=xml&DeviceNum=" + that.id + "&serviceId=urn:upnp-org:serviceId:Dimming1&action=SetLoadLevelTarget&newLoadlevelTarget=" + value;
                break;                
            case "setHue": 
            	console.log("Setting Hue: " + value );
            	valueH = value;            	
            	console.log("Setting for LED: " + valueH + " " + valueS);
            	setColour = SetColourWheel();  
            	console.log("Colour: " + setColour);
            	url = "http://"+this.host +":3480/data_request?id=lu_action&output_format=xml&DeviceNum=19&serviceId=urn:upnp-org:serviceId:RGBController1&action=SetColorTarget&newColorTargetValue="+setColour;	          	
            	break;
            case "setSat":
            	console.log("Setting Saturation: " + value);
            	valueS = value;
            	console.log("Setting for LED: " + valueH + " " + valueS);
            	setColour = SetColourWheel();
            	console.log("Colour: " + setColour);
            	url = "http://"+this.host +":3480/data_request?id=lu_action&output_format=xml&DeviceNum=19&serviceId=urn:upnp-org:serviceId:RGBController1&action=SetColorTarget&newColorTargetValue="+setColour;
          			
            	break;          
        }//Switch
        
       
  		var body = value != undefined ? JSON.stringify({
		  	"args": [	value ]
		}) : null;
	
   		request.get({url: url},
            function(err, response, body) {		
                if (!err && response.statusCode == 200)
                {
                	console.log("Success!");
                }
                else
                {
                    console.log(err);
                }
            }
        );
  	},//Command
    
	getAccessoryValue: function(callback, homebridgeAccessory, readDim) {
    
    	console.log("---------------------------------------");
    	console.log("Reading device "+homebridgeAccessory.name + "("+homebridgeAccessory.id+")");
    	console.log("---------------------------------------");
    
    	if (readDim){
    		console.log("Reading dimming level!");
    		var url = "http://"+this.host +":3480/data_request?id=variableget&DeviceNum="+homebridgeAccessory.id+"&serviceId=urn:upnp-org:serviceId:Dimming1&Variable=LoadLevelStatus";
    	}
    	else {
    		console.log("Reading device on/off");
    		var url = "http://"+this.host +":3480/data_request?id=variableget&DeviceNum="+homebridgeAccessory.id+"&serviceId=urn:upnp-org:serviceId:SwitchPower1&Variable=Status";
    	}	
    
    
    request({url:url}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
    	
        console.log("body: " + body); // Show the HTML for the Modulus homepage.
        readValue = body;
        
        console.log("ReadValue: " + readValue);
    	readValue = parseInt(readValue);
		callback(null,readValue);
        
    }
    else{
    	console.log(error);
    	callback(error);
    }
	});
	
  },//getAccessoryValue
  
getAccessoryHue: function(callback, homebridgeAccessory) {
    
    console.log("---------------------------------------");
    console.log("Reading device Hue: "+homebridgeAccessory.name + "("+homebridgeAccessory.id+")");
    console.log("---------------------------------------");
    
    url ="http://"+this.host +":3480/data_request?id=lu_action&output_format=json&DeviceNum=19&serviceId=urn:upnp-org:serviceId:RGBController1&action=GetColor"
    
   
    request({url:url, }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
    	
    	//var newBody = body.match(#/d+/g);
    	var n = body.indexOf("#") + 1;
    	var r,g,b;
    	
    	r = body.substr(n,2);
    	g = body.substr(n+2,2);
    	b = body.substr(n+4,2);
    	
    	console.log ("Colour to convert: "+r+" " + g+ " " +b);
    	
    	//r = r.toString(10);
    	r = parseInt(r, 16);
    	g = parseInt(g, 16);
    	b = parseInt(b, 16);
    	
    	console.log (r+" " + g+ " " +b);
    	
    	r = r/255;
    	g = g/255;
    	b = b/255;
    	
    	console.log (r+" " + g+ " " +b);
    	var Cmax = Math.max(r,g,b);
    	var Cmin = Math.min(r,g,b);
    	console.log("Max: " + Cmax + " Min: " + Cmin);
    	
    	var Delta = Cmax-Cmin;
    	
    	console.log("Delta: " + Delta);
    	
    	if (Delta == 0){
    		valueH=0;
    	}
    	else if (Cmax == r)
    	{	
    		valueH = (g-b)/Delta;
    		valueH = valueH % 6;
    		valueH = valueH*60;
    	}
    	else if (Cmax == g)
    	{	
    		valueH = (b-r)/Delta;
    		valueH = valueH + 2;
    		valueH = valueH*60;
    	}
    	else if (Cmax == b)
    	{	
    		valueH = (r-g)/Delta;
    		valueH = valueH + 4;
    		valueH = valueH*60;
    	}
    	
    	if (valueH < 0){
    		valueH = 360 + valueH;
    	}
    	
    	
    	if (Cmax == 0) {
    		valueS = 0;
    	}
    	else{
    		valueS = Delta/Cmax;
    	}
    	
    	valueV = Cmax;
    	
    	valueH = Math.round(valueH);
    	valueS = valueS* 100;
    	valueV = valueV * 100;
    	console.log("valueH: " + valueH);
    	console.log("valueS: " + valueS);
    	console.log("valueV: " + valueV);
    	
        
        
        console.log("Returning Hue: " + valueH);
        	
	callback(null,valueH);
        
    }
	});
},//getAccessoryHue

getAccessorySat: function(callback, homebridgeAccessory) {
    
    console.log("---------------------------------------");
    console.log("Reading device Saturation: "+homebridgeAccessory.name + "("+homebridgeAccessory.id+")");
    console.log("---------------------------------------");
    
    url ="http://"+this.host +":3480/data_request?id=lu_action&output_format=json&DeviceNum=19&serviceId=urn:upnp-org:serviceId:RGBController1&action=GetColor"
    
    request({url:url, }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
    	
    	//var newBody = body.match(#/d+/g);
    	var n = body.indexOf("#") + 1;
    	var r,g,b;
    	
    	r = body.substr(n,2);
    	g = body.substr(n+2,2);
    	b = body.substr(n+4,2);
    	
    	console.log ("Colour to convert: "+r+" " + g+ " " +b);
    	
    	//r = r.toString(10);
    	r = parseInt(r, 16);
    	g = parseInt(g, 16);
    	b = parseInt(b, 16);
    	
    	console.log (r+" " + g+ " " +b);
    	
    	r = r/255;
    	g = g/255;
    	b = b/255;
    	
    	console.log (r+" " + g+ " " +b);
    	var Cmax = Math.max(r,g,b);
    	var Cmin = Math.min(r,g,b);
    	console.log("Max: " + Cmax + " Min: " + Cmin);
    	
    	var Delta = Cmax-Cmin;
    	
    	console.log("Delta: " + Delta);
    	
    	if (Delta == 0){
    		valueH=0;
    	}
    	else if (Cmax == r)
    	{	
    		valueH = (g-b)/Delta;
    		valueH = valueH % 6;
    		valueH = valueH*60;
    	}
    	else if (Cmax == g)
    	{	
    		valueH = (b-r)/Delta;
    		valueH = valueH + 2;
    		valueH = valueH*60;
    	}
    	else if (Cmax == b)
    	{	
    		valueH = (r-g)/Delta;
    		valueH = valueH + 4;
    		valueH = valueH*60;
    	}
    	
    	if (valueH < 0){
    		valueH = 360 + valueH;
    	}
    	
    	
    	if (Cmax == 0) {
    		valueS = 0;
    	}
    	else{
    		valueS = Delta/Cmax;
    	}
    	
    	valueV = Cmax;
    	
    	valueH = Math.round(valueH);
    	valueS = valueS* 100;
    	valueV = valueV * 100;
    	console.log("valueH: " + valueH);
    	console.log("valueS: " + valueS);
    	console.log("valueV: " + valueV);
    	
        console.log("Returning Saturation: " + valueS);
        	
    //readValue = parseInt(readValue);
	callback(null,valueS);
        
    }
	});
},//getAccessorySat

getAccessoryMotionDetection: function(callback, homebridgeAccessory) {
    
    	console.log("---------------------------------------");
    	console.log("Reading device "+homebridgeAccessory.name + "("+homebridgeAccessory.id+")");
    	console.log("---------------------------------------");
    
    	var url = "http://"+this.host +":3480/data_request?id=variableget&DeviceNum="+homebridgeAccessory.id+"&serviceId=urn:micasaverde-com:serviceId:SecuritySensor1&Variable=Tripped";
    
    request({url:url}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
    	
        console.log("body: " + body); // Show the HTML for the Modulus homepage.
        readValue = body;
        
        console.log("ReadValue: " + readValue);
    	readValue = parseInt(readValue);
		callback(null,readValue);
        
    }
    else{
    	console.log(error);
    	callback(error);
    }
	});
	
  },//getAccessoryMotionDetection
  
getAccessoryLux: function(callback, homebridgeAccessory) {
    
    	console.log("---------------------------------------");
    	console.log("Reading device "+homebridgeAccessory.name + "("+homebridgeAccessory.id+")");
    	console.log("---------------------------------------");
    
    	var url = "http://"+this.host +":3480/data_request?id=variableget&DeviceNum="+homebridgeAccessory.id+"&serviceId=urn:micasaverde-com:serviceId:LightSensor1&Variable=CurrentLevel";
    
    request({url:url}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
    	
        console.log("body: " + body); // Show the HTML for the Modulus homepage.
        readValue = body;
        
        console.log("ReadValue: " + readValue);
    	readValue = parseInt(readValue);
		callback(null,readValue);
        
    }
    else{
    	console.log(error);
    	callback(error);
    }
	});
	
  },//getAccessoryLux

getAccessoryHumidity: function(callback, homebridgeAccessory) {
    
    	console.log("---------------------------------------");
    	console.log("Reading device "+homebridgeAccessory.name + "("+homebridgeAccessory.id+")");
    	console.log("---------------------------------------");
    
    	var url = "http://"+this.host +":3480/data_request?id=variableget&DeviceNum="+homebridgeAccessory.id+"&serviceId=urn:micasaverde-com:serviceId:HumiditySensor1&Variable=CurrentLevel";

    
    request({url:url}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
    	
        console.log("body: " + body); // Show the HTML for the Modulus homepage.
        readValue = body;
        
        console.log("ReadValue: " + readValue);
    	readValue = parseInt(readValue);
		callback(null,readValue);
        
    }
    else{
    	console.log(error);
    	callback(error);
    }
	});
	
  },//getAccessoryHumidity
  
getAccessoryTemperature: function(callback, homebridgeAccessory) {
    
    	console.log("---------------------------------------");
    	console.log("Reading device "+homebridgeAccessory.name + "("+homebridgeAccessory.id+")");
    	console.log("---------------------------------------");
    
    	var url = "http://"+this.host +":3480/data_request?id=variableget&DeviceNum="+homebridgeAccessory.id+"&serviceId=urn:upnp-org:serviceId:TemperatureSensor1&Variable=CurrentTemperature";
    
    request({url:url}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
    	
        console.log("body: " + body); // Show the HTML for the Modulus homepage.
        readValue = body;
        
        console.log("ReadValue: " + readValue);
    	readValue = parseInt(readValue);
		callback(null,readValue);
        
    }
    else{
    	console.log(error);
    	callback(error);
    }
	});
	
  },//getAccessoryTemperature
	
getInformationService: function(homebridgeAccessory) {		
    var informationService = new Service.AccessoryInformation();
    informationService
                .setCharacteristic(Characteristic.Name, homebridgeAccessory.name)
				.setCharacteristic(Characteristic.Manufacturer, homebridgeAccessory.manufacturer)
			    .setCharacteristic(Characteristic.Model, homebridgeAccessory.model)
			    .setCharacteristic(Characteristic.SerialNumber, homebridgeAccessory.serialNumber);
  	return informationService;
  },//getInformationServices
  
getServices: function(homebridgeAccessory) {
  	var services = [];
  	var informationService = homebridgeAccessory.platform.getInformationService(homebridgeAccessory);
  	services.push(informationService);
  	
  	for (var s = 0; s < homebridgeAccessory.services.length; s++){
  		var service = homebridgeAccessory.services[s];
  		for (var i=0; i < service.characteristics.length; i++) {
  			var characteristic = service.controlService.getCharacteristic(service.characteristics[i]);
			homebridgeAccessory.platform.bindCharacteristicEvents(characteristic, service, homebridgeAccessory);
  		}//for i
  		
  	services.push(service.controlService);	
  	}//for s
  	
    return services;
  },  //getServices
  
bindCharacteristicEvents: function(characteristic, service, homebridgeAccessory) {
	
    var onOff = characteristic.props.format == "bool" ? true : false;
   
	//homebridgeAccessory
	
	switch (characteristic.displayName){
		case 'On':
			characteristic.on('set', function(value, callback) {homebridgeAccessory.platform.command(value == 0 ? "turnOff": "turnOn", null, homebridgeAccessory);
			callback();
        	}.bind(this) );
        	characteristic.on('get', function(callback) {homebridgeAccessory.platform.getAccessoryValue(callback, homebridgeAccessory, false);
            }.bind(this) );
        	break;
        case 'Brightness':
			characteristic.on('set', function(value, callback) {homebridgeAccessory.platform.command("setDim", value, homebridgeAccessory);
			callback();
        	}.bind(this) );
        	characteristic.on('get', function(callback) {homebridgeAccessory.platform.getAccessoryValue(callback, homebridgeAccessory, true);
            }.bind(this) );
        	break;
        case 'Hue':
			characteristic.on('set', function(value, callback) {homebridgeAccessory.platform.command("setHue", value, homebridgeAccessory);
			callback();
        	}.bind(this) );
        	characteristic.on('get', function(callback) {homebridgeAccessory.platform.getAccessoryHue(callback, homebridgeAccessory);
            }.bind(this) );
        	break;
        case 'Saturation':
			characteristic.on('set', function(value, callback) {homebridgeAccessory.platform.command("setSat", value, homebridgeAccessory);
			callback();
        	}.bind(this) );
        	characteristic.on('get', function(callback) {homebridgeAccessory.platform.getAccessorySat(callback, homebridgeAccessory);
            }.bind(this) );
        	break;
        case 'Motion Detected':
            characteristic.on('get', function(callback) {homebridgeAccessory.platform.getAccessoryMotionDetection(callback, homebridgeAccessory);
            }.bind(this) );
        	break;
        case 'Current Temperature':
            characteristic.on('get', function(callback) {homebridgeAccessory.platform.getAccessoryTemperature(callback, homebridgeAccessory);
            }.bind(this) );
        	break;
        case 'Current Ambient Light Level':
            characteristic.on('get', function(callback) {homebridgeAccessory.platform.getAccessoryLux(callback, homebridgeAccessory);
            }.bind(this) );
        	break;
        case 'Current Relative Humidity':
            characteristic.on('get', function(callback) {homebridgeAccessory.platform.getAccessoryHumidity(callback, homebridgeAccessory);
            }.bind(this) );
        	break;
        default:
        	this.log("Something went belly up... Characteristic not found: " + characteristic.displayName);
        	break;
	
	}
	
  }//bindCharacteristicEvents
};

function SetColourWheel(){
	var valueR, valueG, valueB, hexR, hexG, hexB, hexValue;
    var C, X,  m;
	//Converting value to rgb then hex
                	
                	
                	valueV = 100;
                	
                	valueS = valueS/100;
                	valueV = valueV/100;
                	
                	if (valueH == 360)
                		valueH = 0;
                		
                	console.log ("valueH = "+ valueH);	
                	console.log ("valueS = "+ valueS);
                	console.log ("valueV = "+ valueV);
                	
                	C = valueS * valueV;
                	X = C * (1 - Math.abs((valueH/60) % 2 - 1 ));
                	m = valueV - C;
                	
                	if (valueH < 60){
                		valueR = C;
                		valueG = X;
                		valueB = 0;
                	}
                	else if (valueH < 120){
                		valueR = X;
                		valueG = C;
                		valueB = 0;
                	}
                	else if (valueH < 180){
                		valueR = 0;
                		valueG = C;
                		valueB = X;
                	}
                	else if (valueH < 240){
                		valueR = 0;
                		valueG = X;
                		valueB = C;
                	}
                	else if (valueH < 300){
                		valueR = X;
                		valueG = 0;
                		valueB = C;
                	}
                	else if (valueH < 360){
                		valueR = C;
                		valueG = 0;
                		valueB = X;
                	}
                	
                	valueR = Math.floor((valueR + m) * 255);
                	valueG = Math.floor((valueG + m) * 255);
                	valueB = Math.floor((valueB + m) * 255);
                	hexR = valueR.toString(16).toUpperCase();
                	hexG = valueG.toString(16).toUpperCase();
                	hexB = valueB.toString(16).toUpperCase();
                	
                	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
                	while (hexR.length < padding) {
                		hexR = "0" + hexR;
                	}
                	while (hexG.length < padding) {
                		hexG = "0" + hexG;
                	}
                	while (hexB.length < padding) {
                		hexB = "0" + hexB;
                	}
                	
                	hexValue = hexR+hexG+hexB;
                	//console.log("Colour Wheel Change value " + value);
                	console.log("The colour is set to: " + hexValue);
                	
                	valueS = valueS * 100;
                	valueV = valueV * 100;
                	return hexValue;

}

function VeraBridgedAccessory(services) {
	//console.log("VERABRIDGEACCESSORY: " + this.services);
    this.services = services;
    
}
