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

function init_extracted_accounts(accounts){
    var table_body = document.getElementById("extracted_accounts_collection")
    var data_groups_extracted_table = document.getElementById('extracted_accounts')
    data_groups_extracted_array = []

    for ( var i = 0, len = accounts.length; i< len; i++){
      var table_row = document.createElement('tr')
      var account_cell = document.createElement('td')
      var account_domain = document.createElement('td')
      account_domain.setAttribute("style", "word-wrap:break-word");
      account_cell.innerHTML = accounts[i].account
      account_domain.innerHTML = accounts[i].domain
      data_groups_extracted_array.push(accounts[i].account)
      data_groups_extracted_array.push(accounts[i].domain)
      table_row.appendChild(account_cell)
      table_row.appendChild(account_domain)
      table_body.appendChild(table_row)
    }


    data_groups_extracted_table.setAttribute('data-groups',"['" + data_groups_extracted_array.join("','") + "']")
      $('#extracted_accounts_datatable').DataTable({
    paging: false,
    scrollY: 190,
    searching: false,
    bSort : false,
    bInfo : false,
  });

}