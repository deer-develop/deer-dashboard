import PropTypes from 'prop-types'

function CheckBox({ value, title, active, event }) {
	return (
		<div style={{ marginBottom: '2px' }}>
			<label style={{ display: 'flex', alignItems: 'center' }}>
				<input id={value} value={value} type="checkbox" checked={active} onClick={event} className="checkbox" />
				<h5 style={{ marginLeft: '4px' }}>{title}</h5>
			</label>
		</div>
	)
}

CheckBox.propTypes = {
	value: PropTypes.number.isRequired,
	title: PropTypes.string.isRequired,
}

export default CheckBox
