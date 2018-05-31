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

// Constructor initial graph
bar_builder = []
var list_of_bars = document.getElementById("list_of_bars")

function remove_chart(name_of_website) {

  button_string = name_of_website


  var chart_cursor = document.getElementById(name_of_website.replace('button-',''))
  var button_cursor = document.getElementById(button_string)
  chart_cursor.parentNode.removeChild(chart_cursor)

  button_cursor.parentNode.removeChild(button_cursor)


}

function create_new_bar_chart(name_of_website,domains_keymap){
  data_arr_1 = []
  website_keymapper = []

  if (!domains_keymap){
      domains_keymap = window.domains_keymap
  }
  for(var property in domains_keymap[name_of_website]){
    if (!domains_keymap[name_of_website].hasOwnProperty(property)){
      continue;
    }
    data_arr_1.push(property)
    website_keymapper.push(domains_keymap[name_of_website][property])
  }





  max_num = Math.max.apply(null,website_keymapper)
  var chart_div = document.createElement("div");
  chart_div.style.display = "inline-block"
  var new_canvas = document.createElement("canvas");
  var close_button = document.createElement("button")

  random_num_id = Math.floor(Math.random() * 999);

  close_button.innerHTML = "&#10006;"
  close_button.style.cssFloat = "right"
  close_button.style.marginTop = "50px"
  close_button.id = "button-"+name_of_website+'-'+random_num_id

  close_button.onclick = function(){
    remove_chart(this.id)
  };
  new_canvas.width = "675"

  new_canvas.height = "225"
  new_canvas.id = name_of_website +'-'+random_num_id
  new_canvas.style.cssFloat = "left"
  var line_chart = new Chart(new_canvas, {
    type: 'bar',
    data: {
      labels: data_arr_1,
      datasets: [{
        label: name_of_website,
        backgroundColor: getRandomColor(),
        borderColor: "rgba(2,117,216,1)",
        data: website_keymapper,
      }
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: true,
      scales: {
        xAxes: [{
          display:true,
          time: {
            unit: 'month'
          },
          gridLines: {
            display: false
          },
          ticks: {
            maxTicksLimit: 4,
            maxRotation: 0,
            minRotation: 0
          }
        }],
        yAxes: [{
          ticks: {
            min: 0,
            max: max_num,
            maxTicksLimit: 5
          },
          gridLines: {
            display: true
          }
        }],
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          fontColor: "#000080",
        }
      }
    }
  });

  chart_div.appendChild(new_canvas)
  chart_div.appendChild(close_button)
  list_of_bars.insertBefore(chart_div,list_of_bars.firstChild)
  data_arr_1 = []
  website_keymapper = []
}

function add_chart_to_card(){
  var cur_selection = document.getElementById('website_selection')

  create_new_bar_chart(cur_selection.value)
}

function initialize_bar_Charts(items,domains_keymap,dropdown_list_domains){
    var internal_domains_keymap = domains_keymap
    for (var i = 0; i < 4; i++){
      create_new_bar_chart(items[i][0],domains_keymap)
    }
    window.domains_keymap = domains_keymap
    var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

    var states = dropdown_list_domains

    $('#scrollable-dropdown-menu .typeahead').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      name: 'states',
      source: substringMatcher(states)
    });
    var activity_domain_shuffle = document.getElementById('activity_by_domain')
    activity_domain_shuffle.setAttribute('data-groups',"['" + dropdown_list_domains.join("','") + "']")
}
