import Highcharts from "highcharts/highstock";

require("highcharts/highcharts-more")(Highcharts);
require("highcharts-regression")(Highcharts);
require("highcharts/modules/boost")(Highcharts);
require("highcharts/modules/heatmap")(Highcharts);
require("highcharts/modules/histogram-bellcurve")(Highcharts);
require("highcharts/modules/solid-gauge")(Highcharts);
require("highcharts/modules/sankey")(Highcharts);
require("highcharts/modules/gantt")(Highcharts);
require("highcharts/modules/dependency-wheel")(Highcharts);

window.Highcharts = Highcharts;

// window.Highcharts.setOptions({});
