require 'spec_helper'

describe Wide::PathUtils do
  context 'secure_path_join' do
    it 'should raise an exception if the base path is not the base path of the
    resulting joined path' do
      lambda { Wide::PathUtils.secure_path_join('/test', '..') }.should raise_exception
    end

    it 'should correctly join a base path and a relative path' do
      Wide::PathUtils.secure_path_join('/test', 'path').should == '/test/path'
    end

    it 'should return / if the base path is / and the relative path is blank or nil' do
      Wide::PathUtils.secure_path_join('/', '').should == '/'
      Wide::PathUtils.secure_path_join('/', nil).should == '/'
    end

    it 'should return work if the base path is /' do
      Wide::PathUtils.secure_path_join('/', 'test').should == '/test'
    end

    it 'should raise an exception if the base path is blank or nil' do
      lambda { Wide::PathUtils.secure_path_join('', 'a') }.should raise_exception
      lambda { Wide::PathUtils.secure_path_join(nil, 'a') }.should raise_exception
    end
  end

  context 'with_leading_slash' do
    it 'should return a path with a leading slash if given a path without a leading slash' do
      Wide::PathUtils.with_leading_slash('foo/bar').should == '/foo/bar'
    end

    it 'should not modify the path if it already has a leading slash' do
      Wide::PathUtils.with_leading_slash('/foo/bar').should == '/foo/bar'
    end
  end

  context 'without_leading_slash' do
    it 'should return a path without a leading slash if given a path with a leading slash' do
      Wide::PathUtils.without_leading_slash('/foo/bar').should == 'foo/bar'
    end

    it 'should not modify the path if it already has not a leading slash' do
      Wide::PathUtils.without_leading_slash('foo/bar').should == 'foo/bar'
    end
  end

  context 'with_trailing_slash' do
    it 'should return a path with a trailing slash if given a path without a trailing slash' do
      Wide::PathUtils.with_trailing_slash('/foo/bar').should == '/foo/bar/'
    end

    it 'should not modify the path if it already has a trailing slash' do
      Wide::PathUtils.with_trailing_slash('/foo/bar/').should == '/foo/bar/'
    end
  end

  context 'without_trailing_slash' do
    it 'should return a path without a trailing slash if given a path with a trailing slash' do
      Wide::PathUtils.without_trailing_slash('/foo/bar/').should == '/foo/bar'
    end

    it 'should not modify the path if it already has not a trailing slash' do
      Wide::PathUtils.without_trailing_slash('foo/bar').should == 'foo/bar'
    end
  end

  context 'relative_to_base' do
    it 'should return a relative path given a base path' do
      Wide::PathUtils.relative_to_base('/foo/bar/', '/foo/bar/test/path').should == 'test/path'

      Wide::PathUtils.relative_to_base('/', '/foo/bar/test/path/').should == 'foo/bar/test/path'
    end

    it 'should remove trailing spaces when returning the relative path' do
      Wide::PathUtils.relative_to_base('/foo/bar/', '/foo/bar/test/path/').should == 'test/path'
    end

    it 'should return an empty string if the base path matches the full path' do
      Wide::PathUtils.relative_to_base('/', '/').should == ''
      Wide::PathUtils.relative_to_base('/foo/bar/', '/foo/bar').should == ''
      Wide::PathUtils.relative_to_base('/foo/bar/', '/foo/bar').should == ''
      Wide::PathUtils.relative_to_base('/foo/bar', '/foo/bar/').should == ''
    end

    it 'should raise an exception if path is not inside base' do
      lambda { Wide::PathUtils.relative_to_base('/foo/bar/', '/a//foo/bar') }.should raise_exception
    end
  end
end
