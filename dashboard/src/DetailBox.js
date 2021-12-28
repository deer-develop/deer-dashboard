import PropTypes from "prop-types";

function DetailBox({ index, style, width, height, positiveImage, negativeImage, figure1, figure2, unit }) {
  return (
    <div 
      style=
        {{ width: `${width}%`, height: `${height}%`, 
        boxSizing: 'border-box',
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px' , ...style}}>
      {index === 1 ?     
        <div style={{ height: '100%', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '50%', width: '100%' }}>
            <img src={positiveImage} alt='icon' style={{ margin: '7px', width: '16px'}} />
            <h2 style={{ display: 'inline-block', fontSize: '15px', color: '#ffffff' }}>
              {figure1}&nbsp;
            </h2>
            <h4 style={{ display: 'inline-block', color: '#ffffff' }}>
              {unit}
            </h4>
          </div>
          <hr style={{ border: 'none', position: 'absolute', top: '50%', margin: '0px', width: '100%', height: '0.5px', backgroundColor: 'rgba(237, 236, 255, 0.5)' }}>
          </hr>
          <div style={{ display: 'flex', alignItems: 'center', height: '50%', width: '100%' }}>
            <img src={negativeImage} alt='icon' style={{ margin: '7px', width: '16px' }} /> 
            <h2 style={{ display: 'inline-block', fontSize: '15px', color: '#ffffff' }}>
              {figure2}&nbsp;
            </h2>
            <h4 style={{ display: 'inline-block', color: '#ffffff' }}>
              {unit}
            </h4>
          </div>
        </div> :
      index === 2 && figure1 >= 0 ?
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <img src={positiveImage} alt='icon' style={{ position: 'absolute', margin: '7px', width: '16px'}} />
          <h2 style={{ display: 'inline-block', marginLeft: '30px', fontSize: '15px', color: '#ffffff' }}>
            {figure1}&nbsp;
          </h2>
          <h4 style={{ display: 'inline-block', color: '#ffffff' }}>
            {unit}
          </h4>
        </div> :
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <img src={negativeImage} alt='icon' style={{ position: 'absolute', margin: '7px', width: '16px'}} />
          <h2 style={{ display: 'inline-block', marginLeft: '30px', fontSize: '15px', color: '#ffffff' }}>
            {-figure1}&nbsp;
          </h2>
          <h4 style={{ display: 'inline-block', color: '#ffffff' }}>
            {unit}
          </h4>
        </div>} 
    </div>
  );
};

DetailBox.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired, 
  positiveImage: PropTypes.string.isRequired, 
  negativeImage: PropTypes.string.isRequired,
  figure1: PropTypes.number,
  figure2: PropTypes.number
} 

export default DetailBox;