$(function () {
  $('.remove_link').live('click', function () {
    $(this).prev("input[type=hidden]").val("1");
    $(this).closest(".fields").hide();

    return false;
  });

  $('.remove_collaborator').live('click', function () {
    $(this).parent().fadeOut('slow', function () { $(this).remove(); });
  });

  $('#collaborator_ids').tokenInput("/users", {
    hintText: "Begin typing the user name of the collaborator you wish to add.",
    noResultsText: "No results",
    searchingText: "Searching...",
    prePopulate: collaborators_ids,
    classes: {
      tokenList: "token-input-list ui-widget ui-widget-content",
      token: "ui-widget-header ui-state-default",
      tokenDelete: "ui-icon ui-icon-circle-minus",
      selectedToken: "ui-state-active",
      highlightedToken: "ui-state-active",
      dropdown: "ui-autocomplete ui-menu ui-widget ui-widget-content ui-corner-all autocomplete-dropdown",
      dropdownItem: "ui-menu-item ui-corner-all",
      dropdownItem2: "",
      selectedDropdownItem: "ui-menu-item ui-corner-all ui-state-hover",
      inputToken: "ui-autocomplete-input"
    }
  });

  $('#download_makefile_button').button().click(function () {
    window.location = WIDE.base_path() + '/' + 'makefile';

    return false;
  }).hover(function () {
    $(this).removeClass('ui-state-hover');
  }, function () {
    $(this).addClass('ui-state-hover');
  });
});
