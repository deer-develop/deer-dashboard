import React from 'react';
import { Group } from '@visx/group';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { HeatmapRect } from '@visx/heatmap';

const color0 = '#FFFFFF'
const color1 = '#CFCBFF'
const color2 = '#B0A9FF'
const color3 = '#958BFF'
const color4 = '#7A6DFF'
const color5 = '#5D50EE'
const color6 = '#4032DC'
const color7 = '#2719C4'
const color8 = '#0E00AB'
const color9 = '#0C0090'
const color10 = '#0A0075'
const tickColor = '#DBE1EA'
const labelColor = '#94A3B8'

// format
const formatXAxis = (d) => `${d}주차`;

// accessors
const getRegisteredDate = (d) => d.bin; // registered_date

const CohortChart = ({
  data, 
  width,
  height,
  events = false,
  margin = { top: 16, left: 72, right: 0, bottom: 26 }
}) => {
  // bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.bottom - margin.top;

  const binWidth = xMax / data.length;
  const binHeight = yMax / data.length;

  // scales
  const xScale = scaleLinear({
    domain: [0, 9],
    range: [0, xMax]
  });

  const xScale2 = scaleBand({
    domain: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    range: [0, xMax]
  });

  const yScale = scaleLinear({
    domain: [0, 9],
    range: [0, yMax]
  });

  const yScale2 = scaleBand({
    domain: data.map(getRegisteredDate),
    range: [0, yMax]
  });

  const rectColorScale = scaleLinear({
    range: [color0, color1, color2, color3, color4, color5, color6, color7, color8, color9, color10, color0],
    domain: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],
  });

  return width < 10 ? null : (
    <svg width={width} height={height}>
      <rect x={0} y={0} width={width} height={height} fill={'transparent'} />
      <Group top={margin.top} left={margin.left}>
        <HeatmapRect
          data={data}
          xScale={(d) => yScale(d) ?? 0}
          yScale={(d) => xScale(d) ?? 0}
          colorScale={rectColorScale}
          binWidth={binWidth}
          binHeight={binHeight}
          gap={1.5}
        >
          {(heatmap) =>
            heatmap.map((heatmapBins) => {
              return heatmapBins.map((bin, i) =>
                <Group>
                  <rect
                    key={`heatmap-rect-${bin.row}-${bin.column}`}
                    className="visx-heatmap-rect"
                    width={bin.width}
                    height={bin.height}
                    x={bin.y}
                    y={bin.x}
                    fill={bin.color}
                  />
                  <text 
                    x={bin.y + bin.width / 2}
                    y={bin.x + bin.height / 2} 
                    alignment-baseline="middle" 
                    text-anchor="middle"
                    fontSize="8"
                    fill={bin.count > 50 ? "white" : "black"}
                  >
                    {bin.count != 0 ? bin.count.toFixed(1) : null}
                  </text>
                </Group>
              ) 
            })
          }
        </HeatmapRect>
        <AxisLeft
          top={0}
          left={-5}
          scale={yScale2}
          numTicks={9}
          strokeWidth={1}
          stroke={tickColor}
          tickStroke={tickColor}
          tickLabelProps={() => ({
            fill: labelColor,
            fontSize: 8,
            textAnchor: 'end',
            dy: '0.33em',
            dx: '-0.5em'
          })}
        />
        <AxisBottom
          top={yMax + 5}
          scale={xScale2}
          numTicks={9}
          strokeWidth={1}
          stroke={tickColor}
          tickStroke={tickColor}
          tickFormat={formatXAxis}
          tickLabelProps={() => ({
            fill: labelColor,
            fontSize: 8,
            textAnchor: 'middle'
          })}
        />
      </Group>
    </svg>
  );
};

export default CohortChart;