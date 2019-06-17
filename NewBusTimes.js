/*

NewBusTimes


 */

Module.register("NewBusTimes", {
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
              "table":"rTable",
              "tableBody":"rTableBody",
              "tableRow":"rTableRow",
              "tableCell":"rTableCell"
    }
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

	// return list of other functional scripts to use, if any (like require in node_helper)
	getScripts: function() {
		return
		[
			// sample of list of files to specify here, if no files,do not use this routine, or return empty list

			//'script.js', // will try to load it from the vendor folder, otherwise it will load is from the module folder.
			//'moment.js', // this file is available in the vendor folder, so it doesn't need to be available in the module folder.
			//this.file('anotherfile.js'), // this file will be loaded straight from the module folder.
			//'https://code.jquery.com/jquery-2.2.3.min.js',  // this file will be loaded from the jquery servers.
		]
	},

	// return list of stylesheet files to use if any
	getStyles: function() {
      Log.log("returning our styleheet")
  return ["NewBusTimes.css"]
	/*	[
			// sample of list of files to specify here, if no files, do not use this routine, , or return empty list

			//'script.css', // will try to load it from the vendor folder, otherwise it will load is from the module folder.
			//'font-awesome.css', // this file is available in the vendor folder, so it doesn't need to be avialable in the module folder.
			//this.file('anotherfile.css'), // this file will be loaded straight from the module folder.
			//'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css',  // this file will be loaded from the bootstrapcdn servers.
      		
		] */
	},

	// return list of translation files to use, if any
	getTranslations: function() {
		return
		[
			// sample of list of files to specify here, if no files, do not use this routine, , or return empty list

			// en: "translations/en.json",  (folders and filenames in your module folder)
			// de: "translations/de.json"
		]
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
			this.sendSocketNotification("CONFIG",this.config)
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
			this.odata=payload;
			// tell mirror runtime that our data has changed,
			// we will be called back at getDom() to provide the updated content
      setInterval(()=> { this.updateDom(1000)}, 60*1000)
			this.updateDom(1000)
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
            schedule.out.push(departure[0])
            schedule.ret.push(departure[1])
          }
        }
        // get the limit of elements to show
        let display_count = this.config.nextDepartures 
        
        // create headings
        // bus route
        this.createElement("div",wrapper, this.config.classes["tableHeading1"], this.config.lineHeading1+" "+this.config.line)
        // start and end station names
        this.createElement("div",wrapper,this.config.classes["tableHeading2"], this.config.lineHeading2+" "+this.odata["route"])
        let table=this.createElement("div",wrapper,this.config.classes["table"]) 
        // if we should show either the schedule name (day of week, lv, s,d)  or the schedule label (leave/return)
        if(this.config.showscheduleName == true || this.config.schedule_label !== undefined){
       
            let body=this.createElement("div",table,this.config.classes["tableBody"] )
              let row=this.createElement("div",body,this.config.classes["tableRow"])  
                // the schedule lable (lv = mon-fri, s = sat, d = sun), if requested
                if(this.config.showscheduleName !== undefined && this.config.showscheduleName == true)
                  this.createElement("div",row,this.config.classes["tableCell"], this.config.dayLabel +" "+this.weekday_key[now.getDay()])
                // and any label the user wants to show
                if(this.config.schedule_label !== undefined)
                  this.createElement("div",row,this.config.classes["tableCell"], this.config.schedule_label) 
        }
        // now create the table of useful departure times
        body=this.createElement("div",table,this.config.classes["tableBody"] )    
        // loop thru the scheduled departures
        // getting up to display_count entries after the current time (including any travel to stop time)
        let leave = this.getTimes(schedule.out,current_time,display_count)
        let ret = this.getTimes(schedule.ret,current_time, display_count)
        // in the lengths are uneven 
        if(leave.length <ret.length)
          //add an entry to leave side
          leave.unshift(" ")
        else{
          // if the leave time is greater than the return time
          if(this.compareTime(leave[0], ret[0])>0)
            // add a dummy entry to the leave side
            leave.unshift(" ")
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