import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [lockType, setLockType] = useState('SHARED');
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const response = await axios.get('http://localhost:8000/flights/');
      setFlights(response.data);
    } catch (error) {
      console.error('Error fetching flights:', error);
    }
  };

  const startTransaction = async () => {
    try {
      const response = await axios.post('http://localhost:8000/transactions/');
      setTransaction(response.data);
    } catch (error) {
      console.error('Error starting transaction:', error);
    }
  };

  const acquireLock = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/transactions/${transaction.transaction_id}/acquire-lock/`, {
        seat_id: selectedSeat.id,
        lock_type: lockType
      });
      alert(response.data.message);
    } catch (error) {
      console.error('Error acquiring lock:', error);
      alert('Error acquiring lock');
    }
  };

  const commitTransaction = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/transactions/${transaction.transaction_id}/commit/`);
      alert(response.data.message);
      setTransaction(null);
      setSelectedSeat(null); // Reset selected seat after committing
    } catch (error) {
      console.error('Error committing transaction:', error);
    }
  };

  const abortTransaction = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/transactions/${transaction.transaction_id}/abort/`);
      alert(response.data.message);
      setTransaction(null);
      setSelectedSeat(null); // Reset selected seat after aborting
    } catch (error) {
      console.error('Error aborting transaction:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <h1 className="text-3xl font-bold text-center mb-5">Flight Booking System</h1>

      {/* Display Flights */}
      <h2 className="text-2xl mb-3">Select a Flight</h2>
      <ul className="bg-white shadow-md rounded-lg">
        {flights.map(flight => (
          <li 
            key={flight.id} 
            onClick={() => setSelectedFlight(flight)} 
            className="p-4 border-b cursor-pointer hover:bg-gray-200"
          >
            {flight.flight_number} (Departure: {new Date(flight.departure_time).toLocaleString()})
          </li>
        ))}
      </ul>

      {/* Display Seats of Selected Flight */}
      {selectedFlight && (
        <div className="mt-5">
          <h2 className="text-2xl mb-3">Select a Seat</h2>
          <ul className="bg-white shadow-md rounded-lg">
            {selectedFlight.seats.map(seat => (
              <li 
                key={seat.id} 
                onClick={() => {
                  if (seat.is_available) {
                    setSelectedSeat(seat);
                  }
                }} 
                className={`p-4 border-b cursor-pointer hover:bg-gray-200 
                  ${seat.is_available ? 'text-green-600' : 'text-red-600 line-through'} 
                  ${selectedSeat && selectedSeat.id === seat.id ? 'bg-blue-100 border border-blue-500' : ''}`}
              >
                Seat {seat.seat_number} - {seat.is_available ? 'Available' : 'Booked'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transaction Controls */}
      <div className="mt-5 bg-white shadow-md rounded-lg p-5">
        <h2 className="text-2xl mb-3">Transaction</h2>
        <button 
          onClick={startTransaction} 
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Start Transaction
        </button>
        {transaction && (
          <div className="mt-3">
            <button 
              onClick={acquireLock} 
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 mr-2"
            >
              Acquire Lock on Selected Seat
            </button>
            <button 
              onClick={commitTransaction} 
              className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-700 mr-2"
            >
              Commit Transaction
            </button>
            <button 
              onClick={abortTransaction} 
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Abort Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
