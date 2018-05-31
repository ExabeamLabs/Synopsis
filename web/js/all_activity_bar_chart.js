/*
Copyright 2018 Exabeam, Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
function initialize_all_activity_bar_chart(all_domains_data_arr_area_chart,all_domains_max_num){

var area_chart = document.getElementById("web_activity_area_chart");
web_activity_area_chart.height = 300
var web_activity_chart = new Chart(area_chart, {
  type: 'line',
  data: {
    labels: all_domains_data_arr_1,
    datasets: [{
      label: "Sessions",
      lineTension: 0.3,
      backgroundColor: "rgba(2,117,216,1)",
      borderColor: "rgba(2,117,216,1)",
      pointRadius: 5,

      pointBackgroundColor: "rgba(2,117,216,1)",
      pointBorderColor: "rgba(255,255,255,0.8)",
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(2,117,216,1)",
      pointHitRadius: 20,
      pointBorderWidth: 2,
      data: all_domains_data_arr_area_chart
    }],
  },
  options: {
          events: ["click"],
    scales: {
      xAxes: [{
        time: {
          unit: 'date'
        },
        gridLines: {
          display: false
        },
        ticks: {
          maxTicksLimit: 7,
          maxRotation: 0,
          minRotation: 0
        }
      }],
      yAxes: [{
        ticks: {
          min: 0,
          max: all_domains_max_num,
          maxTicksLimit: 5
        },
        gridLines: {
          color: "rgba(0, 0, 0, .125)",
        }
      }],
    },
    legend: {
      display: false
    }
  }
});

}