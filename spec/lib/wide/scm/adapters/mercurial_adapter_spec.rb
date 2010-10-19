require 'spec_helper'

describe Wide::Scm::Adapters::MercurialAdapter do
  before(:each) do
    FileUtils.mkdir_p(Rails.root.join('tmp', 'scm_tests'))
    FileUtils.rm_rf(Rails.root.join('tmp', 'scm_tests', 'hg_test'))
    FileUtils.cp_r(Rails.root.join('spec', 'fixtures', 'hg_test'), Rails.root.join('tmp', 'scm_tests'))

    @scm = Wide::Scm::Adapters::MercurialAdapter.new(Rails.root.join('tmp', 'scm_tests'))
  end

  it "should contain .hg in its skip_paths" do
    Wide::Scm::Adapters::MercurialAdapter.skip_paths.include?('.hg').should == true
  end

  it "should return a hash with the status of the repository" do
    status = @scm.status

    status[Wide::PathUtils.secure_path_join(@scm.base_path, '/added_file')].should == [ :added ]
    status[Wide::PathUtils.secure_path_join(@scm.base_path, '/unversioned_file')].should == [ :unversioned ]
    status[Wide::PathUtils.secure_path_join(@scm.base_path, '/removed_file')].should == [ :removed ]
  end

  it "should be able to init an empty repository" do
  end
end
