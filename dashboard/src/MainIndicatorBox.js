import PropTypes from "prop-types";
import styles from "./FoundationBox.module.css";

function MainIndicatorBox({ color, width, height, image, title, style, children }) {
  return (
    <div 
      style={{ backgroundColor: color, padding: '7px 10px 10px 13px', width: `${width}%`, height: `${height}%`, ...style }} 
      className={styles.innerBox}>
        <img src={image} alt='icon' style={{ position: 'absolute', height: '26px' }} />
        <h4 style={{ position: 'absolute', bottom: '0', paddingBottom: '13px', color: '#ffffff' }}>{title}</h4>
        {children}
    </div>
  );
};

MainIndicatorBox.propTypes = {
  color: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
} 

export default MainIndicatorBox;