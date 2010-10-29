Wide::Application.routes.draw do
  devise_for :users

  root :to => "projects#index"

  resources :projects, :except => [ :edit, :update ] do
    resource :repository, :except => [ :index, :show, :edit, :update, :new, :destroy, :create, :destroy ] do
      get 'ls'
      get 'cat'
      post 'save_file'
      post 'create_file'
      post 'create_directory'

      # SCM
      get 'is_clean'
      get 'status'
      post 'add'
      post 'forget'
      post 'revert'
      post 'mv'
      post 'rm'
      post 'commit'
    end
  end
end
