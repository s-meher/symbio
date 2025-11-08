import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLenderDashboard } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';

export default function DashboardLender() {
  const user = useRequiredUser();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.userId) return;
    async function load() {
      try {
        // GET /dashboard/lender -> {next_payment,expected_revenue_year}
        const resp = await fetchLenderDashboard(user.userId);
        setData(resp);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load dashboard.');
      }
    }
    load();
  }, [user?.userId]);

  if (!user) return null;

  return (
    <div className="card">
      <div className="tabs">
        <button className="tab-pill" onClick={() => navigate('/dashboard/borrower')}>
          Borrowing
        </button>
        <button className="tab-pill active">Lending</button>
      </div>
      {error && <p>{error}</p>}
      {data && (
        <>
          <div className="combo-card">
            <strong>
              Next payment: ${data.next_payment.amount} in {data.next_payment.due_in_weeks}{' '}
              {data.next_payment.due_in_weeks === 1 ? 'week' : 'weeks'}
            </strong>
          </div>
          <div className="combo-card">
            <strong>Expected revenue: ${data.expected_revenue_year} over the next year</strong>
          </div>
        </>
      )}
    </div>
  );
}
