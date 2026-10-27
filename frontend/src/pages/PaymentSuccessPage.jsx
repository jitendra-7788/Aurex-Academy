import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('confirming');
  const [message, setMessage] = useState('Confirming payment with the server…');

  useEffect(() => {
    const sessionId = params.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setMessage('Missing session id');
      return;
    }
    api
      .get(`/payments/confirm/${sessionId}`)
      .then((res) => {
        if (res.data.data.payment?.status === 'completed' || res.data.data.paymentStatus === 'paid') {
          setStatus('ok');
          setMessage('Payment verified. You are enrolled.');
        } else {
          setStatus('pending');
          setMessage('Payment is still pending verification.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Could not verify payment');
      });
  }, [params]);

  return (
    <div className="container page" style={{ maxWidth: 560 }}>
      <div className={`alert ${status === 'ok' ? 'alert-success' : status === 'error' ? 'alert-error' : 'alert-info'}`}>
        {message}
      </div>
      <Link className="btn btn-primary" to="/student">
        Go to dashboard
      </Link>
    </div>
  );
}
