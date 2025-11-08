import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postBorrowAmount } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { setSessionValue } from '../session';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ArrowRight, TrendingUp, Info } from 'lucide-react';

const ENABLE_KNOT_LINK = false;

const quickAmounts = [500, 1000, 2000, 5000];

export default function BorrowAmount() {
  const navigate = useNavigate();
  const user = useRequiredUser();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext(e) {
    e.preventDefault();
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await postBorrowAmount({ user_id: user.userId, amount: numeric });
      setSessionValue('borrow_amount', numeric);
      navigate('/borrow/risk');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save amount.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  const numericAmount = Number(amount) || 0;

  return (
    <motion.form 
      onSubmit={handleNext}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-4xl"
    >
      <Card className="relative overflow-visible">
        {/* Floating decorations */}
        <motion.div
          className="absolute -top-16 -left-16 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-500/30 blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, 20, 0],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -20, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        />

        <CardHeader className="text-center">
          <motion.div
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-2xl shadow-emerald-500/50"
          >
            <DollarSign className="h-16 w-16 text-white" />
          </motion.div>
          <CardTitle className="text-4xl md:text-5xl mb-4">
            How Much Do You Need?
          </CardTitle>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Request what you need. The community will pool resources to help.
          </p>
        </CardHeader>

        <CardContent className="space-y-8 pb-12">
          {/* Quick amount buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="mb-4 text-lg font-semibold text-foreground">Quick select</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickAmounts.map((quick, idx) => (
                <motion.button
                  key={quick}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmount(quick.toString())}
                  className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-center backdrop-blur-sm transition-all ${
                    Number(amount) === quick
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-200/50'
                      : 'border-cyan-200/60 bg-white/80 hover:border-cyan-400 hover:shadow-lg'
                  }`}
                >
                  <p className="text-3xl font-black text-primary">${quick.toLocaleString()}</p>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-100/0 via-teal-100/50 to-cyan-100/0 opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Custom amount input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <p className="text-lg font-semibold text-foreground">Or enter your own amount</p>
            <div className="relative">
              <DollarSign className="absolute left-5 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground" />
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0" 
                min="0"
                step="100"
                className="pl-16 text-3xl font-bold h-20"
              />
            </div>

            {/* Amount visualization */}
            <AnimatePresence>
              {numericAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 p-6"
                >
                  <div className="flex items-start gap-4">
                    <TrendingUp className="h-8 w-8 text-cyan-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-2xl font-black text-primary mb-2">
                        ${numericAmount.toLocaleString()}
                      </p>
                      <p className="text-base text-muted-foreground">
                        Your request will be reviewed against community capacity and your profile.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Knot integration placeholder */}
          {ENABLE_KNOT_LINK && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="rounded-2xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 p-6 text-center"
            >
              <p className="text-base text-muted-foreground">
                🔗 Link your Knot account for faster verification (coming soon)
              </p>
            </motion.div>
          )}

          {/* Info note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-start gap-3 rounded-2xl bg-blue-50/80 border border-blue-200 p-5"
          >
            <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Community tip:</strong> Requesting amounts that align with your capacity increases approval likelihood. We'll show you your clarity score next.
            </p>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg text-destructive font-semibold"
            >
              {error}
            </motion.p>
          )}

          {/* Submit button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              size="lg"
              disabled={loading || !amount}
              className="w-full text-xl py-8 group"
            >
              {loading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  <DollarSign className="h-7 w-7" />
                </motion.span>
              ) : (
                <>
                  <span>Check My Clarity Score</span>
                  <ArrowRight className="ml-3 h-7 w-7 transition-transform group-hover:translate-x-2" />
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.form>
  );
}