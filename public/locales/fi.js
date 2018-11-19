var texts = {
    //GHP
    "d_TOPIC" : "Keskiarvot eilen: ",
    "d_T_UTE" : "ulkolämpötila: ",
    "d_T_VATTEN" : "käyttövesi: ",
    "d_KOMPR_H" : "kompr. käyntiaika: ",
    "d_VARMVATTEN_H" : "Lämminvesi tuotanto: ",
    "d_COMPR_STARTS" : "kompr. käynnistykset: ",
    "d_TSTOP_E" : "energia: ",
    "d_TS_E" : "lisä energia: ",
    "hour" : "h ",
    "min" : " min",
    "kWh" : " kWh",
    "Monday" : "ma",
    "Tuesday" : "ti",
    "Wednesday" : "ke",
    "Thursday" : "to",
    "Friday" : "pe",
    "Saturday" : "la",
    "Sunday" : "su"
};

var ventilationtext = {
    "fresh" : "Raitisilma",
    "supply" : "Tuloilma",
    "supply_hr" : "tuloilma LTO jälkeen", 
    "waste" : "jäteilma",
    "exhaust" : "poistoilma",
    "exhaust_humidity" : "poistoilma kosteus",
    "humidity_48h" : "kosteus 48h",
    "hr_effiency_in" : "LTO tulo η",
    "hr_efficiency_out" : "LTO poisto η",
    control_state : { 
        0 : "Normaali",
        1 : "Max jäähdytys",
        2 : "Max lämmitys,",
        4 : "Hätäseis",
        8 : "Seis",
        16 : "Poissa",
        32 : "Pitkään poissa",
        46 : "Lämpötila tehostus",
        128 : "CO2 tehostus",
        256 : "Rh tehostus",
        512 : "Tehostus",
        1024 : "Ylipaineistus",
        2048 : "Liesituuletin",
        4096 : "keskuspölynimuri",
        8192 : "SLP jäähdytys",
        16384 : "kesäyöviilennys",
        32768 : "EXT sulatus"
    },
    heating_status : {
        0: "LTO pois",
        1: "Jäähdytys",
        2: "LTO",
        4: "Lämmitys",
        5: "porrasviive tila",
        6: "kesäyöviilennys",
        7: "Käynnistys",
        8: "Seis",
        9: "LTO puhdistus",
        10: "EXT yksikön sulatus"
    }
};

var mqtttext = {
    "frontdoor": "Etuovi",
    "sidedoor": "Sivuovi",
    "backdoor": "takaovi",
    "garagedoor": "Autotallin ovi",
    "doorOpen" : "Auki",
    "doorClosed" : "Kiinni",
    "waterLeak": "Päävesi vuoto",
    "waterLeakON": "Vuoto!",
    "statusOK": "OK",
    "statusON": "Päällä",
    "statusOFF": "Pois",
    "statusNA": "Ei tietoa",
    "alarmtext": "Murtohälytin"
};

var electricitytext = {
    "yesterday" : "Eilen:"
};

var days = ["na", "Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];
