import PropTypes from "prop-types";

function DayOnDayBox({ figure }) {
    return (
      <div style={{ display: 'inline-block', marginLeft: '10px' }}>
      { figure >= 0 ? 
        <div
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: "#CADAFC", 
            padding: '0px 4px', 
            borderRadius: '5px', 
            height: '15px' }}>
              <h4 style={{ color: '#2563EB' }} className='bold'>{figure.toLocaleString('ko-KR')}</h4>
              <img src="images/up.png" alt='arrow' style={{ marginLeft: '2px', height: '8px', width: '8px' }} />
        </div> : 
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: '#F4C2C2', 
            padding: '0px 4px', 
            borderRadius: '5px', 
            height: '15px' }}>
              <h4 style={{ color: '#D83232' }} className='bold'>{(-figure).toLocaleString('ko-KR')}</h4>
              <img src="images/down.png" alt='arrow' style={{ marginLeft: '2px', height: '8px', width: '8px' }} />
        </div>}
      </div>
    );
  };
  
  DayOnDayBox.propTypes = {
    figure: PropTypes.number.isRequired
  } 
  
  export default DayOnDayBox;