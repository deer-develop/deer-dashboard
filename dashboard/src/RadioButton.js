import PropTypes from "prop-types";

function RadioButton({ value, title, active, event }) {
  return (
    <div style={{ marginBottom: '2px' }}>
      <label style={{ display: 'flex', alignItems: 'center' }}>
        <input id={value} value={value} type='radio' checked={active} onClick={event} className='radio'/>
        <h5>{title}</h5>
      </label>
    </div>
  );
};
  
RadioButton.propTypes = {
  value: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
} 

export default RadioButton;