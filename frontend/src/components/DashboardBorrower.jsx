import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBorrowerDashboard } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { Card } from './ui/card';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

export default function DashboardBorrower() {
  const user = useRequiredUser();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.userId) return;
    async function load() {
      try {
        // GET /dashboard/borrower -> {next_payment,total_owed_year,savings_vs_bank_year}
        const resp = await fetchBorrowerDashboard(user.userId);
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
      <Tabs value="borrower" className="w-full">
        <TabsList className="w-full justify-between">
          <TabsTrigger value="borrower">Borrowing</TabsTrigger>
          <TabsTrigger value="lender" onClick={() => navigate('/dashboard/lender')}>
            Lending
          </TabsTrigger>
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
            Total owed: ${data.total_owed_year} over the next year
          </Card>
          <Card className="rounded-3xl border-2 border-dashed border-border bg-white/80 p-6 text-lg font-semibold">
            Saved vs bank: ${data.savings_vs_bank_year}
          </Card>
        </div>
      )}
    </div>
  );
}
