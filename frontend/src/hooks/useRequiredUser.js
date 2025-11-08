import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../storage';

export function useRequiredUser() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return user;
}
