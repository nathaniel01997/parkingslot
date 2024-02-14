# app/models/slot.rb
class Slot < ApplicationRecord
    # existing code
  
    scope :active, -> { where(archived: false) }
  end
  