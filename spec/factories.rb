Factory.define :user do |u|
  u.sequence(:user_name) { |n| "user#{n}" }
  u.sequence(:email) { |n| "user#{n}@test.com" }
  u.password "f00b4rp4ss"
  u.password_confirmation { |u| u.password }
end

Factory.define :project do |p|
  p.association :user
  p.sequence(:name) { |n| "project#{n}" }
end

Factory.define :repository do |r|
  r.association :project
  r.scm "Mercurial"
end

Factory.define :ssh_key do |s|
  s.association :user
end
