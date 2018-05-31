
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
function initialize_all_websites_visited(visits_dict){
    // Creates the websites table
var web_visited_var = document.getElementById("mytab5")
var websites_data_group = document.getElementById('websites_data_group')
for (const [key, value] of Object.entries(visits)) {
    if (!value.domain.includes("localhost")) {
        visits_dict[value.domain] = (visits_dict[value.domain] || 0) + 1;
        var table_row = document.createElement('tr')

    var websites_domain = document.createElement('td')
    var websites_url = document.createElement('td')
    var websites_visited = document.createElement('td')
    websites_domain.innerHTML = value.domain
    websites_url.innerHTML = value.url
    websites_visited.innerHTML = value.visit_time


    table_row.appendChild(websites_visited)
    table_row.appendChild(websites_domain)
    table_row.appendChild(websites_url)


    web_visited_var.appendChild(table_row)
    }

    var entry_date = new Date(Date.parse(value.visit_time))
    entry_date.setHours(entry_date.getHours()-7);
    day = entry_date.getDay()
    hour_minute_second = (entry_date.getHours() + ':' + entry_date.getMinutes()+ ':'+ entry_date.getSeconds())

}

  $('#websites_visited_table').DataTable({
    paging: true,
    scrollY: 370,
    responsive: true,
    fixedColumns: true,
    columnDefs: [
      { width: 200, targets: 0 },
      { width: 150, targets: 0 },
      { width: 150, targets: 0 }
    ],
    bInfo : false
  });

websites_data_group.setAttribute('data-groups',"['" + dropdown_list_domains.join("','") + "']")
}