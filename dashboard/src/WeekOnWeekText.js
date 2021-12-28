import PropTypes from "prop-types";

function WeekOnWeekText({ index, figure, unit }) {
    return (
      <div style={{ display: 'inline' }}>
      { index === 1 && figure >= 0 ? 
      <div
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '12px' }}>
            <img src="images/good_increase.png" alt='arrow' style={{ height: '12px', width: '12px' }} />
            <h4 style={{ display: 'inline-block', color: '#419E6A' }} className='bold'>&nbsp;+{figure}
              <span style={{ color: '#419E6A' }} className='regular'>{unit}&nbsp;</span>
              <span style={{ color: '#64748b' }} className='regular'>for last week</span>
            </h4>
      </div>
      : index === 1 && figure < 0 ? 
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '12px' }}>
            <img src="images/bad_decrease.png" alt='arrow' style={{ height: '12px', width: '12px' }} />
            <h4 style={{ display: 'inline-block', color: '#D83232' }} className='bold'>&nbsp;{-figure}
              <span style={{ color: '#D83232' }} className='regular'>{unit}&nbsp;</span>
              <span style={{ color: '#64748b' }} className='regular'>for last week</span>
            </h4>
      </div>
      : index === 2 && figure >= 0 ? 
      <div
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '12px' }}>
            <img src="images/bad_increase.png" alt='arrow' style={{ height: '12px', width: '12px' }} />
            <h4 style={{ display: 'inline-block', color: '#D83232' }} className='bold'>&nbsp;+{figure}
              <span style={{ color: '#D83232' }} className='regular'>{unit}&nbsp;</span>
              <span style={{ color: '#64748b' }} className='regular'>for last week</span>
            </h4>
      </div> : 
      (<div
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '12px' }}>
            <img src="images/good_decrease.png" alt='arrow' style={{ height: '12px', width: '12px' }} />
            <h4 style={{ display: 'inline-block', color: '#419E6A' }} className='bold'>&nbsp;{-figure}
              <span style={{ color: '#419E6A' }} className='regular'>{unit}&nbsp;</span>
              <span style={{ color: '#64748b' }} className='regular'>for last week</span>
            </h4>
      </div>)}
      </div>
    );
  };
  
  WeekOnWeekText.propTypes = {
    index: PropTypes.number.isRequired,
    figure: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired
  } 
  
  export default WeekOnWeekText;