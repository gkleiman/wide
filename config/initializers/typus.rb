Typus.setup do |config|

  # Application name.
  config.admin_title = "WIDE"
  # config.admin_sub_title = ""

  # When mailer_sender is set, password recover is enabled. This email
  # address will be used in Admin::Mailer.
  # config.mailer_sender = "admin@example.com"

  # Define file attachment settings.
  # config.file_preview = :typus_preview
  # config.file_thumbnail = :typus_thumbnail

  # Authentication: +:none+, +:http_basic+
  # Run `rails g typus:migration` if you need an advanced authentication system.
  config.authentication = :session

  # Define username and password for +:http_basic+ authentication
  # config.username = "admin"
  # config.password = "columbia"

  # Pagination options:
  # These options are passed to `will_paginate`. You can see the available
  # options in the plugin source. (https://github.com/mislav/will_paginate/blob/rails3/lib/will_paginate/view_helpers.rb)
  # config.pagination = { :previous_label => "&larr; " + _t("Previous"),
  #                       :next_label => _t("Next") + " &rarr;" }

  # Define available languages on the admin interface.
  # config.available_locales = [:en]

end
