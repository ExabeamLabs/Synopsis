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
function post_process(data_sample){
    geolocation = data_sample.geolocation
    devices = data_sample.media_router.devices
    networks = data_sample.media_router.networks
    heatmap = data_sample.heatmap
    accounts = data_sample.accounts
    preferences = data_sample.preferences
    search_word_cloud = data_sample.search_word_cloud
    searches = data_sample.searches
    visits = data_sample.visits
    autofill = data_sample.autofill
    autofill_word_cloud = data_sample.autofill_word_cloud
    daymap = {
        "Mon": 1,
        "Tues":2,
        "Wed": 3,
        "Thur":4,
        "Fri":5,
        "Sat":6,
        "Sun":7
    }

    tsv_array = []

    for (hour = 0; hour < heatmap.length; hour++){
        for (var key in heatmap[hour]) {
            if (heatmap[hour].hasOwnProperty(key)) {
                tsv_data = {
                    "day": daymap[key],
                    "hour": hour,
                    "value": heatmap[hour][key]
                }
                tsv_array.push(tsv_data)
            }
        }
    }


    visits_dict = {}

    dropdown_list_domains = []
    // Iterate through huge visits list
    domains_keymap = {}
    one_run_through = 0
    all_domains = {}

    all_domains_data_arr_1 = []
    all_domains_data_arr_area_chart = []
    all_domains_max_num =0


    for (const [key, value] of Object.entries(visits)) {
        if (!value.domain.includes("localhost")) {
            visits_dict[value.domain] = (visits_dict[value.domain] || 0) + 1;
        }
    }

    var items = Object.keys(visits_dict).map(function(key) {
      return [key, visits_dict[key]];
    })

    items.sort(function(first,second) {
      return second[1] - first[1];
    })

searches_array = []
query_table = []
for (const [key, value] of Object.entries(searches)) {
  for (var i = 0; i < value.query_terms.split(' ').length; i++){
    searches_array.push(value.query_terms.split(' ')[i])
  }
  query_table.push({
    'time': value.visit_time,
    'query': value.query_terms
  })

}


    for (const [key, value] of Object.entries(visits)) {
      // For each top level domain check:
      for (var i=0; i < items.length; i++){
        // Make sure our key is in json
            if(domains_keymap.hasOwnProperty(items[i][0])) {

                if (value.domain.includes(items[i][0])) {
                  time_was_visited = value.visit_time.slice(0,10)
                  domains_keymap[items[i][0]][time_was_visited] = (domains_keymap[items[i][0]][time_was_visited] ||0)+1
                  all_domains[time_was_visited]=(domains_keymap[items[i][0]][time_was_visited] ||0)+1

                  for (var j = 0; j < i; j++){
                    if (!domains_keymap[items[j][0]].hasOwnProperty(time_was_visited)){
                      domains_keymap[items[j][0]][time_was_visited] = 0
                    }

                  }
                }
            } else {
              domains_keymap[items[i][0]]= {}
            }

            dropdown_list_domains.indexOf(items[i][0]) === -1 ? dropdown_list_domains.push(items[i][0]) : 0;
      }
    }



    for(var property in all_domains){
      if (!all_domains.hasOwnProperty(property)){
        continue;
      }
      all_domains_data_arr_1.push(property)
      all_domains_data_arr_area_chart.push(all_domains[property])
      if ( all_domains[property] > all_domains_max_num ){
        all_domains_max_num = all_domains[property]

      }
    }

    try{
        initialize_bar_Charts(items,domains_keymap,dropdown_list_domains)
    }catch (err){
        console.log("Error: Cannot process function initialize_bar_Charts(items,domains_keymap,dropdown_list_domains)")
    }
    autofill_array = [""]

    try{
        initialize_preferences_chart(preferences,dropdown_list_domains,geolocation,accounts,devices,searches_array)
    }catch (err){
        console.log("Error: Cannot process function initialize_preferences_chart(preferences,dropdown_list_domains,geolocation,accounts,devices,searches_array)")
    }
    try{
        initialize_all_activity_bar_chart(all_domains_data_arr_area_chart,all_domains_max_num)
    }catch (err){
        console.log("Error: Cannot process function initialize_all_activity_bar_chart(all_domains_data_arr_area_chart,all_domains_max_num)")
    }
    try{
        initialize_searches_wordcloud(search_word_cloud)
    }catch (err){
        console.log("Error: Cannot process function initialize_searches_wordcloud(search_word_cloud)")
    }
    try{
        initialize_autofill_wordcloud(autofill_word_cloud,autofill_array)
    }catch (err){
        console.log("Error: Cannot process function initialize_autofill_wordcloud(autofill_word_cloud,autofill_array)")
    }
    try{
        initmap(geolocation);
    }catch (err){
        console.log("Error: Cannot process function initmap(geolocation);")
    }
    try{
        init_extracted_accounts(accounts)
    }catch (err){
        console.log("Error: Cannot process function init_extracted_accounts(accounts)")
    }
    try{
        init_autofill_data_table(autofill)
    }catch (err){
        console.log("Error: Cannot process function init_autofill_data_table(autofill)")
    }
    try{
        init_devices_data(devices)
    }catch (err){
        console.log("Error: Cannot process function init_devices_data(devices)")
    }
    try{
        initialize_search_queries(query_table,searches_array)
    }catch (err){
        console.log("Error: Cannot process function initialize_search_queries(query_table,searches_array)")
    }

    try{
        initialize_heatmap(tsv_array)
    }catch (err){
        console.log("Error: Cannot process function initialize_heatmap(tsv_array)")
    }
    try{
        initialize_all_websites_visited(visits_dict)
    }catch (err){
        console.log("Error: Cannot process function initialize_all_websites_visited(visits_dict)")
    }
    window.visits_dict = visits_dict
    grid_display = document.getElementById("post_upload")
    grid_display.style.visibility = "visible"


    window.demo = new Demo(document.getElementById('grid'));

    var loading_bar = document.getElementById("loading_bar")
    loading_bar.style.visibility = "hidden"

    var file_uploader = document.getElementById("file_upload")
    file_uploader.style.visibility = "hidden"
}



jQuery('#file').change(function(){

    var file = document.getElementById('file').files[0];
    var progress = jQuery('#progress');
    var loading_bar = document.getElementById("loading_bar")
    loading_bar.style.visibility = "visible"
    // Read File In Chunks
    if(file){
      var reader = new FileReader();
      var size = file.size;


      var chunk_size = Math.pow(2, 13);
      var chunks = [];

      var offset = 0;
      var bytes = 0;


      reader.onloadend = function(e){
        if (e.target.readyState == FileReader.DONE){
          var chunk = e.target.result;
          bytes += chunk.length;

          chunks.push(chunk);

          // Displays progress bar as to how many chunks processed


          if((offset < size)){
            offset += chunk_size;
            var blob = file.slice(offset, offset + chunk_size);

            reader.readAsText(blob);

          } else {
            progress.html("processing JSON file..");
            var content = chunks.join("");

            // When done, perform postprocessing

            post_process(JSON.parse(content))
            var elem = document.querySelector('#file_upload');
            //elem.parentNode.removeChild(elem);



          };
        }



      };

      var blob = file.slice(offset, offset + chunk_size);
      reader.readAsText(blob);
    }
  });