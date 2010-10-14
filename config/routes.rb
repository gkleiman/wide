Wide::Application.routes.draw do
  devise_for :users

  root :to => "projects#index"

  resources :projects do
    resource :repository, :except => [ :index, :show, :edit, :update, :new, :destroy, :create, :destroy ] do
      get 'ls'
      get 'read_file'
      get 'is_clean'
      get 'status'
      post 'move_file'
      post 'remove_file'
      post 'save_file'
      post 'copy_file'
      post 'create_file'
      post 'create_directory'
      post 'commit'
    end
  end
end
