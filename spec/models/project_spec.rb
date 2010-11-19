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

  describe "testing validations" do
    subject { Factory.build(:project) }

    it "should accept valid values for user_name" do
      should accept_values_for(:name, 'test', 'test1', 'test1-',
                               'test1_', 'test ')
    end

    it "should not accept invalid values for user_name" do
      should_not accept_values_for(:name, 'test!', 'test.', '.test',
                                   '..test', '/test', nil, '../', '../test')
    end

    it "should not accept two projects with the same name and user" do
      project1 = Factory.create(:project)
      project2 = Factory.build(:project, :user => project1.user, :name => project1.name)

      project2.should_not be_valid
    end
  end
end
