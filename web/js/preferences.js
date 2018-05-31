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
function initialize_preferences_chart(preferences,dropdown_list_domains,geolocation,accounts,devices,searches_array){
  // Creates the preferences table
  var data_groups_preferences_table = document.getElementById('preferences_data_group')
  data_groups_preferences_array = []
  for ( var i = 0, len = preferences.length; i< len; i++){
    data_groups_preferences_array.push(preferences[i].setting)
    data_groups_preferences_array.push(preferences[i].value)

  }

  data_groups_preferences_table.setAttribute('data-groups',"['" + data_groups_preferences_array.join("','") + "']")


  var prof_pic = document.getElementById("profile_picture")
  var full_name = document.getElementById("full_name")
  var email = document.getElementById("email")

  var u_web = document.getElementById("u_web")
  var u_words = document.getElementById("u_words")
  var u_geo = document.getElementById("u_geo")
  var u_ext = document.getElementById("u_ext")
  var u_dev = document.getElementById("u_dev")

  full_name.innerHTML = preferences[0].value
  email.innerHTML = preferences[1].value
  prof_pic.src = preferences[2].value


  u_web.innerHTML = 'Analyzed <strong>' + dropdown_list_domains.length + '</strong> visited websites.'
  u_words.innerHTML = 'Mined <strong>' + searches_array.length + '</strong> search queries.'
  u_geo.innerHTML = 'Found <strong>' + geolocation.length + '</strong> places.'
  u_ext.innerHTML = 'Extracted <strong>' + accounts.length + '</strong> accounts.'
  u_dev.innerHTML = 'Observed <strong>' + devices.length + '</strong> connected devices.'
}
