import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="logo-mark">SD</div>
      <h1>SumbiD / LendLocal</h1>
      <ul>
        <li>Safe lenders.</li>
        <li>Fair lending.</li>
        <li>No sharks.</li>
      </ul>
      <button className="bubble-btn primary" onClick={() => navigate('/scan-id')}>
        Get Started
      </button>
    </div>
  );
}
