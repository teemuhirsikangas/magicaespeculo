'use strict';

const solisChartSamples = new Map();
// Cron publishes every 60 s, tolerate a few missed runs before breaking the line
const SOLIS_CHART_GAP_MS = 5 * 60 * 1000;
const SOLIS_ZERO_DATASET = 0;
const SOLIS_POWER_DATASET = 1;
let solisChart;

function localDayStart() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.getTime();
}

function localDayEnd() {
    const end = new Date(localDayStart());
    end.setDate(end.getDate() + 1);
    return end.getTime();
}

function solisChartTimeRange(samples) {
    const start = new Date(localDayStart());
    const end = new Date(start);
    start.setHours(3);
    end.setHours(22);

    samples.forEach(sample => {
        if (sample.y <= 0) {
            return;
        }
        if (sample.x < start.getTime()) {
            start.setTime(sample.x);
            start.setMinutes(0, 0, 0);
        }
        if (sample.x > end.getTime()) {
            end.setTime(sample.x);
            end.setMinutes(0, 0, 0);
            if (end.getTime() < sample.x) {
                end.setHours(end.getHours() + 1);
            }
        }
    });

    return { min: start.getTime(), max: end.getTime() };
}

// Show next midnight as "24" instead of "00"
function formatSolisHourTick(label, index, ticks) {
    const tick = ticks && ticks[index];
    return tick && tick.value >= localDayEnd() ? '24' : label;
}

function recordSolisSample(timestamp, pvPower, redraw = true) {
    const sampleTime = new Date(timestamp).getTime();
    if (!Number.isFinite(sampleTime) || pvPower === null || pvPower === undefined) {
        return;
    }

    const power = Number(pvPower);
    if (!Number.isFinite(power) || power < 0) {
        return;
    }

    if (sampleTime >= localDayStart() && sampleTime < localDayEnd()) {
        solisChartSamples.set(sampleTime, power);
        if (redraw) {
            renderSolisChart();
        }
    }
}

function renderSolisChart() {
    if (!solisChart) {
        return;
    }

    const samples = Array.from(solisChartSamples, ([x, y]) => ({ x, y }))
        .filter(sample => sample.x >= localDayStart() && sample.x < localDayEnd())
        .sort((a, b) => a.x - b.x);
    const timeRange = solisChartTimeRange(samples);
    const points = [];

    samples.forEach((sample, index) => {
        if (index > 0 && sample.x - samples[index - 1].x > SOLIS_CHART_GAP_MS) {
            points.push({ x: samples[index - 1].x + 1, y: null });
        }
        points.push(sample);
    });

    // A sample with gaps on both sides has no line segment, so draw it as a dot
    const isGap = point => !point || point.y === null;
    const dotRadius = series => series.map((point, index) =>
        (!isGap(point) && isGap(series[index - 1]) && isGap(series[index + 1]) ? 2 : 0));

    // Zero production is drawn as a red overlay series on top of the gold line
    const zeroPoints = points.map(point => ({ x: point.x, y: point.y === 0 ? 0 : null }));
    const zeroRadius = dotRadius(zeroPoints);
    const radius = dotRadius(points).map((r, index) => (points[index].y === 0 ? 0 : r));

    // Always mark the latest sample, a short or low-power line is otherwise barely visible
    const last = points.length - 1;
    if (last >= 0) {
        if (points[last].y === 0) {
            zeroRadius[last] = 2;
        } else {
            radius[last] = 2;
        }
    }

    solisChart.data.datasets[SOLIS_POWER_DATASET].data = points;
    solisChart.data.datasets[SOLIS_POWER_DATASET].pointRadius = radius;
    solisChart.data.datasets[SOLIS_ZERO_DATASET].data = zeroPoints;
    solisChart.data.datasets[SOLIS_ZERO_DATASET].pointRadius = zeroRadius;
    solisChart.options.scales.xAxes[0].time.min = timeRange.min;
    solisChart.options.scales.xAxes[0].time.max = timeRange.max;
    solisChart.update(0);
}

function loadSolisChart() {
    const canvas = document.getElementById('solis-chart');
    const status = document.getElementById('solis-chart-status');
    if (!canvas || typeof Chart === 'undefined') {
        console.error('Solis chart could not start: chart canvas or Chart.js is missing');
        if (status) {
            status.textContent = 'Kaaviota ei saatavilla';
        }
        return;
    }

    const timeRange = solisChartTimeRange([]);
    solisChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            // Chart.js 2 draws dataset 0 last, so the red zero overlay is first to stay on top
            datasets: [{
                label: 'Ei tuotantoa',
                data: [],
                borderColor: '#FF4136',
                borderWidth: 2,
                pointRadius: 0,
                pointBackgroundColor: '#FF4136',
                pointBorderColor: '#FF4136',
                pointHitRadius: 0,
                lineTension: 0,
                fill: false,
                spanGaps: false
            }, {
                label: 'PV-teho',
                data: [],
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.12)',
                borderWidth: 2,
                pointRadius: 0,
                pointBackgroundColor: '#FFD700',
                pointHitRadius: 8,
                lineTension: 0.15,
                fill: true,
                spanGaps: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            legend: { display: false },
            tooltips: {
                mode: 'nearest',
                intersect: false,
                filter: item => item.datasetIndex === SOLIS_POWER_DATASET,
                callbacks: {
                    label: item => `${(item.yLabel / 1000).toFixed(2)} kW`
                }
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'hour',
                        min: timeRange.min,
                        max: timeRange.max,
                        stepSize: 6,
                        displayFormats: { hour: 'HH' },
                        tooltipFormat: 'HH.mm'
                    },
                    ticks: {
                        fontColor: '#aaa',
                        maxRotation: 0,
                        autoSkip: false,
                        callback: formatSolisHourTick
                    },
                    gridLines: { color: 'rgba(255, 255, 255, 0.12)' }
                }],
                yAxes: [{
                    ticks: {
                        min: 0,
                        max: SOLIS_PEAK_POWER_W,
                        stepSize: 2000,
                        fontColor: '#aaa',
                        // Hide the 6.37 kW max tick label, it would overlap the 6 kW label
                        callback: value => (value % 1000 ? '' : `${value / 1000}`)
                    },
                    gridLines: { color: 'rgba(255, 255, 255, 0.12)' }
                }]
            }
        }
    });

    $.getJSON('/solis/today')
        .done(samples => {
            if (!Array.isArray(samples)) {
                console.error('Solis chart history response was not an array');
                status.textContent = 'Kaaviota ei saatavilla';
                return;
            }
            samples.forEach(sample => recordSolisSample(sample.timestamp, sample.pv_power, false));
            status.textContent = solisChartSamples.size ? '' : 'Odotetaan tuotantotietoja';
            renderSolisChart();
        })
        .fail((request, textStatus, error) => {
            console.error('Could not load Solis chart history:', textStatus, error);
            status.textContent = 'Kaaviota ei saatavilla';
        });
}

$(loadSolisChart);
