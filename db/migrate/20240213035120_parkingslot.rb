class Parkingslot < ActiveRecord::Migration[7.1]
  def change
    create_table :slots do |t|
      t.string :vehicle_type
      t.datetime :time_in
      t.datetime :time_out
      t.integer :status
      t.integer :fee
      t.string :entry
      t.integer :slot_number
      t.timestamps
    end
  end
end
