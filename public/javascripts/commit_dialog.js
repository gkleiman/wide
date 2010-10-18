function update_commit_button() {
  var base_path = '/projects/' + $('#project_id').val() + '/repository';

  if($('#commit_button').length == 0)
    return false;

  $('#commit_button').button().button('option', 'disabled', true).mouseout().blur();
  $.getJSON(base_path + '/is_clean', function(response) {
    if(response.clean == true) {
      $('#commit_button').button('option', 'disabled', true);
    } else {
      $('#commit_button').button('option', 'disabled', false);
    }
  });

  return true;
}


$(function() {
  var base_path = '/projects/' + $('#project_id').val() + '/repository';

  // Commit dialog
  $('#commit_dialog').dialog({
    title: 'Commit changes',
    resizable: false,
    draggable: false,
    modal: true,
    width: 500,
    autoOpen: false,
    buttons: { 'Commit': function() { $('#commit_dialog form').submit(); $('#commit_dialog').dialog('close'); update_commit_button(); } }
  });

  $('#commit_button').click(function() {
    $('#commit_button').attr('disabled', 'disabled');
    $('#commit_dialog pre.description').load(base_path + '/status',
      function(response, status, xhr) {
        if(status !== 'error') {
          $('#commit_dialog textarea').placeholder('Type your commit message here.');

          $('#commit_dialog').dialog('open');
        }

        $('#commit_button').button('option', 'disabled', false);
    });

    return false;
  });

  $('#commit_dialog').bind('ajax:before', function() {
    var value = $('#commit_dialog textarea').val();
    if(value === 'Type your commit message here.' || value == '')
      return false;
    return true;
  }).bind('dialogclose', function(event, ui) {
    $('#commit_button').mouseout().blur();
  });


  $('#commit_dialog').bind('ajax:success', function() {
    $('#tree').jstree('refresh');
  });


  update_commit_button();
});
