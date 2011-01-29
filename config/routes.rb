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
      post 'create_file'
      post 'create_directory'

      # SCM
      get 'summary'
      get 'diffstat'
      get 'async_op_status'
      post 'revert'

      post 'commit'
      post 'pull'

      # Changesets
      resources :changesets, :only => [ :index, :show ]

      # Entries (files and directories)
      resources :entries, :only => [ :index ] do
        collection do
          get '*path/diff' => 'entries#diff', :as => 'diff'
          get '*path/changesets' => 'entries#changesets', :as => 'changesets'

          post '*path/add' => 'entries#add', :as => 'add'
          post '*path/forget' => 'entries#forget', :as => 'forget'
          post '*path/revert' => 'entries#revert', :as => 'revert'
          post '*path/mv' => 'entries#mv', :as => 'mv'
          post '*path/mark_resolved' => 'entries#mark_resolved', :as => 'mark_resolved'
          post '*path/mark_unresolved' => 'entries#mark_unresolved', :as => 'mark_unresolved'

          get '*path' => 'entries#show', :as => 'show'
          post '*path' => 'entries#update', :as => 'update'
          delete '*path' => 'entries#destroy', :as => 'destroy'
          put '*path' => 'entries#create', :as => 'create'
        end
      end
    end
  end
end
