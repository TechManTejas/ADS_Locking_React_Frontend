import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = "http://localhost:8000"; // Replace with your Django backend URL

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isSeatLocked, setIsSeatLocked] = useState(false);
  const [blinkingSeatId, setBlinkingSeatId] = useState(null);

  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Setup WebSocket when token is available
  useEffect(() => {
    if (token) {
      const newSocket = new WebSocket("ws://localhost:8000/ws/locking/");
      setSocket(newSocket);

      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      return () => {
        newSocket.close();
      };
    }
  }, [token]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    const updatedSeatInfo = data.seat_info;

    if (!updatedSeatInfo || !updatedSeatInfo.id) {
      console.error("Invalid seat information received:", updatedSeatInfo);
      return;
    }

    // Update seat state based on the event type
    if (data.event_type === "seat_locked") {
      toast.success(`Seat ${updatedSeatInfo.seat_number} locked!`);
    } else if (data.event_type === "seat_booked") {
      toast.success(`Seat ${updatedSeatInfo.seat_number} booked!`);
    } else if (data.event_type === "seat_selected") {
      toast.success(`Seat ${updatedSeatInfo.seat_number} selected!`);

      // Trigger the blinking effect for the selected seat
      setBlinkingSeatId(updatedSeatInfo.id);

      // Remove blinking effect after 1 second
      setTimeout(() => {
        setBlinkingSeatId(null);
      }, 1000);
    }

    // Update the state of the seats to reflect changes for all users
    setSeats((prevSeats) =>
      prevSeats.map((seat) =>
        seat.id === updatedSeatInfo.id
          ? {
              ...seat,
              status: updatedSeatInfo.status, // Update the status ('selected', 'locked', 'booked')
              is_locked: updatedSeatInfo.status === "locked", // Update is_locked status
              is_booked: updatedSeatInfo.status === "booked", // Update is_booked status
            }
          : seat
      )
    );
  };

  useEffect(() => {
    if (token) {
      fetchFlights();
    }
  }, [token]);

  const handleSignup = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register/`, {
        username,
        password,
      });
      toast.success("User registered successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Signup failed!");
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/login/`, {
        username,
        password,
      });
      const { token } = response.data;
      localStorage.setItem("token", token);
      setToken(token);
      toast.success("Logged in successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed!");
    }
  };

  const fetchFlights = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/flight/flights/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setFlights(response.data.flights);
    } catch (error) {
      toast.error("Failed to fetch flights!");
    }
  };

  const fetchSeats = async (flightId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/flight/flights/${flightId}/seats/`,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );

      console.log(response.data);

      setSelectedFlight(flightId);
      setSeats(response.data.seats);
      setSelectedSeat(null); // Reset selected seat on flight change
      setIsSeatLocked(false); // Reset locked status on flight change
    } catch (error) {
      toast.error("Failed to fetch seats!");
    }
  };

  const handleSeatSelect = (seat) => {
    setSelectedSeat(seat);
    setIsSeatLocked(false); // Reset lock state when selecting a new seat

    // Notify others that a seat has been selected
    socket?.send(
      JSON.stringify({
        event_type: "seat_selected",
        seat_info: {
          id: seat.id,
          seat_number: seat.seat_number,
          status: "selected",
        },
      })
    );
  };

  const lockSeat = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/locking/lock/${selectedSeat.id}/`,
        {},
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      setIsSeatLocked(true);
      toast.success("Seat locked successfully!");

      // Notify others that the seat is locked
      socket?.send(
        JSON.stringify({
          event_type: "seat_locked",
          seat_info: {
            id: selectedSeat.id,
            seat_number: selectedSeat.seat_number,
            status: "locked",
            is_locked: true, // Send updated is_locked status
            is_booked: false, // Locked, but not booked yet
          },
        })
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to lock seat!");
    }
  };

  const bookSeat = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/booking/book/${selectedSeat.id}/`,
        {},
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      toast.success("Seat booked successfully!");

      // Notify others that the seat is booked
      socket?.send(
        JSON.stringify({
          event_type: "seat_booked",
          seat_info: {
            id: selectedSeat.id,
            seat_number: selectedSeat.seat_number,
            status: "booked",
            is_locked: false, // Booked seat is no longer locked
            is_booked: true, // Send updated is_booked status
          },
        })
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to book seat!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Toaster />
      {!token ? (
        <div className="w-full max-w-sm bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Sign In / Sign Up</h2>
          <input
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-between">
            <button
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              onClick={handleSignup}
            >
              Sign Up
            </button>
            <button
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
              onClick={handleLogin}
            >
              Sign In
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Available Flights</h2>
          <ul className="mb-8">
            {flights.map((flight) => (
              <li
                key={flight.id}
                className="p-4 mb-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                onClick={() => fetchSeats(flight.id)}
              >
                {flight.flight_number} from {flight.departure_city} to{" "}
                {flight.arrival_city}
              </li>
            ))}
          </ul>

          {/* Show selected seat */}
          {selectedSeat && (
            <div className="mb-4 p-4 bg-blue-100 rounded">
              Selected Seat: <strong>{selectedSeat.seat_number}</strong>
            </div>
          )}

          {selectedFlight && (
            <>
              <h2 className="text-2xl font-bold mb-4">Available Seats</h2>
              <ul>
                {seats.map((seat) => (
                  <li
                    key={seat.id}
                    className={`p-4 mb-2 rounded ${
                      seat.is_booked ? "bg-red-500 text-white" : "bg-gray-100"
                    } ${
                      seat.is_locked ? "bg-yellow-500" : "hover:bg-gray-200 cursor-pointer"
                    } ${blinkingSeatId === seat.id ? 'blink' : ''}`} // Apply blinking class
                    onClick={() =>
                      !seat.is_booked && !seat.is_locked && handleSeatSelect(seat)
                    }
                  >
                    Seat {seat.seat_number} {seat.is_booked && "(Booked)"}
                    {seat.is_locked && !seat.is_booked && "(Locked)"}
                  </li>
                ))}
              </ul>


              {/* Show "Proceed to Book" if a seat is selected but not locked */}
              {selectedSeat && !isSeatLocked && (
                <button
                  className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                  onClick={lockSeat}
                >
                  Proceed to Book
                </button>
              )}

              {/* Show "Pay" button if the seat is locked */}
              {isSeatLocked && (
                <button
                  className="mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600"
                  onClick={bookSeat}
                >
                  Pay and Book
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
