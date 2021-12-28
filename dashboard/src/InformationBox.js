import PropTypes from 'prop-types'
import styles from './FoundationBox.module.css'

function InformationBox({ width, image, children }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', padding: `0% ${(11 * 100) / 1850}%`, width: `${width}%`, fontSize: `${(15 * 100) / 1920}vw` }} className={styles.outerBox}>
			<img src={image} alt="icon" style={{ position: 'absolute', height: '60%' }} />
			{children}
		</div>
	)
}

InformationBox.propTypes = {
	width: PropTypes.number.isRequired,
	image: PropTypes.string.isRequired,
}

export default InformationBox
