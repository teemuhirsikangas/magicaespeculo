var texts = {
    //GHP
    "d_TOPIC" : "Yesterday´s mean values ",
    "d_T_UTE" : "Outside temp ",
    "d_T_VATTEN" : "hotwater temp: ",
    "d_KOMPR_H" : "compressor runtime ",
    "d_VARMVATTEN_H" : "hotwater production runtime ",
    "d_COMPR_STARTS" : "compressor starts ",
    "d_TSTOP_E" : "Used power kWh/d: ",
    "d_TS_E" : "aux. energy ",
    "hour" : "h",
    "min" : " min",
    "kWh" : " kWh",
    "Monday" : "Mon",
    "Tuesday" : "Tue",
    "Wednesday" : "Wed",
    "Thursday" : "Thu",
    "Friday" : "Fri",
    "Saturday" : "Sat",
    "Sunday" : "Sun"
};

var ventilationtext = {
    "fresh" : "fresh air",
    "supply" : "supply",
    "supply_hr" : "supply air temp after heat recovery", 
    "waste" : "waste",
    "exhaust" : "exhaust",
    "exhaust_humidity" : "exhaust humid.",
    "humidity_48h" : "humid 48h",
    "hr_effiency_in" : "input η",
    "hr_efficiency_out" : "output η",
    control_state : { 
        0 : "Normal",
        1 : "Max cooling",
        2 : "Max Heating",
        4 : "Emergency stop",
        8 : "stop",
        16 : "Away",
        32 : "Away for long",
        46 : "Heat boosting",
        128 : "CO2 boosting",
        256 : "Rh boosting",
        512 : "Boosting",
        1024 : "Over pressure",
        2048 : "Cooking vent.",
        4096 : "Vacuuming",
        8192 : "SLP cooling",
        16384 : "Summer night cooling",
        32768 : "EXT de-frosting"
    },
    heating_status : {
        0: "No Heat Recovery",
        1: "Cooling",
        2: "Heat Recovery",
        4: "Heating",
        5: "delay",
        6: "Summer night cooling",
        7: "starting up",
        8: "Stopped",
        9: "Heat recovery cleaning",
        10: "EXT de-frosting"
    }
};

var mqtttext = {
    "frontdoor": "Front door",
    "sidedoor": "Side door",
    "backdoor": "Back door",
    "garagedoor": "Garage Door",
    "doorOpen" : "Open",
    "doorClosed" : "closed",
    "waterLeak": "Water leak(mains)",
    "waterLeakON": "LEAK!",
    "statusOK": "OK",
    "statusON": "ON",
    "statusOFF": "Off",
    "statusNA": "N/A",
    "alarmtext": "Alarm"
};

var electricitytext = {
    "yesterday" : "y-day: "
};

var days = ["na", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
