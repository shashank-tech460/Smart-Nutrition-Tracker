import React, { useState, useContext, useEffect } from 'react';
import Header from './Header';
import { UserContext } from '../contexts/UserContext';

const SlotBooking = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loggedData = useContext(UserContext);

  useEffect(() => {
    // Fetch slots from the server
    fetch('http://localhost:8000/api/slots')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch slots');
        return res.json();
      })
      .then((data) => {
        setSlots(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load slots. Please try again later.');
        setLoading(false);
      });
  }, []);

  const handleBooking = async (slotId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/book-slot/${slotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId: loggedData.loggedUser.userid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book slot');
      }

      const updatedSlot = await response.json();
      setSlots((prevSlots) =>
        prevSlots.map((slot) => (slot.id === updatedSlot.id ? updatedSlot : slot))
      );
    } catch (error) {
      console.error('Error booking slot:', error);
      setError('Unable to book slot. Please try again.');
    }
  };

  const handleUnblock = async (slotId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/unblock-slot/${slotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId: loggedData.loggedUser.userid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unblock slot');
      }

      const updatedSlot = await response.json();
      setSlots((prevSlots) =>
        prevSlots.map((slot) => (slot.id === updatedSlot.id ? updatedSlot : slot))
      );
    } catch (error) {
      console.error('Error unblocking slot:', error);
      setError('Unable to unblock slot. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <section>
      <Header />
      <div className="slot-booking-container">
        <h1>Slot Booking for Video Conference</h1>
        <div className="slots">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`slot ${
                slot.booked
                  ? slot.memberId === loggedData.loggedUser.userid
                    ? 'booked-by-member'
                    : 'booked'
                  : 'available'
              }`}
              onClick={() => !slot.booked && handleBooking(slot.id)}
            >
              {slot.time} -{' '}
              {slot.booked
                ? slot.memberId === loggedData.loggedUser.userid
                  ? 'Booked by you'
                  : 'Booked'
                : 'Available'}
              {/* Show Block button if slot is available */}
              {!slot.booked && (
                <button
                  className="block-button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents triggering the onClick event of the slot
                    handleBooking(slot.id); // Book the slot when Block button is clicked
                  }}
                >
                  Block
                </button>
              )}
              {/* Show Unblock button if slot is booked by the user */}
              {slot.booked && slot.memberId === loggedData.loggedUser.userid && (
                <button
                  className="unblock-button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents triggering the onClick event of the slot
                    handleUnblock(slot.id); // Unblock the slot when Unblock button is clicked
                  }}
                >
                  Unblock
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SlotBooking;
