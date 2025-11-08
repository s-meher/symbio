import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyId } from '../api';
import { getUser } from '../storage';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function ScanID() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const user = getUser();

  async function handleScan() {
    setLoading(true);
    try {
      // POST /verify-id -> {"verified":true,"message":"ID verified"}
      const resp = await verifyId({ user_id: user?.userId });
      if (resp.verified) {
        setStatus('verified');
        setMessage(resp.message);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || 'Could not verify.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg bg-card/90">
      <CardHeader>
        <CardTitle className="text-3xl">Scan ID</CardTitle>
        <p className="text-muted-foreground">
          We do this to verify users; locations we do not sell data.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleScan} disabled={loading}>
            {loading ? 'Scanning…' : 'Scan now'}
          </Button>
          <Button disabled={status !== 'verified'} onClick={() => navigate('/choose-role')}>
            Continue
          </Button>
        </div>
        {message && (
          <p className={status === 'error' ? 'text-destructive' : 'text-emerald-700'}>{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
