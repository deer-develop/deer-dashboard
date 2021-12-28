import React, { useMemo, useCallback } from 'react'
import { Group } from '@visx/group';
import { AreaClosed, Line, Bar, LinePath } from '@visx/shape'
import { curveMonotoneX } from '@visx/curve'
import { GridRows, GridColumns } from '@visx/grid'
import { scaleTime, scaleLinear } from '@visx/scale'
import { AxisLeft, AxisBottom } from '@visx/axis';
import { withTooltip, Tooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip'
import { localPoint } from '@visx/event'
import { LinearGradient } from '@visx/gradient'
import { max, extent, bisector } from 'd3-array'
import { timeFormat } from 'd3-time-format'

export const background = '#ffffff'
export const gridColor = '#CBD4E1'
export const labelColor = '#94A3B8'
export const accentColor1 = '#4032DC'
export const accentColor2 = '#c4c4c4'
const tooltipStyles = {
  ...defaultStyles,
  background,
  border: '1px solid white',
  color: accentColor1
}

// util
const formatDate = timeFormat("%Y년 %m월 %d일")
const formatXAxis = timeFormat("%m월")

// accessors
const getDate = (d) => new Date(d.reference_date)
const getStockValue = (d) => d.value
const bisectDate = bisector((d) => new Date(d.reference_date)).left

export default withTooltip(
  ({
    index,
    data,
    unit,
    width,
    height,
    style,
    marginLeft,
    marginTop,
    margin = { top: marginTop, right: 2, bottom: 16, left: marginLeft },
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
    rowNumTicks,
    columnNumTicks 
  }) => {
    if (width < 10) return null

    // bounds
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // scales
    const dateScale = useMemo(
      () =>
        scaleTime({
          range: [0, innerWidth],
          domain: extent(data, getDate)
        }),
      [innerWidth, 0],
    )
    const stockValueScale = useMemo(
      () =>
        scaleLinear({
          range: [innerHeight, 0],
          domain: [0, (max(data, getStockValue) || 0) + innerHeight / 3],
          nice: true,
        }),
      [0, innerHeight],
    )

    // tooltip handler
    const handleTooltip = useCallback((event) => {
        const { x } = localPoint(event) || { x : 0 }
        const x0 = dateScale.invert(x - margin.left)
        const index = bisectDate(data, x0, 1)
        const d0 = data[index - 1]
        const d1 = data[index]
        let d = d0
        if (d1 && getDate(d1)) {
          d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0
        }
        showTooltip({
          tooltipData: d,
          tooltipLeft: x,
          tooltipTop: stockValueScale(getStockValue(d)),
        })
      },
      [showTooltip, stockValueScale, dateScale]
    )

    return (
      <div>
        <svg style={{...style}} width={width} height={height}>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="url(#area-background-gradient)"
            rx={14}
          />
          <Group left={margin.left} top={margin.top}>
            <LinearGradient id="area-gradient" from={accentColor1} to={accentColor2} fromOpacity={1} toOpacity={0} />
            <AxisBottom 
              top={innerHeight} 
              scale={dateScale} 
              numTicks={rowNumTicks} 
              stroke={gridColor}
              strokeWidth={1}
              hideTicks
              tickFormat={formatXAxis}
              tickLabelProps={() =>({
                fill: labelColor,
                fontSize: 8,
                textAnchor: 'middle',
                dy: '-0.33em'
              })}
            />
            <AxisLeft 
              scale={stockValueScale} 
              numTicks={columnNumTicks}
              hideAxisLine
              hideTicks
              tickLabelProps={() =>({
                fill: labelColor,
                fontSize: 8,
                textAnchor: 'end',
                dy: '0.33em'
              })} 
            />
            <GridRows
              scale={stockValueScale}
              width={innerWidth}
              height={innerHeight}
              strokeWidth={0.6}
              stroke={gridColor}
              strokeOpacity={1}
              pointerEvents="none"
              numTicks={columnNumTicks}
            />
            <GridColumns
              scale={dateScale}
              width={innerWidth}
              height={innerHeight}
              strokeWidth={1}
              stroke={gridColor}
              strokeOpacity={1}
              pointerEvents="none"
              numTicks={rowNumTicks}
            />
            {index === 1 ? 
              <AreaClosed
              data={data}
              x={(d) => dateScale(getDate(d)) ?? 0}
              y={(d) => stockValueScale(getStockValue(d)) ?? 0}
              yScale={stockValueScale}
              fill="url(#area-gradient)"
              curve={curveMonotoneX} /> : null
            }
            <LinePath
              data={data}
              x={(d) => dateScale(getDate(d)) ?? 0}
              y={(d) => stockValueScale(getStockValue(d)) ?? 0}
              strokeWidth={1}
              stroke={accentColor1}
              curve={curveMonotoneX}
            />
            <Bar
              x={0}
              y={margin.top}
              width={innerWidth}
              height={innerHeight}
              fill={"transparent"}
              onTouchStart={handleTooltip}
              onTouchMove={handleTooltip}
              onMouseMove={handleTooltip}
              onMouseLeave={() => hideTooltip()}
            />
            {tooltipData && (
              <g>
                <Line
                  from={{ x: tooltipLeft - margin.left, y: margin.top }}
                  to={{ x: tooltipLeft - margin.left, y: innerHeight + margin.top }}
                  stroke={accentColor1}
                  strokeWidth={2}
                  pointerEvents="none"
                  strokeDasharray="5, 2"
                />
                <circle
                  cx={tooltipLeft - margin.left}
                  cy={tooltipTop + 1}
                  r={4}
                  fill="black"
                  fillOpacity={0.1}
                  stroke="black"
                  strokeOpacity={0.1}
                  strokeWidth={2}
                  pointerEvents="none"
                />
                <circle
                  cx={tooltipLeft - margin.left}
                  cy={tooltipTop}
                  r={4}
                  fill={accentColor1}
                  stroke="white"
                  strokeWidth={2}
                  pointerEvents="none"
                />
              </g>
            )}
          </Group>
        </svg>
        {tooltipData && (
          <div>
            <TooltipWithBounds
              key={Math.random()}
              top={tooltipTop - 12}
              left={tooltipLeft + 12}
              style={tooltipStyles}
            >
              <h4>{`${getStockValue(tooltipData).toLocaleString('ko-KR')}${unit}`}</h4>
            </TooltipWithBounds>
            <Tooltip
              top={innerHeight + margin.top - 14}
              left={tooltipLeft}
              style={{
                ...defaultStyles,
                minWidth: 80,
                textAlign: 'center',
                transform: 'translateX(-50%)',
              }}
            >
              <h4>{formatDate(getDate(tooltipData))}</h4>
            </Tooltip>
          </div>
        )}
      </div>
    )
  },
)

