var config = {
    language : "en-EN", //or en-EN //fi-FI
    locale : "en", //or fi
    dateformat : "HH:mm:ss",
    calendartextformat :"Do MMM dd", //for en "Do MMM dd" or fi "DoM dd"
    calendartimeformat : "hh:mm A",    //for en 'h:mm A' or for fi "HH:mm"

    weather : {
        unit : "c",  //f or c
        location : "lempäälä", //city http://simpleweatherjs.com/
        woeid : "568960"
    },
    groundheatpump : {
        show : true, //enable disble)
        avaragepowerusage : 1.7 //kWh
    },

    ventilation : {
        show : false //enable-disable
    },

    electricity : {
        show : true, //enable-disable
        price : 12 //electricity price per kwh
    },

    garage : { //garage data
        show : true //enable-disable
    },

    beddit : { //beddit sleepmonitor
        show : false //enable-disable
    },
    //not in use yet
    calendar: {
        show : true,
        caldendarId : "mygoogleid@gmail.com", //leave empty ("") so will not be shown or set the calendarid (email)
        caldendarId2 : "", //leave empty ("") so will no be shown
        maxResults: 10,
        maxDays: 30,
        updateinterval : 600000,
        styleid : "calendar",
        styleid2 : "calendartwo"
    },
        envoy : { //Emphase envoy solar Inverter
        show : false, //enable-disable
        publicUrl : 'https://' //your public profile url for Enphase envoy
    }
};
