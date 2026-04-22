import { motion } from 'framer-motion';

export default function ProgressBar({ value, animated = false, delay = 0 }) {
  return (
    <div className="progress-wrap">
      {animated ? (
        <motion.div
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.65, delay, ease: 'easeOut' }}
        />
      ) : (
        <div className="progress-bar" style={{ width: `${value}%` }} />
      )}
    </div>
  );
}
