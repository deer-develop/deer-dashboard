import React from 'react';
import { BarStackHorizontal } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import cityTemperature from '@visx/mock-data/lib/mocks/cityTemperature';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { timeParse, timeFormat } from 'd3-time-format';
import { withTooltip, Tooltip, defaultStyles } from '@visx/tooltip';

export const feedbackColor = '#4D82F3';
export const breakdownColor = '#94A3B8';
export const issueColor = '#DC4747';
export const yLabelColor = '#94A3B8';
export const tickColor = '#DBE1EA'
export const background = '#ffffff';
const defaultMargin = { top: 0, left: 10, right: 10, bottom: 20 };
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: background,
  color: 'white',
};

// format
const formatXAxis = (d) => `${d}%`;

// accessors
const getDate = (d) => d.date;
const keys = ['feedback', 'breakdown', 'issue']

// scales
const proportionScale = scaleLinear({
  domain: [0, 100],
  nice: true,
});
const singleScale = scaleBand({
  domain: [],
  padding: 0.3,
});
const colorScale = scaleOrdinal({
  domain: keys,
  range: [feedbackColor, breakdownColor, issueColor],
});

let tooltipTimeout

export default withTooltip(
  ({
    data,
    width,
    height,
    events = false,
    margin = defaultMargin,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
    rowNumTicks = 5
  }) => {
    // bounds
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    proportionScale.rangeRound([0, xMax]);
    singleScale.rangeRound([yMax, 0]);

    return width < 10 ? null : (
      <div>
        <svg width={width} height={height}>
          <rect width={width} height={height} fill={'transparent'} />
          <Group top={margin.top} left={margin.left}>
            <BarStackHorizontal
              data={data}
              keys={keys}
              height={yMax}
              y={getDate}
              xScale={proportionScale}
              yScale={singleScale}
              color={colorScale}
            >
              {(barStacks) =>
                barStacks.map((barStack) =>
                  barStack.bars.map((bar) => (
                    <rect
                      key={`barstack-horizontal-${barStack.index}-${bar.index}`}
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      fill={bar.color}
                      onClick={() => {
                        if (events) alert(`clicked: ${JSON.stringify(bar)}`);
                      }}
                      onMouseLeave={() => {
                        tooltipTimeout = window.setTimeout(() => {
                          hideTooltip();
                        }, 300);
                      }}
                      onMouseMove={() => {
                        if (tooltipTimeout) clearTimeout(tooltipTimeout);
                        const top = bar.y + margin.top;
                        const left = bar.x + bar.width + margin.left;
                        showTooltip({
                          tooltipData: bar,
                          tooltipTop: top,
                          tooltipLeft: left,
                        });
                      }}
                    />
                  )),
                )
              }
            </BarStackHorizontal>
            <AxisLeft
              hideAxisLine
              hideTicks
              hideStroke
              
              scale={singleScale}
            />
            <AxisBottom
              top={yMax}
              scale={proportionScale}
              numTicks={rowNumTicks}
              strokeWidth={1}
              stroke={tickColor}
              tickStroke={tickColor}
              tickFormat={formatXAxis}
              tickLabelProps={() => ({
                fill: yLabelColor,
                fontSize: 8,
                textAnchor: 'middle'
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
        >
        </div>
        {tooltipOpen && tooltipData && (
          <Tooltip top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
            <h4 style={{ color: colorScale(tooltipData.key) }}>
              <strong>{tooltipData.key}</strong>
            </h4>
            <h4>{tooltipData.bar.data[tooltipData.key]}%</h4>
          </Tooltip>
        )}
      </div>
    );
  },
);