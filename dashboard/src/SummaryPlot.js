//module
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import superagent from 'superagent'
import moment from 'moment-timezone'

import { Group } from '@visx/group'
import { BoxPlot } from '@visx/stats'
import { LinearGradient } from '@visx/gradient'
import { scaleBand, scaleLinear } from '@visx/scale'
import { withTooltip, Tooltip, defaultStyles as defaultTooltipStyles } from '@visx/tooltip'

// accessors
const x = () => 'TITLE'

const sendRequest = async (path) => {
	try {
		const res = await superagent.get(`http://localhost:3001/${path}`)
		return JSON.parse(res.text)
	} catch (err) {
		return err
	}
}

//HTML
const SummaryPlot = withTooltip(({ width, height, tooltipOpen, tooltipLeft, tooltipTop, tooltipData, showTooltip, hideTooltip }) => {
	// bounds
	const xMax = width
	const yMax = height - 200

	const {
		status: revenueOperationLastSummaryStatus,
		data: revenueOperationLastSummary,
		error: revenueOperationLastSummaryError,
		refetch: revenueOperationLastSummaryRefetch,
	} = useQuery('revenue-operation-last-summary', () => sendRequest('revenue/operation/last-summary'), {
		enabled: true,
	})

	// scales
	const xScale = scaleBand({
		range: [0, xMax],
		round: true,
		domain: [x()],
		padding: 0.4,
	})

	const data = revenueOperationLastSummary?.activeDeerRate
	console.table(revenueOperationLastSummary)

	const yScale = scaleLinear({
		range: [yMax, 0],
		round: true,
		domain: [data?.min ?? 0, data?.max ?? 100],
	})

	const boxWidth = xScale.bandwidth()
	const constrainedWidth = Math.min(40, boxWidth)

	let status = [revenueOperationLastSummaryStatus]
	let error = [revenueOperationLastSummaryError]
	const isLoading = (element) => element === 'loading'
	const isError = (element) => element != null

	return status.some(isLoading) ? (
		<h2 style={{ padding: '30px 35px' }}>Loading...</h2>
	) : error.some(isError) ? (
		<span>Error: {error.message}</span>
	) : (
		<div style={{ position: 'relative' }}>
			<svg width={width} height={height}>
				<LinearGradient id="statsplot" to="#8b6ce7" from="#87f2d4" />
				<rect x={0} y={0} width={width} height={height} fill="url(#statsplot)" rx={14} />
				<Group top={100}>
					<g>
						<BoxPlot
							min={data?.min}
							max={data?.max}
							median={data?.med}
							firstQuartile={data?.min}
							thirdQuartile={data?.max}
							left={xScale(x()) + 0.3 * constrainedWidth}
							boxWidth={constrainedWidth * 0.4}
							fill="#FFFFFF"
							fillOpacity={0.3}
							stroke="#FFFFFF"
							strokeWidth={2}
							valueScale={yScale}
							minProps={{
								onMouseOver: () => {
									showTooltip({
										tooltipTop: yScale(data.min) ?? 0 + 40,
										tooltipLeft: xScale(x()) + constrainedWidth + 5,
										tooltipData: {
											min: data.min,
											name: x(),
										},
									})
								},
								onMouseLeave: () => {
									hideTooltip()
								},
							}}
							maxProps={{
								onMouseOver: () => {
									showTooltip({
										tooltipTop: yScale(data.max) ?? 0 + 40,
										tooltipLeft: xScale(x()) + constrainedWidth + 5,
										tooltipData: {
											max: data.max,
											name: x(),
										},
									})
								},
								onMouseLeave: () => {
									hideTooltip()
								},
							}}
							boxProps={{
								onMouseOver: () => {
									showTooltip({
										tooltipTop: yScale(data.med) ?? 0 + 40,
										tooltipLeft: xScale(x()) + constrainedWidth + 5,
										tooltipData: {
											...data,
											name: x(),
										},
									})
								},
								onMouseLeave: () => {
									hideTooltip()
								},
							}}
							medianProps={{
								style: {
									stroke: 'white',
								},
								onMouseOver: () => {
									showTooltip({
										tooltipTop: yScale(data.med) ?? 0 + 40,
										tooltipLeft: xScale(x()) + constrainedWidth + 5,
										tooltipData: {
											median: data.med,
											name: x(),
										},
									})
								},
								onMouseLeave: () => {
									hideTooltip()
								},
							}}
						/>
					</g>
					)
				</Group>
			</svg>
			{tooltipOpen && tooltipData && (
				<Tooltip top={tooltipTop} left={tooltipLeft} style={{ ...defaultTooltipStyles, backgroundColor: '#283238', color: 'white' }}>
					<div>
						<strong>{tooltipData.name}</strong>
					</div>
					<div style={{ marginTop: '5px', fontSize: '12px' }}>
						{tooltipData.max && <div>max: {tooltipData.max}</div>}
						{tooltipData.thirdQuartile && <div>third quartile: {tooltipData.thirdQuartile}</div>}
						{tooltipData.median && <div>median: {tooltipData.median}</div>}
						{tooltipData.firstQuartile && <div>first quartile: {tooltipData.firstQuartile}</div>}
						{tooltipData.min && <div>min: {tooltipData.min}</div>}
					</div>
				</Tooltip>
			)}
		</div>
	)
})

export default SummaryPlot
