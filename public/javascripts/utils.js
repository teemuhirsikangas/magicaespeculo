function checkIfDataIsStale(lastTimestamp) {

    var lastEntryDate = moment(lastTimestamp);
    var currentDate = moment(new Date());
    var diff = currentDate.diff(lastEntryDate, 'minutes');
    if (diff >= 10) {
        console.log("no new data since: " + lastEntryDate.format("YYYY-MM-DD HH:mm"));
        throw new noNewDataException(diff);
    }

}

function noNewDataException(value) {
   this.value = value;
   this.message = "no new data since: ";
   this.toString = function() {
      return this.value + this.message;
   };
}


//todo, create graphs