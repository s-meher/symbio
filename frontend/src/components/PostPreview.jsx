import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postFeed } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { getSessionValue } from '../session';

export default function PostPreview() {
  const navigate = useNavigate();
  const user = useRequiredUser();
  const amount = getSessionValue('borrow_amount', 0) || 0;
  const reason = getSessionValue('borrow_reason', 'a community project');
  const [shareName, setShareName] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const composed = `Someone (Borrower) borrowed $${amount} for ${reason}.`;

  async function handleShare() {
    setLoading(true);
    setError('');
    try {
      // POST /feed/post -> {"post_id":string,"preview":string}
      await postFeed({ user_id: user.userId, text: composed, share_opt_in: shareName });
      navigate('/feed', { state: { flash: 'Shared!' } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not post.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="card">
      <h2>Post Preview</h2>
      <p>{composed}</p>
      <div className="checkbox-row">
        <input id="share" type="checkbox" checked={shareName} onChange={(e) => setShareName(e.target.checked)} />
        <label htmlFor="share">Share my name in community feed</label>
      </div>
      {error && <p>{error}</p>}
      <button className="bubble-btn primary" onClick={handleShare} disabled={loading}>
        {loading ? 'Posting…' : 'Post to feed'}
      </button>
    </div>
  );
}
