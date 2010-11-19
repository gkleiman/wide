require 'spec_helper'

describe Project do
  it "to_param should return the project name" do
    p = Factory.build(:project)

    p.to_param.should == p.name
  end

  it "should set the repository path after validation" do
    p = Factory.build(:project)

    p.repository = p.build_repository
    p.repository.scm = "Mercurial"

    p.valid?

    p.repository.path.should == Wide::PathUtils.secure_path_join(Settings.repositories_base, File.join(p.user.user_name, p.name))
  end
end
