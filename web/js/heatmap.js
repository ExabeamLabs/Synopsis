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
function initialize_heatmap(data){
        const margin = { top: 75, right: 0, bottom: 100, left: 110 },
          width = 960 - margin.left - margin.right,
          height = 430 - margin.top - margin.bottom,
          gridSize = Math.floor(width / 24),
          legendElementWidth = gridSize*2,
          buckets = 9,
          colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"], // alternatively colorbrewer.YlGnBu[9]
          days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
          times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];
          datasets = ["data.tsv", "data2.tsv"];

      const svg = d3.select("#chart").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      const dayLabels = svg.selectAll(".dayLabel")
          .data(days)
          .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", -50)
            .attr("y", (d, i) => i * gridSize)
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
            .attr("class", (d, i) => ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"));

      const timeLabels = svg.selectAll(".timeLabel")
          .data(times)
          .enter().append("text")
            .text((d) => d)
            .attr("x", (d, i) => i * gridSize - gridSize)
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)")
            .attr("class", (d, i) => ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"));

      const type = (d) => {
        return {
          day: +d.day,
          hour: +d.hour,
          value: +d.value
        };
      };

      const heatmapChart = function(data) {
          console.log(data)

          const colorScale = d3.scaleQuantile()
            .domain([0, buckets - 1, d3.max(data, (d) => d.value)])
            .range(colors);

          const cards = svg.selectAll(".hour")
              .data(data, (d) => d.day+':'+d.hour);

          cards.append("title");

          cards.enter().append("rect")
              .attr("x", (d) => (d.hour - 1) * gridSize)
              .attr("y", (d) => (d.day - 1) * gridSize)
              .attr("rx", 4)
              .attr("ry", 4)
              .attr("class", "hour bordered")
              .attr("width", gridSize)
              .attr("height", gridSize)
              .style("fill", colors[0])
            .merge(cards)
              .transition()
              .duration(1000)
              .style("fill", (d) => colorScale(d.value));

          cards.select("title").text((d) => d.value);

          cards.exit().remove();

          const legend = svg.selectAll(".legend")
              .data([0].concat(colorScale.quantiles()), (d) => d);

          const legend_g = legend.enter().append("g")
              .attr("class", "legend");

          legend_g.append("rect")
            .attr("x", (d, i) => legendElementWidth * i)
            .attr("y", height)
            .attr("width", legendElementWidth)
            .attr("height", gridSize / 2)
            .style("fill", (d, i) => colors[i]);

          legend_g.append("text")
            .attr("class", "mono")
            .text((d) => "≥ " + Math.round(d))
            .attr("x", (d, i) => legendElementWidth * i)
            .attr("y", height + gridSize);

          legend.exit().remove();

      };

      heatmapChart(data);


}