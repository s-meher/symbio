import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../api';
import { saveUser } from '../storage';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';

const DEFAULT_GEO = { lat: 40.35, lng: -74.66 };

export default function LenderSetup() {
  const navigate = useNavigate();
  const [capital, setCapital] = useState('');
  const [minRate, setMinRate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!capital) {
      setError('Enter capital.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // POST /users/create Request: {role:'lender',geo,min_rate,max_amount} Response: {"user_id":string,"role":"lender"}
      const resp = await createUser({
        role: 'lender',
        geo: DEFAULT_GEO,
        min_rate: Number(minRate) || 2,
        max_amount: Number(capital),
      });
      saveUser({ userId: resp.user_id, role: resp.role });
      navigate('/dashboard/lender');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save lender.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mx-auto max-w-xl bg-card/90">
        <CardHeader>
          <CardTitle>Lender setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="capital">How much capital do you have?</Label>
            <Input id="capital" type="number" value={capital} onChange={(e) => setCapital(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min-rate">Minimum rate?</Label>
            <Input id="min-rate" type="number" value={minRate} onChange={(e) => setMinRate(e.target.value)} />
          </div>
          {error && <p className="text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
