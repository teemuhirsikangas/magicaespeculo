'use strict';

function checkIfDataIsStale(lastTimestamp) {

    var lastEntryDate = moment(lastTimestamp),
        currentDate = moment(new Date()),
        diff = currentDate.diff(lastEntryDate, 'minutes');
    if (diff >= 16) {
        // console.log("no new data since: " + lastEntryDate.format("YYYY-MM-DD HH:mm"));
        throw new NoNewDataException(diff);
    }
}

function checkIfDataIsStalefrom(lastTimestamp, staleValue) {

    var lastEntryDate = moment(lastTimestamp),
        currentDate = moment(new Date()),
        diff = currentDate.diff(lastEntryDate, 'minutes');
    if (diff >= staleValue) {
        //console.log("no new data since: " + lastEntryDate.format("YYYY-MM-DD HH:mm"));
        throw new NoNewDataException(diff);
    }

}

function NoNewDataException(value) {
    this.value = value;
    this.message = "no new data since: ";
    this.toString = function() {
        return this.value + this.message;
   };
}

//generate any chart via AmCharts
function generateChart(path) {

    if (!$("#chartdivbase").find('#chartdiv').length) {
        $("#chartdivbase").append("<div id='chartdiv'></div>");
    } else {
        $("#chartdivbase").find('#chartdiv').remove();
        return;
    }

    $.getJSON(path, function (data) {

        try {
            
            var chart = new AmCharts.AmSerialChart();
            chart.dataProvider = data;
            chart.categoryField = "date";
            chart.mouseWheelZoomEnabled = true;
            chart.marginRight = 80;
            chart.marginTop = 7;
            chart.autoMarginOffset = 20;
            chart.theme = "light";
            chart.mouseWheelZoomEnabled = true;

            var categoryAxis = chart.categoryAxis;
            categoryAxis.parseDates = true; // as our data is date-based, we set parseDates to true
            categoryAxis.minPeriod = "mm"; // our data is daily, so we set minPeriod to DD, mm=minute, hh=hour
            categoryAxis.dashLength = 1;
            categoryAxis.gridAlpha = 0.15;
            categoryAxis.axisColor = "#DADADA";
            categoryAxis.minorGridEnabled = true;

            //value
            var valueAxis = new AmCharts.ValueAxis();
            valueAxis.axisAlpha = 0.2;
            valueAxis.dashLength = 1;
            valueAxis.position = "left";
            chart.addValueAxis(valueAxis);

            //check the keys from data
            var objKeys = [];
                for (var k in data[0]) {
                    if (data[0].hasOwnProperty(k)) {
                        objKeys.push(k);
                    }
                }

            //remove the date, as it's not needed in graph data
            objKeys.splice(0, 1);

            for (k = 0; k < objKeys.length; k++) {

                var graph = new AmCharts.AmGraph();
                graph.id = objKeys[k];
                graph.title = objKeys[k];
                graph.valueField = objKeys[k];
                graph.bullet = "round";
                graph.bulletColor = "#F"+k+"FAAA";
                graph.bulletBorderThickness = 2;
                graph.lineThickness = 2;
                //graph.lineColor = "#b5030d";
                graph.negativeLineColor = "#0352b5";
                graph.balloonText = objKeys[k]+": [[value]]";
                graph.hideBulletsCount = 50; // this makes the chart to hide bullets when there are more than 50 series in selection
                graph.bulletBorderAlpha = 1;
                graph.useLineColorForBulletBorder = true;
                chart.addGraph(graph);
            }

            // SCROLLBAR
            var chartScrollbar = new AmCharts.ChartScrollbar();
            chartScrollbar.graph = objKeys[0];
            chartScrollbar.scrollbarHeight = 40;
            //chartScrollbar.color = "#FFFFFF";
            chartScrollbar.autoGridCount = true;
            chart.addChartScrollbar(chartScrollbar);

            // CURSOR
            var chartCursor = new AmCharts.ChartCursor();
            //chartCursor.cursorPosition = "mouse";
            chartCursor.limitToGraph = objKeys[0];
            chart.addChartCursor(chartCursor);

            chart.write("chartdiv");

            chart.addListener("rendered", zoomChart);

        } catch (e) {
            console.log("error" + e);
        }
    });
};

// this method is called when chart is first inited as we listen for "rendered" event
function zoomChart() {
// different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
    chart.zoomToIndexes(chartData.length - 40, chartData.length - 1);
}
