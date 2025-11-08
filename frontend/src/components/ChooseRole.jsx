import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../api';
import { getUser, saveUser } from '../storage';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const DEFAULT_GEO = { lat: 40.35, lng: -74.66 };

export default function ChooseRole() {
  const navigate = useNavigate();
  const existing = getUser();
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function handleBorrowing() {
    setLoading('borrow');
    setError('');
    try {
      // POST /users/create Request: {role:'borrower', geo:{lat,lng}} Response: {user_id, role}
      const resp = await createUser({ role: 'borrower', geo: DEFAULT_GEO });
      saveUser({ userId: resp.user_id, role: resp.role });
      navigate('/borrow/reason');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start borrow flow.');
    } finally {
      setLoading('');
    }
  }

  function handleDashboard() {
    if (existing?.role === 'lender') {
      navigate('/dashboard/lender');
    } else if (existing?.role === 'borrower') {
      navigate('/dashboard/borrower');
    } else {
      navigate('/');
    }
  }

  return (
    <Card className="mx-auto max-w-xl bg-card/90">
      <CardHeader>
        <CardTitle className="text-3xl">Choose your path</CardTitle>
        <p className="text-muted-foreground">Bubble buttons match the onboarding sketches.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button className="flex-1" size="lg" onClick={handleBorrowing} disabled={loading === 'borrow'}>
            {loading === 'borrow' ? 'Starting…' : 'Borrowing'}
          </Button>
          <Button className="flex-1" variant="outline" size="lg" onClick={() => navigate('/lender/setup')}>
            Lending
          </Button>
        </div>
        {error && <p className="text-destructive">{error}</p>}
        <button type="button" className="text-sm font-semibold underline" onClick={handleDashboard}>
          Dashboard
        </button>
      </CardContent>
    </Card>
  );
}
