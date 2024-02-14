import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './parking.css';

const ParkingApp = () => {
  const [parkingSlots, setParkingSlots] = useState([]);
  const [vehicleType, setVehicleType] = useState('S'); // Default to 'S' type
  const [selectedEntry, setSelectedEntry] = useState('A'); // Default entry point
  const [assignedNumbers, setAssignedNumbers] = useState([]);

  const getParkingSlots = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:3000/v1/parking?entry=${selectedEntry}`);
      setParkingSlots(response.data);
    } catch (error) {
      console.error('Error fetching parking slots:', error);
    }
  };

  // Function to generate a random number between min (inclusive) and max (exclusive)
  const createParkingSlot = async () => {
    try {
      const entryParkingSlots = parkingSlots.filter((slot) => slot.entry === selectedEntry);
      const unoccupiedSlots = entryParkingSlots.filter((slot) => slot.status === 1);
  
      if (unoccupiedSlots.length < 10) {
        const currentTime = new Date();
        const entryFee = 40; // Initial flat rate for the first three hours
  
        // Fetch the latest parking slots
        const latestSlotsResponse = await axios.get('http://127.0.0.1:3000/v1/parking');
        const latestSlots = latestSlotsResponse.data;
  
        // Filter available slots with status unoccupied
        const availableUnoccupiedSlots = latestSlots.filter(
          (slot) => slot.entry === selectedEntry && slot.status === 1 && !entryParkingSlots.some((s) => s.slot_number === slot.slot_number)
        );
  
        if (availableUnoccupiedSlots.length < 10) {
          // Auto-generate next available slot number
          let nextSlotNumber;
          do {
            nextSlotNumber = Math.floor(Math.random() * 10) + 1;
          } while (assignedNumbers.includes(nextSlotNumber));

          setAssignedNumbers((prevNumbers) => [...prevNumbers, nextSlotNumber]);

  
          if (nextSlotNumber <= 10) {
            // Randomly select a slot from the available unoccupied slots
            const response = await axios.post('http://127.0.0.1:3000/v1/parking', {
              parking: {
                vehicle_type: vehicleType,
                status: 1,
                time_in: currentTime.toISOString(),
                time_out: null,
                entry: selectedEntry,
                slot_number: nextSlotNumber, // Assign the slot number
                fee: entryFee,
              },
            });
  
            const updatedSlot = response.data;
  
            // Fetch the latest parking slots
            await getParkingSlots();
  
            // Display or use parkingFee as needed
            console.log(`Parking Fee for Slot ${updatedSlot.id}: PHP ${updatedSlot.fee}`);
            setVehicleType('S'); // Reset vehicle type after parking
          } else {
            alert(`No more available parking slots for entry point ${selectedEntry}!`);
          }
        } else {
          alert(`No more available unoccupied parking slots for entry point ${selectedEntry}!`);
        }
      } else {
        alert(`No more parking slots available for entry point ${selectedEntry}!`);
      }
    } catch (error) {
      console.error('Error creating parking slot:', error);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
        const currentTime = new Date();
        const timeOutValue = newStatus === 0 ? currentTime.toISOString() : null; //real time data
        //const timeOutValue = newStatus === 0 ? new Date(currentTime.getTime() + 6 * 60 * 60 * 1000) : null; //testing 
        const entryFee = 40;
        const hourlyRate = {
            S: 20,
            M: 60,
            L: 100,
        };

        let updatedSlot;
        const responseGet = await axios.get(`http://127.0.0.1:3000/v1/parking?entry=${selectedEntry}`);

        if (responseGet.status === 200) {
            updatedSlot = responseGet.data;
        }

        // If the slot is unoccupied, calculate and update the fee
        if (newStatus === 0) {
            // Fetch the updated slot data before making the PUT request
            updatedSlot = responseGet.data;

            // Iterate through each slot in the array
            updatedSlot.forEach(async (slot) => {
                const timeIn = new Date(slot.time_in);
                const timeOut = new Date(timeOutValue || currentTime);
                const elapsedMilliseconds = timeOut - timeIn;
                const elapsedHours = Math.ceil(elapsedMilliseconds / (1000 * 60 * 60));

                let parkingFee = entryFee; // Initial flat rate for the first three hours

                if (elapsedHours > 3) {
                    // Calculate fee for exceeding hours based on slot size
                    const hourlyRateForSize = hourlyRate[slot.vehicle_type];
                    parkingFee += hourlyRateForSize * (elapsedHours - 3);
                }

                if (elapsedHours > 24) {
                    // Calculate fee for exceeding 24 hours
                    const fullDays = Math.floor(elapsedHours / 24);
                    parkingFee += 5000 * fullDays;
                }

                // Update the fee in the slot data
                slot.fee = parkingFee;
            });
        }

        // Make the PUT request with the updated data including the fee
        const responsePut = await axios.put(`http://127.0.0.1:3000/v1/parking/${id}`, {
            status: newStatus,
            time_out: timeOutValue,
            entry: selectedEntry,
            fee: newStatus === 0 ? updatedSlot.find((slot) => slot.id === id)?.fee : null,
            archived: newStatus === 0,
        });

        // Update the slot in the state
        setParkingSlots((prevSlots) =>
            prevSlots.map((slot) => (slot.id === id ? responsePut.data : slot))
        );
    } catch (error) {
        console.error('Error updating parking slot status:', error);
    }
  };

  useEffect(() => {
    getParkingSlots(); // Fetch parking slots on initial render
  }, [selectedEntry]); // Refresh slots when the selected entry changes

  return (
    <div>
      <h1 className='app'>OO Parking Lot</h1>
      <form
        className="form-container"
        onSubmit={(e) => {
          e.preventDefault();
          createParkingSlot();
        }}  
      >
        <label className="form-label">
          Vehicle Type:
          <select
            className="form-input"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value.toUpperCase())}
          >
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
          </select>
        </label>

        <label className="form-label">
          Entry Point:
          <select
            className="form-input"
            value={selectedEntry}
            onChange={(e) => setSelectedEntry(e.target.value)}
          >
            <option value="A">Entrance/Exit A</option>
            <option value="B">Entrance/Exit B</option>
            <option value="C">Entrance/Exit C</option>
          </select>
        </label>

        <div className="form-button-container">
          <button type="submit" className="form-button">
            Park A Car
          </button>
        </div>
      </form>

      <ul className="parking-table">
        <li className="table-header">
          <span>ID</span>
          <span>VEHICLE TYPE</span>
          <span>STATUS</span>
          <span>TIME IN</span>
          <span>TIME OUT</span>
          <span>ENTRY</span>
          <span>PARKING NO.</span>
          <span>FEE</span>
          <span>ACTION</span>
        </li>
        {parkingSlots
          .sort((a, b) => {
            const statusA = a.status;
            const statusB = b.status;
  
            if (statusA === statusB) {
              return b.id - a.id;
            }
            return statusB - statusA;
          }) // Sort by id in descending order
          .map((slot) => (
            <li key={slot.id} className="table-row">
              <span>{slot.id}</span>
              <span>{slot.vehicle_type}</span>
              <span>{slot.status === 1 ? 'Occupied' : 'Done'}</span>
              <span>{new Date(slot.time_in).toLocaleString('en-PH')}</span>
              <span>{slot.time_out ? new Date(slot.time_out).toLocaleString('en-PH') : 'Not Set'}</span>
              <span>{slot.entry}</span>
              <span>{slot.slot_number}</span> {/* Display the slot number */}
              <span>{slot.fee}</span> {/* Display the fee */}
              <span>
                <button
                  onClick={() => handleUpdateStatus(slot.id, slot.status === 0 ? 1 : 0)}
                  disabled={slot.status === 0}
                >
                  {slot.status === 1 ? 'Occupied' : 'Done'}
                </button>
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ParkingApp;
