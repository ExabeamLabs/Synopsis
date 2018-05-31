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
  var Demo = function (element) {
    this.element = element;

    this.shuffle = new Shuffle(element, {
      itemSelector: '.grid__brick',
      sizer: element.querySelector('.my-sizer-element'),
    });

    // Log events.
    this.addShuffleEventListeners();

    this._activeFilters = [];

    this.addFilterButtons();
    this.addSorting();
    this.addSearchFilter();

    this.mode = 'exclusive';
  };
  Demo.prototype.addSorting = function () {
    var buttonGroup = document.querySelector('.sort-options');

    if (!buttonGroup) {
      return;
    }

    buttonGroup.addEventListener('change', this._handleSortChange.bind(this));
  };

 // Advanced filtering
Demo.prototype.addSearchFilter = function () {
  var searchInput = document.querySelector('.js-shuffle-search');

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener('keyup', this._handleSearchKeyup.bind(this));
};

/**
 * Filter the shuffle instance by items with a title that matches the search input.
 * @param {Event} evt Event object.
 */
Demo.prototype.addShuffleEventListeners = function () {
  this.shuffle.on(Shuffle.EventType.LAYOUT, function (data) {

  });

  this.shuffle.on(Shuffle.EventType.REMOVED, function (data) {

  });
};
Demo.prototype.addFilterButtons = function () {
  var options = document.querySelector('.filter-options');

  if (!options) {
    return;
  }

  var filterButtons = Array.from(options.children);

  filterButtons.forEach(function (button) {
    button.addEventListener('click', this._handleFilterClick.bind(this), false);
  }, this);
};

Demo.prototype._handleSearchKeyup = function (evt) {
  var searchText = evt.target.value.toLowerCase();

  this.shuffle.filter(function (element, shuffle) {

    // If there is a current filter applied, ignore elements that don't match it.
    if (shuffle.group !== Shuffle.ALL_ITEMS) {
      // Get the item's groups.
      var groups = JSON.parse(element.getAttribute('data-groups'));
      var isElementInCurrentGroup = groups.indexOf(shuffle.group) !== -1;

      // Only search elements in the current group
      if (!isElementInCurrentGroup) {
        return false;
      }
    }

    var titleElement = element.getAttribute('data-groups').toString()
    var titleText = titleElement.toLowerCase().trim();

    return titleText.indexOf(searchText) !== -1;
  });
};




