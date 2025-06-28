import React, { ReactNode } from 'react';
import styles from './Toolbar.module.css';

interface TooltipWrapperProps {
  children: ReactNode;
  tooltip: string;
}

const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ children, tooltip }) => {
  return (
    <div className={styles.tooltipContainer}>
      {children}
      <div className={styles.tooltip}>
        {tooltip}
      </div>
    </div>
  );
};

export default TooltipWrapper;