class AddArchivedToSlots < ActiveRecord::Migration[7.1]
  def change
    add_column :slots, :archived, :boolean, default: false
  end
end
