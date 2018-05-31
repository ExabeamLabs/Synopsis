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

function initialize_search_queries(query_table,searches_array){

var query_data_group = document.getElementById('query_data_group')
var query_data_arr = []
// Creates the autofill table

var tab_query_table = document.getElementById("tab_query")
for ( var i = 0, len = query_table.length; i< len; i++){
  var table_row = document.createElement('tr')
  var query_time = document.createElement('td')
  var query_term_td = document.createElement('td')

  query_time.innerHTML = query_table[i].time
  query_term_td.innerHTML = query_table[i].query

  query_data_arr.push(query_table[i].time)
  query_data_arr.push(query_table[i].query)


  table_row.appendChild(query_time)
  table_row.appendChild(query_term_td)

  tab_query_table.appendChild(table_row)
}
query_data_group.setAttribute('data-groups',"['" + query_data_arr.join("','") + "']")
    $('#dataTable_query').DataTable({
    paging: false,
    scrollY: 170,
    responsive: true,
    fixedColumns: true,
    searching: true,
    columnDefs: [
      { width: 150, targets: 0 },
      { width: 250, targets: 0 }
    ],
    bInfo : false
  });
var search_engine_queries_shuffle = document.getElementById('search_engine_queries_shuffle')
search_engine_queries_shuffle.setAttribute('data-groups',"['" + searches_array.join("','") + "']")
}