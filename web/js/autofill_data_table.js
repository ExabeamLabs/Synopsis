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
function init_autofill_data_table(autofill){
    var autofill_data_group = document.getElementById('autofill_data_group')
    var autofill_data_arr = ['autofill']
    // Creates the autofill table
    try {
    var autofill_data_var = document.getElementById("mytab3")
    for ( var i = 0, len = autofill.length; i< len; i++){
      var table_row = document.createElement('tr')
      var autofill_name = document.createElement('td')
      var autofill_value = document.createElement('td')
      var autofill_count = document.createElement('td')
      autofill_value.setAttribute("style", "word-wrap:break-word");
      autofill_name.innerHTML = autofill[i].name
      autofill_value.innerHTML = autofill[i].value
      autofill_count.innerHTML = autofill[i].count
      autofill_data_arr.push(autofill[i].name)
      autofill_data_arr.push(autofill[i].value)

      table_row.appendChild(autofill_name)
      table_row.appendChild(autofill_value)
      table_row.appendChild(autofill_count)

      autofill_data_var.appendChild(table_row)
      }
    }
    catch(err) {
      console.log("Cannot find autofill")
    }
    autofill_data_group.setAttribute('data-groups',"['" + autofill_data_arr.join("','") + "']")

  $('#autofill_data_table_declaration').DataTable({
    paging: false,
    scrollY: 173,
    responsive: true,
    columnDefs: [
      { width: 50, targets: 0 },
      { width: 50, targets: 0 },
      { width: 50, targets: 0 }
    ],
    fixedColumns: true,
    bInfo : false,
    order: [[ 2, "desc" ]]
  });
}