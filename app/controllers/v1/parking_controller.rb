class V1::ParkingController < ApplicationController
  def index
    @parking = Slot.where(archived: false)
    render json: @parking, status: :ok
  end

  def create
    @parking = Slot.new(parking_params)
  
    if @parking.save
      # @parking.fee = calculate_parking_fee(@parking)
      # @parking.save
  
      render json: @parking, status: :created
    else
      render json: { errors: @parking.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def handle_status_update(slot)
    return if slot.status == 0

    slot.fee = calculate_parking_fee(slot)
    slot.save
  end

  def update
    @parking = Slot.find_by(id: params[:id])

    if @parking.update(parking_params)
      handle_status_update(@parking)

      render json: @parking, status: :ok
    else
      render json: { errors: @parking.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @parking = Slot.find_by(id: params[:id])

    if @parking
      @parking.update(archived: true) # Mark as archived instead of destroying
      head(:ok)
    else
      head(:unprocessable_entity)
    end
  end

  private

  def parking_params
    params.require(:parking).permit(:vehicle_type, :time_in, :time_out, :status, :slot_number, :entry, :fee)
  end
end
