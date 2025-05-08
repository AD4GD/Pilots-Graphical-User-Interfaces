import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CollapseWrapperProps {
  isCollapsed: boolean;
  children: ReactNode;
  duration?: number; // Optional duration for the animation
}

const CollapseWrapper: React.FC<CollapseWrapperProps> = ({
  isCollapsed,
  children,
  duration = 0.3,
}) => {
  return (
    <AnimatePresence initial={false}>
      {!isCollapsed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CollapseWrapper;
