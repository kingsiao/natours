import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51MZAF9K6ftueKHoi7Qj2GeRi4TRuqXqkYHhOoweTE6FdqFEUv6ZEBmRj9HGs5zwAfa8ipWaDPZAqdRBtnqzqvpW300w1XBmuiv'
);

export const bookTour = async (tourId) => {
  try {
    // 1. get checkout session from API
    const session = await axios(
      // `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2. create checkout form + change credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.sesssion.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
