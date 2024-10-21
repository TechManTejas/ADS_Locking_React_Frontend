import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [lockType, setLockType] = useState("EXCLUSIVE");
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const response = await axios.get("http://localhost:8000/flights/");
      setFlights(response.data);
    } catch (error) {
      console.error("Error fetching flights:", error);
    }
  };

  const startTransaction = async () => {
    try {
      const response = await axios.post("http://localhost:8000/transactions/");
      setTransaction(response.data);
    } catch (error) {
      console.error("Error starting transaction:", error);
    }
  };

  const acquireLock = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/transactions/${transaction.transaction_id}/acquire-lock/`,
        {
          seat_id: selectedSeat.id,
          lock_type: lockType,
        }
      );
      alert(response.data.message);
    } catch (error) {
      console.error("Error acquiring lock:", error);
      alert("Error acquiring lock");
    }
  };

  const commitTransaction = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/transactions/${transaction.transaction_id}/commit/`
      );
      alert(response.data.message);
      setTransaction(null);
      setSelectedSeat(null);
    } catch (error) {
      console.error("Error committing transaction:", error);
    }
  };

  const abortTransaction = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/transactions/${transaction.transaction_id}/abort/`
      );
      alert(response.data.message);
      setTransaction(null);
      setSelectedSeat(null);
    } catch (error) {
      console.error("Error aborting transaction:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold text-center mb-10">Flight Booking System</h1>

      {/* Flight Selection */}
      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <h2 className="text-2xl mb-4 font-semibold">Available Flights</h2>
          <div className="grid grid-cols-1 gap-4">
            {flights.map((flight) => (
              <div
                key={flight.id}
                onClick={() => setSelectedFlight(flight)}
                className={`p-6 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg ${
                  selectedFlight && selectedFlight.id === flight.id
                    ? "border-2 border-blue-500"
                    : ""
                }`}
              >
                <h3 className="text-xl font-bold mb-2">
                  Flight {flight.flight_number}
                </h3>
                <p>Departure: {new Date(flight.departure_time).toLocaleString()}</p>
                <p>Destination: {flight.destination}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seat Map for Selected Flight */}
      {selectedFlight && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-center">Select a Seat</h2>
          <div className="grid grid-cols-8 gap-2 justify-center">
            {selectedFlight.seats.map((seat) => (
              <div
                key={seat.id}
                onClick={() => {
                  if (seat.is_available && !seat.locked) {
                    setSelectedSeat(seat);
                  }
                }}
                className={`p-4 text-center border rounded-lg cursor-pointer hover:bg-gray-200 ${
                  seat.is_available && !seat.locked
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                } ${
                  selectedSeat && selectedSeat.id === seat.id
                    ? "bg-blue-200 border-blue-500"
                    : ""
                }`}
              >
                {seat.seat_number} <br />
                {seat.is_available
                  ? seat.locked
                    ? "Locked"
                    : "Available"
                  : "Booked"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Controls */}
      {selectedFlight && (
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-semibold mb-4">Manage Your Booking</h2>
          <div>
            {!transaction ? (
              <button
                onClick={startTransaction}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Start Transaction
              </button>
            ) : (
              <>
                <div className="flex justify-center items-center gap-4 mb-5">
                  <button
                    onClick={acquireLock}
                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
                  >
                    Acquire Lock
                  </button>
                  <button
                    onClick={commitTransaction}
                    className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-700"
                  >
                    Commit
                  </button>
                  <button
                    onClick={abortTransaction}
                    className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700"
                  >
                    Abort
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Transaction ID: {transaction.transaction_id}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
