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
function initialize_searches_wordcloud(search_word_cloud){
    document.getElementById('word-cloud-img')
    .setAttribute(
        'href', 'data:image/png;base64,'+search_word_cloud
    );
    document.getElementById('word-cloud-img2')
    .setAttribute(
        'src', 'data:image/png;base64,'+search_word_cloud
    );

}

function initialize_autofill_wordcloud(autofill_word_cloud,autofill_array){
      try{
    document.getElementById('word-cloud-img-autofill')
    .setAttribute(
        'href', 'data:image/png;base64,'+autofill_word_cloud
    );
    document.getElementById('word-cloud-img-autofill2')
    .setAttribute(
        'src', 'data:image/png;base64,'+autofill_word_cloud
    );
  }catch(err) {
    console.log("Cannot find autofill word cloud")
  }
  var auto_fill_queries_shuffle = document.getElementById('auto_fill_queries_shuffle')
auto_fill_queries_shuffle.setAttribute('data-groups',"['" + autofill_array.join("','") + "']")
}