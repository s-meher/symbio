import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyId } from '../api';
import { getUser } from '../storage';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';
import { Shield, Scan, CheckCircle, AlertCircle, Waves, Lock } from 'lucide-react';

export default function ScanID() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const user = getUser();

  async function handleScan() {
    setLoading(true);
    try {
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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="mx-auto w-full max-w-3xl"
    >
      <Card className="relative overflow-visible">
        {/* Floating decorative elements */}
        <motion.div
          className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-500/30 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />

        <CardHeader className="text-center pb-8">
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl shadow-cyan-500/50"
          >
            <Shield className="h-16 w-16 text-white" />
          </motion.div>
          <CardTitle className="text-5xl mb-4">Identity Verification</CardTitle>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We verify your identity to protect the community. 
            <span className="block mt-2 text-primary font-semibold">Your data stays secure—never sold.</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-8 pb-12">
          {/* Privacy badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Lock className="h-6 w-6" />, text: "End-to-end encrypted", color: "from-emerald-400 to-teal-500" },
              { icon: <Shield className="h-6 w-6" />, text: "Zero data selling", color: "from-cyan-400 to-blue-500" },
              { icon: <Waves className="h-6 w-6" />, text: "Community first", color: "from-purple-400 to-pink-500" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-center gap-3 rounded-2xl bg-white/60 p-4 backdrop-blur-sm border border-cyan-200/60"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg flex-shrink-0`}>
                  {item.icon}
                </div>
                <p className="text-sm font-semibold text-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Scan area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <div className="rounded-3xl border-4 border-dashed border-cyan-300 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 p-12 text-center backdrop-blur-sm">
              <motion.div
                animate={loading ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: loading ? Infinity : 0, ease: "linear" }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center"
              >
                <Scan className="h-full w-full text-primary" />
              </motion.div>
              <p className="text-2xl font-bold text-primary mb-2">
                {loading ? 'Scanning...' : 'Ready to scan'}
              </p>
              <p className="text-base text-muted-foreground">
                Click below to begin verification
              </p>
            </div>
          </motion.div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-5">
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="w-full text-lg py-7"
                onClick={handleScan} 
                disabled={loading}
              >
                {loading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <Scan className="h-6 w-6" />
                  </motion.span>
                ) : (
                  <>
                    <Scan className="mr-3 h-6 w-6" />
                    Start Verification
                  </>
                )}
              </Button>
            </motion.div>
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg"
                variant="outline"
                className="w-full text-lg py-7"
                disabled={status !== 'verified'} 
                onClick={() => navigate('/choose-role')}
              >
                Continue to Pool
              </Button>
            </motion.div>
          </div>

          {/* Status message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 rounded-2xl p-6 ${
                status === 'error' 
                  ? 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300' 
                  : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300'
              }`}
            >
              {status === 'error' ? (
                <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                  transition={{ duration: 0.6 }}
                >
                  <CheckCircle className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                </motion.div>
              )}
              <div className="flex-1">
                <p className={`text-lg font-bold ${status === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>
                  {status === 'error' ? 'Verification Failed' : 'Verification Complete'}
                </p>
                <p className="text-base text-muted-foreground mt-1">{message}</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}