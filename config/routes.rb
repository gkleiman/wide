Wide::Application.routes.draw do
  devise_for :users

  root :to => "projects#index"

  resources :projects, :except => [ :index ] do
    member do
      get 'list_dir'
      get 'read_file'
      post 'move_file'
      post 'remove_file'
      post 'save_file'
      post 'copy_file'
      post 'create_file'
      post 'create_folder'
    end
  end
end
