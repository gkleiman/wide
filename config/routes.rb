Wide::Application.routes.draw do
  devise_for :users

  root :to => "projects#index"

  resources :users, :only => [ :index ]

  resources :projects do
    member do
      post 'compile'
      get 'compiler_output'
      get 'download_binary'
    end

    resource :repository, :except => [ :index, :show, :edit, :update, :new, :destroy, :create, :destroy ] do
      get 'ls'
      get 'cat'
      post 'save_file'
      post 'create_file'
      post 'create_directory'

      # SCM
      get 'summary'
      get 'status'
      get 'async_op_status'

      post 'add'
      post 'forget'
      post 'revert'
      post 'mv'
      post 'rm'
      post 'mark_resolved'
      post 'mark_unresolved'
      post 'commit'
      post 'pull'
    end
  end
end
