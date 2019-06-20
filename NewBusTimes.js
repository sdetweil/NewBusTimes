var mn = document.currentScript.src.replace(/\/\//g,"/").split('/').slice(-2, -1)[0];
/*

NewBusTimes


 */
Module.register(mn, {
	// define variables used by module, but not in config data
  weekday_key:["d","lv","lv","lv","lv","lv","s"],

	// holder for config info from module_name.js
	config:null,

	// anything here in defaults will be added to the config data
	// and replaced if the same thing is provided in config
	defaults: {
		message: "default message if none supplied in config.js",
    classes: {
              "tableHeading1":"rTableHeading1",
              "tableHeading2":"rTableHeading2",
              "scheduleHeading":"rScheduleHeading",
              "scheduleLabel":"rScheduleLabel",              
              "table":"rTable",
              "tableBody":"rTableBody",
              "tableRow":"rTableRow",
              "tableCell":"rTableCell"
    },
	showEarliestDeparture: false,
	float: "",
	spacing: "",
	},

	init: function(){
		Log.log(this.name + " is in init!");
	},

	start: function(){
		Log.log(this.name + " is starting!");
    saself = this
	},

	loaded: function(callback) {
		Log.log(this.name + " is loaded!");
		callback();
	},

	// return list of stylesheet files to use if any
	getStyles: function() {
      Log.log("returning our styleheet")
  return [mn+".css"]

	},

	// only called if the module header was configured in module config in config.js
	getHeader: function() {
		return this.data.header + " Foo Bar";
	},

	// messages received from other modules and the system (NOT from your node helper)
	// payload is a notification dependent data structure
	notificationReceived: function(notification, payload, sender) {
		// once everybody is loaded up
		if(notification==="ALL_MODULES_STARTED"){
			// send our config to our node_helper
			//this.sendSocketNotification("CONFIG",this.config)
   this.sendSocketNotification("getinfo",{url:this.config.url +'/'+ this.config.line+".json",id:this.identifier})
		}
		if (sender) {
			Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
		} else {
			Log.log(this.name + " received a system notification: " + notification);
		}
	},

	// messages received from from your node helper (NOT other modules or the system)
	// payload is a notification dependent data structure, up to you to design between module and node_helper
	socketNotificationReceived: function(notification, payload) {
		Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		if(notification === "message_from_helper"){
   if(payload.id===this.identifier){
			  this.odata=payload.data;
  			// tell mirror runtime that our data has changed,
			  // we will be called back at getDom() to provide the updated content
     setInterval(()=> { this.updateDom(1000)}, 60*1000)
		  	this.updateDom(1000)
   }
		}
	},

	// system notification your module is being hidden
	// typically you would stop doing UI updates (getDom/updateDom) if the module is hidden
	suspend: function(){
	},

	// system notification your module is being unhidden/shown
	// typically you would resume doing UI updates (getDom/updateDom) if the module is shown
	resume: function(){
	},
  createElement: function(etype, eparent, eclass, data){
    let e = document.createElement(etype)
    e.className=eclass;
    if(data !== undefined)
      e.innerHTML=data
    eparent.appendChild(e)
    return e;
  },
  compareTime: function(str1, str2){
    if(str1 === str2){
        return 0;
    }
    var time1 = str1.split(':');
    var time2 = str2.split(':');
    if(eval(time1[0]) > eval(time2[0])){
        return 1;
    } else if(eval(time1[0]) == eval(time2[0]) && eval(time1[1]) > eval(time2[1])) {
        return 1;
    } else {
        return -1;
    }
  },
  addMinutes:   function (date, minutes) {
    return new Date(date.getTime() + minutes*60000);
  },
  getTimes(times, now, count){
    let r = []
    for(let t of times ){
      if(t !== undefined && t !== "")
        if(this.compareTime(t,now)>0 && count >0 ){
          r.push(t)
          count --;
        }
    }
    return r;
  }, 
	// this is the major worker of the module, it provides the displayable content for this module
  getDom: function() {
	var wrapper = document.createElement("div");	
    //wrapper.className=mn
		if(this.config.float!== ""){
			document.getElementById(this.identifier).style.float=this.config.float;
			if(this.config.spacing !=="")
				document.getElementById(this.identifier).style.marginLeft=this.config.spacing
		}	

    // if we have data from the bus schedule system
    if(this.odata!=undefined){
			let now = new Date()
			if(this.config.travelTime !== undefined)
				now = this.addMinutes(now, this.config.travelTime );
			let current_time=now.getHours() + ":" + now.getMinutes();        
			// get only the schedule that applies to today
			let schedule = this.odata.station[this.weekday_key[now.getDay()]]
			// if we haven't separated the departures yet
			if(schedule.out == undefined){
				// create separate lists for outgoing and returning
				schedule.out=[]
				schedule.ret =[]
				for(let departure of schedule.lines ){
					if(departure[0] !=="")
						schedule.out.push(departure[0])
					if(departure[1] !=="")            
						schedule.ret.push(departure[1])
				}
			}
			// get the limit of elements to show
			let display_count = this.config.nextDepartures 
			
			// create headings
			let table=this.createElement("div",wrapper,this.config.classes["table"])

			// add heading
			row=this.createElement("div",table,this.config.classes["tableRow"])
				this.createElement("div",row, this.config.classes["tableHeading1"], this.config.lineHeading1+" "+this.config.line)
			// start and end station names
			row=this.createElement("div",table,this.config.classes["tableRow"])
				this.createElement("div",row,this.config.classes["tableHeading2"], this.config.lineHeading2+" "+ schedule.in_stop_name +" <-> "+schedule.out_stop_name)

			// if we should show either the schedule name (day of week, lv, s,d)  or the schedule label (leave/return)
			if(this.config.showscheduleName == true || this.config.schedule_label !== undefined){       
				table=this.createElement("div",table,this.config.classes["tableBody"] )
              
				// the schedule lable (lv = mon-fri, s = sat, d = sun), if requested
				if(this.config.showscheduleName !== undefined && this.config.showscheduleName == true){   
																		row=this.createElement("div",table,this.config.classes["tableRow"])              
					this.createElement("div",row,this.config.classes["scheduleHeading"], this.config.dayLabel +" "+this.weekday_key[now.getDay()])
				}
				// and any label the user wants to show
				if(this.config.schedule_label !== undefined){ 
					row=this.createElement("div",table,this.config.classes["tableRow"])               
					this.createElement("div",row,this.config.classes["scheduleLabel"], this.config.schedule_label) 
				}
			}         
			// now create the table of useful departure times
			body=this.createElement("div",table,this.config.classes["tableBody"] )    
			// loop thru the scheduled departures
			// getting up to display_count entries after the current time (including any travel to stop time)
			let leave = this.getTimes(schedule.out,current_time,display_count)
			let ret = this.getTimes(schedule.ret,current_time, display_count)
		  // if we should highlight the earliest departure time
			if(this.config.showEarliestDeparture){
				// if the lengths are uneven 
				if(leave.length <ret.length && this.compareTime(leave[0], ret[0])>0)
					//add an entry to leave side
					leave.unshift(" ")
				else{
					// if the leave time is greater than the return time
					if(this.compareTime(leave[0], ret[0])>0)
					// add a dummy entry to the leave side
					leave.unshift(" ")
				}
			}
			// loop thru the selected departure times,
			// using the highest count
			for(let c =0; c<Math.max(leave.length,ret.length); c++){
				// create the row
				row=this.createElement("div",body,this.config.classes["tableRow"])
				// get the data for the 1st leave cell
				let str = c>=leave.length? " ": leave[c]
				// if its not empty
				if(str !== " ")
					// add it now
					this.createElement("div",row,this.config.classes["tableCell"], str +"->")             
				else            
					// else add a blank cell in its place
					this.createElement("div",row,this.config.classes["tableCell"], " ")  
				// get the return departure time
				str = c>=ret.length? " ":ret[c]
				// if its not empty
				if(str !== " ")
					// add it now
					this.createElement("div",row,this.config.classes["tableCell"], "<-"+str )               
				else            
					// else add a blank cell in its place
					this.createElement("div",row,this.config.classes["tableCell"], " ")             
			}
    }
    else{
      // if user supplied message text in its module config, use it
      if(this.config.hasOwnProperty("message")){
        // using text from module config block in config.js
        wrapper.innerHTML = this.config.message;
      }
    }

	// pass the created content back to MM to add to DOM.
	return wrapper;
	},

})
