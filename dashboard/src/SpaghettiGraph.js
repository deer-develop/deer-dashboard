import React, { useMemo } from 'react'
import { Group } from '@visx/group';
import { Bar, LinePath } from '@visx/shape'
import { curveMonotoneX } from '@visx/curve'
import { GridRows, GridColumns } from '@visx/grid'
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale'
import { AxisLeft, AxisBottom } from '@visx/axis';
import _ from 'lodash';

export const background = '#ffffff'
export const gridColor = '#CBD4E1'
export const labelColor = '#94A3B8'
export const color0 = '#EDECFF'
export const color1 = '#CFCBFF'
export const color2 = '#B0A9FF'
export const color3 = '#958BFF'
export const color4 = '#7A6DFF'
export const color5 = '#5D50EE'
export const color6 = '#4032DC'
export const color7 = '#2719C4'
export const color8 = '#0E00AB'

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
  margin = { top: marginTop, right: 10, bottom: 16, left: marginLeft },
  rowNumTicks,
  columnNumTicks 
}) => {
  if (width < 10) return null

  // bounds
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // scales
  const weekScale = scaleOrdinal({
    domain: _.range(9),
    range: _.range(9).map(x => x * innerWidth / 8) 
  })
  const percentageScale = scaleLinear({
    domain: [100, 0],
    range: [0, innerHeight]
  });
  const color = scaleOrdinal({
    domain: _.range(9),
    range: [color8, color7, color6, color5, color4, color3, color2, color1, color0]
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
          {button.map(button => (
            <LinePath
            data={data[button].bins} 
            x={(d) => weekScale(getWeek(d)) ?? 0}
            y={(d) => percentageScale(getPercentage(d)) ?? 0}
            strokeWidth={1}
            stroke={color(button)}
            curve={curveMonotoneX}
            />
          ))}
        </Group>
      </svg>
    </div>
  )
}

export default SpaghettiGraph;



