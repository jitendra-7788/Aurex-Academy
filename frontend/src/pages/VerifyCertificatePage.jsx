import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function VerifyCertificatePage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/certificates/verify/${code}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Invalid certificate'));
  }, [code]);

  return (
    <div className="container page" style={{ maxWidth: 560 }}>
      <h1>Certificate verification</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {data && (
        <div className="card">
          <p className="badge">Valid</p>
          <h3>{data.studentName}</h3>
          <p>completed <strong>{data.courseTitle}</strong></p>
          <p className="muted">Instructor: {data.instructorName}</p>
          <p className="muted">Issued: {new Date(data.issuedAt).toLocaleDateString()}</p>
          <p className="muted">Certificate ID: {data.certificateId}</p>
        </div>
      )}
    </div>
  );
}
