var NodeHelper = require("node_helper");
var request = require("request");

// add require of other javascripot components here
// var xxx = require('yyy') here

module.exports = NodeHelper.create({

	init(){
		console.log("init module helper SampleModule");
	},

	start() {
		console.log(`Starting module helper: ${this.name}`);
	},

	stop(){
		console.log(`Stopping module helper: ${this.name}`);
	},
  getData(info){
    let self=this
          request({url:info.url , method: "GET"}, function( error, response, body) {

            if(!error && response.statusCode == 200) {
               self.sendSocketNotification("message_from_helper",{data:JSON.parse(body),id:info.id})
            }
            else {
                console.log( "sampleModule] " + " ** ERROR ** " + error + " status= "+response.statusCode);
            }            
          })
  },
	// handle messages from our module// each notification indicates a different messages
	// payload is a data structure that is different per message.. up to you to design this
	socketNotificationReceived(notification, payload) {
		console.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
                if(notification === "getinfo") {
                  this.getData(payload)
		}
	},
});
