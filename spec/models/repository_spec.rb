require 'spec_helper'

class Wide::Scm::Adapters::TestAdapter
  def self.valid_url?(url)
    url == "valid"
  end
end

describe Repository do
  context "Validating the scm name" do
    it "should not be possible to create a repository with a non existant scm" do
      repo = Repository.new do |r|
        r.scm = 'Foobar'
        r.url = 'valid'
        r.path = '/foo'
      end

      repo.valid?.should == false
    end

    it "should be possible to create a repository with an existent scm" do
      Wide::Scm::Scm.add_adapter('Test')
      repo = Repository.new do |r|
        r.scm = 'Test'
        r.url = 'valid'
        r.path = '/foo'
      end

      repo.valid?.should == true
    end
  end

  context "With a valid scm adapter" do
    before(:all) do
      Wide::Scm::Scm.add_adapter('Test')
    end

    context "Validating the url" do
      it "should not be possible to create a repository with a url not allowed by the scm engine" do
        repo = Repository.new do |r|
          r.url = 'invalid'
          r.scm = 'Test'
          r.path = '/foo'
        end

        repo.valid?.should == false
      end

      it "should be possible to create a repository with a url allowed by the scm engine" do
        repo = Repository.new do |r|
          r.url = 'valid'
          r.scm = 'Test'
          r.path = '/foo'
        end

        repo.valid?.should == true
      end
    end
  end
end
