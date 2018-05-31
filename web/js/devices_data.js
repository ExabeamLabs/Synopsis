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
function init_devices_data(devices){
    var devices_data_group = document.getElementById('devices_data_group')
    var no_data = document.getElementsByClassName("dataTables_empty")
    removeElementsByClass("dataTables_empty")
var devices_data_arr = []
// Creates the autofill table
var datatables_devices_var = document.getElementById("mytab4")
for ( var i = 0, len = devices.length; i< len; i++){
  var table_row = document.createElement('tr')
  var autofill_name = document.createElement('td')
  var autofill_ip = document.createElement('td')
  var autofill_model = document.createElement('td')
  var autofill_network = document.createElement('td')
  // autofill_value.setAttribute("style", "word-wrap:break-word");
  autofill_name.innerHTML = devices[i].friendlyName
  autofill_ip.innerHTML = devices[i].ip
  autofill_model.innerHTML = devices[i].modelName
  autofill_network.innerHTML = devices[i].networks

  devices_data_arr.push(devices[i].friendlyName)
  devices_data_arr.push(devices[i].ip)
  devices_data_arr.push(devices[i].networks)
  devices_data_arr.push(devices[i].modelName)

  table_row.appendChild(autofill_name)
  table_row.appendChild(autofill_ip)
  table_row.appendChild(autofill_model)
  table_row.appendChild(autofill_network)

  datatables_devices_var.appendChild(table_row)
}
devices_data_group.setAttribute('data-groups',"['" + devices_data_arr.join("','") + "']")
 $('#devices_table_declaration').DataTable({
    paging: false,
    scrollY: 445,
    searching: false,
    bSort : false,
    bInfo : false,
  });
}