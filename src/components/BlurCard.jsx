import { motion } from 'framer-motion';
import cx from 'classnames';

export default function BlurCard({
  children,
  className = '',
  padding = 'p-6 md:p-8',
  animate = true,
}) {
  const classes = cx(
    'glass rounded-2xl',
    padding,
    className
  );

  if (!animate) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.4, type: 'spring', damping: 20 }}
      className={classes}
    >
      {children}
    </motion.div>
  );
}
