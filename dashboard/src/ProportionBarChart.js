import React from 'react'
import { BarStackHorizontal } from '@visx/shape'
import { Group } from '@visx/group'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale'
import { GridRows, GridColumns } from '@visx/grid'
import { withTooltip, Tooltip, defaultStyles } from '@visx/tooltip'

export const barColor = '#7A6DFF'
export const gridColor = '#CBD4E1'
export const xLabelColor = '#64748B'
export const yLabelColor = '#94A3B8'
export const background = '#ffffff'
const tooltipStyles = {
	...defaultStyles,
	minWidth: 60,
	backgroundColor: background,
	color: 'white',
}

// format
const formatXAxis = (d) => `${d}%`

// accessors
const getItem = (d) => d.item
const keys = ['proportion']

let tooltipTimeout

export default withTooltip(({ data, width, height, events = false, marginTop, marginBottom, marginLeft, margin = { top: marginTop, left: marginLeft, right: 10, bottom: marginBottom }, proportionMax, tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip, rowNumTicks = 5 }) => {
	// bounds
	const xMax = width - margin.left - margin.right
	const yMax = height - margin.top - margin.bottom

	// scales
	const proportionScale = scaleLinear({
		domain: [0, proportionMax],
		nice: true,
	})
	const itemScale = scaleBand({
		domain: data.map(getItem),
		padding: 0.35,
	})
	const colorScale = scaleOrdinal({
		domain: keys,
		range: [barColor],
	})

	proportionScale.rangeRound([0, xMax])
	itemScale.rangeRound([yMax, 0])

	return width < 10 ? null : (
		<div>
			<svg width={width} height={height}>
				<rect width={width} height={height} fill={'transparent'} />
				<Group top={margin.top} left={margin.left}>
					<GridColumns scale={proportionScale} width={xMax} height={yMax} strokeWidth={0.6} stroke={gridColor} strokeOpacity={0.7} pointerEvents="none" numTicks={rowNumTicks} />
					<BarStackHorizontal data={data} keys={keys} height={yMax} y={getItem} xScale={proportionScale} yScale={itemScale} color={colorScale}>
						{(barStacks) =>
							barStacks.map((barStack) =>
								barStack.bars.map((bar) => (
									<rect
										key={`barstack-horizontal-${barStack.index}-${bar.index}`}
										x={bar.x}
										y={bar.y}
										width={bar.width}
										height={bar.height}
										fill={barColor}
										rx={3}
										onMouseLeave={() => {
											tooltipTimeout = window.setTimeout(() => {
												hideTooltip()
											}, 300)
										}}
										onMouseMove={() => {
											if (tooltipTimeout) clearTimeout(tooltipTimeout)
											const top = bar.y + margin.top
											const left = bar.x + bar.width + margin.left
											showTooltip({
												tooltipData: bar,
												tooltipTop: top,
												tooltipLeft: left,
											})
										}}
									/>
								)),
							)
						}
					</BarStackHorizontal>
					<AxisLeft
						hideAxisLine
						hideTicks
						scale={itemScale}
						stroke={xLabelColor}
						tickStroke={xLabelColor}
						tickLabelProps={() => ({
							fill: xLabelColor,
							fontSize: 8,
							textAnchor: 'end',
							dy: '0.33em',
						})}
					/>
					<AxisBottom
						hideAxisLine
						hideTicks
						top={yMax}
						scale={proportionScale}
						numTicks={rowNumTicks}
						stroke={yLabelColor}
						tickFormat={formatXAxis}
						tickLabelProps={() => ({
							fill: yLabelColor,
							fontSize: 8,
							textAnchor: 'middle',
							dy: '-0.33em',
						})}
					/>
				</Group>
			</svg>
			<div
				style={{
					position: 'absolute',
					top: margin.top / 2 - 10,
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					fontSize: '14px',
				}}
			></div>
			{tooltipOpen && tooltipData && (
				<Tooltip top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
					<h4 style={{ color: yLabelColor }}>
						<strong>{getItem(tooltipData.bar.data)}</strong>
					</h4>
					<h4>{tooltipData.bar.data[tooltipData.key]}%</h4>
				</Tooltip>
			)}
		</div>
	)
})
