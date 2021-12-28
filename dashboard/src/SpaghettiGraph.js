import React, { useMemo } from 'react'
import { Group } from '@visx/group';
import { Bar, LinePath } from '@visx/shape'
import { curveMonotoneX } from '@visx/curve'
import { GridRows, GridColumns } from '@visx/grid'
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale'
import { AxisLeft, AxisBottom } from '@visx/axis';

export const background = '#ffffff'
export const gridColor = '#CBD4E1'
export const labelColor = '#94A3B8'
export const accentColor1 = '#4032DC'
export const accentColor2 = '#c4c4c4'

// util
const formatXAxis = (d) => `${d}주차`;
const formatYAxis = (d) => `${d}%`;

// accessors
const getGroup = (d, n) => d[n].bins
const getWeek = (d) => d.bin
const getPercentage = (d) => d.count

const SpaghettiGraph = ({
  data,
  button,
  width,
  height,
  style,
  marginLeft,
  marginTop,
  margin = { top: marginTop, right: 2, bottom: 16, left: marginLeft },
  rowNumTicks,
  columnNumTicks 
}) => {
  if (width < 10) return null

  // bounds
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // scales
  const weekScale = scaleBand({
    domain: data.map(getWeek),
    range: [0, innerWidth],
  })
  const percentageScale = scaleLinear({
    domain: data.map(getPercentage),
    range: [0, innerHeight]
  });
  const color = scaleOrdinal({
    
  })

  return (
    <div>
      <svg style={{...style}} width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <AxisBottom 
            top={innerHeight} 
            scale={weekScale} 
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
            scale={percentageScale} 
            numTicks={columnNumTicks}
            hideAxisLine
            hideTicks
            tickFormat={formatYAxis}
            tickLabelProps={() =>({
              fill: labelColor,
              fontSize: 8,
              textAnchor: 'end',
              dy: '0.33em'
            })} 
          />
          <GridRows
            scale={percentageScale}
            width={innerWidth}
            height={innerHeight}
            strokeWidth={0.6}
            stroke={gridColor}
            strokeOpacity={1}
            pointerEvents="none"
            numTicks={columnNumTicks}
          />
          <GridColumns
            scale={weekScale}
            width={innerWidth}
            height={innerHeight}
            strokeWidth={1}
            stroke={gridColor}
            strokeOpacity={1}
            pointerEvents="none"
            numTicks={rowNumTicks}
          />
          <LinePath
            data={data} 
            x={(d) => weekScale(getWeek(d)) ?? 0}
            y={(d) => percentageScale(getPercentage(d)) ?? 0}
            strokeWidth={1}
            stroke={accentColor1}
            curve={curveMonotoneX}
          />
        </Group>
      </svg>
    </div>
  )
}

export default SpaghettiGraph;



