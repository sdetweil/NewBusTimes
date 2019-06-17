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
  getData(){
    let self=this
          request({url: this.config.url +'/'+ this.config.line+".json", method: "GET"}, function( error, response, body) {

            if(!error && response.statusCode == 200) {
               self.sendSocketNotification("message_from_helper",JSON.parse(body))
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
		// if config message from module
		if (notification === "CONFIG") {
			// save payload config info
      console.log("we have config ==================")
			this.config=payload
      this.getData()
     // let data = fs.readFileSync("/home/odroid/MagicMirror/modules/default/SampleModule/sampledata.txt")
      //console.log("sample data="+data);
			// wait 15 seconds, send a message back to module
		//	this.sendSocketNotification("message_from_helper",data.toString())
		}
		else if(notification === "????2") {
		}
	},
});