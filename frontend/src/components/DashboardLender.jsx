import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLenderDashboard } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { Card } from './ui/card';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

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
    <div className="mx-auto max-w-2xl space-y-4">
      <Tabs value="lender" className="w-full">
        <TabsList className="w-full justify-between">
          <TabsTrigger value="borrower" onClick={() => navigate('/dashboard/borrower')}>
            Borrowing
          </TabsTrigger>
          <TabsTrigger value="lender">Lending</TabsTrigger>
        </TabsList>
      </Tabs>
      {error && <p className="text-destructive">{error}</p>}
      {data && (
        <div className="grid gap-4">
          <Card className="rounded-3xl border-2 border-dashed border-border bg-white/80 p-6 text-lg font-semibold">
            Next payment: ${data.next_payment.amount} in {data.next_payment.due_in_weeks}{' '}
            {data.next_payment.due_in_weeks === 1 ? 'week' : 'weeks'}
          </Card>
          <Card className="rounded-3xl border-2 border-dashed border-border bg-white/80 p-6 text-lg font-semibold">
            Expected revenue: ${data.expected_revenue_year} over the next year
          </Card>
        </div>
      )}
    </div>
  );
}
