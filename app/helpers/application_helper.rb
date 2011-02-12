module ApplicationHelper
  def title(page_title)
    content_for :title, page_title.to_s
  end

  def link_to_remove_fields(name, f)
    f.hidden_field(:_destroy) + link_to(name, '#', :class => "remove_link")
  end

  def avatar_url(email)
    gravatar_id = Digest::MD5::hexdigest(email).downcase
    "http://gravatar.com/avatar/#{gravatar_id}.png?s=48&d=identicon"
  end

  def highlight_diff(diff)
    CodeRay.scan(diff, 'diff').html(:css => :class).html_safe
  end

  def breadcrumbs(crumbs)
    if crumbs.length > 1
      current_crumb = crumbs.pop
      crumbs.map! { |crumb| content_tag('li', crumb.html_safe) } << content_tag('li', current_crumb.html_safe, :class => 'current')
    else
      crumbs.map! { |crumb| content_tag('li', crumb.html_safe, :class => 'current') }
    end

    content_for(:breadcrumbs, crumbs.join(content_tag('li', '|', :class => 'separator')).html_safe)
  end
end
