import PropTypes from 'prop-types'
import styles from './FoundationBox.module.css'

function IndicatorBox({ color, width, height, title, style, children }) {
	return (
		<div style={{ backgroundColor: color, padding: '13px 10px 10px 13px', width: `${width}%`, height: `${height}%`, ...style }} className={styles.innerBox}>
			<h4>{title}</h4>
			{children}
		</div>
	)
}

IndicatorBox.propTypes = {
	color: PropTypes.string,
	height: PropTypes.number.isRequired,
}

IndicatorBox.defaultProps = {
	color: '#F1F4F9',
	width: '100%',
}

export default IndicatorBox
