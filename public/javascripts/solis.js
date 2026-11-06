'use strict';

const solisChartSamples = new Map();
const SOLIS_CHART_GAP_MS = 90 * 1000;
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

// Show next midnight as "24" instead of "00"
function formatSolisHourTick(label, index, ticks) {
    const tick = ticks && ticks[index];
    return tick && tick.value >= localDayEnd() ? '24' : label;
}

function recordSolisSample(timestamp, pvPower) {
    const sampleTime = new Date(timestamp).getTime();
    if (!Number.isFinite(sampleTime) || pvPower === null || pvPower === undefined) {
        return;
    }

    const power = Number(pvPower);
    if (!Number.isFinite(power) || power < 0) {
        return;
    }

    if (sampleTime >= localDayStart()) {
        solisChartSamples.set(sampleTime, power);
        renderSolisChart();
    }
}

function renderSolisChart() {
    if (!solisChart) {
        return;
    }

    const samples = Array.from(solisChartSamples, ([x, y]) => ({ x, y }))
        .sort((a, b) => a.x - b.x);
    const points = [];

    samples.forEach((sample, index) => {
        if (index > 0 && sample.x - samples[index - 1].x > SOLIS_CHART_GAP_MS) {
            points.push({ x: samples[index - 1].x + 1, y: null });
        }
        points.push(sample);
    });

    solisChart.data.datasets[0].data = points;
    solisChart.options.scales.xAxes[0].time.min = localDayStart();
    solisChart.options.scales.xAxes[0].time.max = localDayEnd();
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

    solisChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            datasets: [{
                label: 'PV-teho',
                data: [],
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.12)',
                borderWidth: 2,
                pointRadius: 0,
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
                callbacks: {
                    label: item => `${(item.yLabel / 1000).toFixed(2)} kW`
                }
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'hour',
                        min: localDayStart(),
                        max: localDayEnd(),
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
            samples.forEach(sample => recordSolisSample(sample.timestamp, sample.pv_power));
            status.textContent = solisChartSamples.size ? '' : 'Odotetaan tuotantotietoja';
            renderSolisChart();
        })
        .fail((request, textStatus, error) => {
            console.error('Could not load Solis chart history:', textStatus, error);
            status.textContent = 'Kaaviota ei saatavilla';
        });
}

$(loadSolisChart);
