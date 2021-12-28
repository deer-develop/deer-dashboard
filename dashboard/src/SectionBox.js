import PropTypes from "prop-types";
import styles from "./FoundationBox.module.css";

function SectionBox({ width, style, children }) {
  return (
    <div 
      style={{ display: 'flex', width: `${width}%`, ...style }} 
      className={styles.outerBox}>
      {children}
    </div>
  );
};

SectionBox.propTypes = {
  width: PropTypes.number.isRequired
}

export default SectionBox;