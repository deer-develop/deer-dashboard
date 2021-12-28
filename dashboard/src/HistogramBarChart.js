import React from 'react';
import { BarStackHorizontal, BarStack } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { scaleBand, scaleLinear, scaleOrdinal, scaleQuantize } from '@visx/scale';
import { GridRows, GridColumns } from '@visx/grid';
import { withTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';

export const detractorsColor = '#DC4747';
export const passivesColor = '#94A3B8';
export const promotersColor = '#4D82F3';
export const barColor = '#7A6DFF';
export const gridColor = '#DBE1EA';
export const xLabelColor = '#94A3B8';
export const yLabelColor = '#94A3B8';
export const background = '#ffffff';
const defaultMargin = { top: 18, left: 22, right: 15, bottom: 16 };
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: background,
  color: 'white',
};

// accessors
const getScore = (d) => d.score;
const getGroup = (d) => d.group;
const keys = ['count'];
const groups = ['group'];

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
    const countTotals = data.map(d => d.count)

    // scales
    const countScale = scaleLinear({
      domain: [0, Math.max(...countTotals)],
      nice: true,
    });
    const scoreScale = scaleBand({
      domain: data.map(getScore),
      padding: 0.12,
    });
    const color = scaleOrdinal({
      domain: ['detractors', 'passives', 'promoters'],
      range: [detractorsColor, passivesColor, promotersColor],
    });

    scoreScale.rangeRound([0, xMax]);
    countScale.range([yMax, 0]);

    return width < 10 ? null : (
      <div>
        <svg width={width} height={height}>
          <rect width={width} height={height} fill={'transparent'} />
          <Group top={margin.top} left={margin.left}>
            <GridRows
              scale={countScale}
              width={xMax}
              height={yMax}
              numTicks={rowNumTicks}
              strokeWidth={0.6}
              stroke={gridColor}
              strokeOpacity={1}
              pointerEvents="none"
            />
            <BarStack
              data={data}
              keys={keys}
              height={yMax}
              x={getScore}
              xScale={scoreScale}
              yScale={countScale}
              color={color}
            >
              {(barStacks) =>
                barStacks.map((barStack) =>
                  barStack.bars.map((bar) => (
                    <rect
                      key={`bar-stack-${barStack.index}-${bar.index}`}
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      fill={color(getGroup(bar.bar.data))}
                      rx={2}
                      onMouseLeave={() => {
                        tooltipTimeout = window.setTimeout(() => {
                          hideTooltip();
                        }, 300);
                      }}
                      onMouseMove={(event) => {
                        if (tooltipTimeout) clearTimeout(tooltipTimeout);
                        // TooltipInPortal expects coordinates to be relative to containerRef
                        // localPoint returns coordinates relative to the nearest SVG, which
                        // is what containerRef is set to in this example.
                        const eventSvgCoords = localPoint(event);
                        const left = bar.x + bar.width / 2;
                        showTooltip({
                          tooltipData: bar,
                          tooltipTop: eventSvgCoords?.y,
                          tooltipLeft: left,
                        });
                      }}
                    />
                  )),
                )
              }
            </BarStack>
            <AxisLeft
              hideAxisLine
              hideTicks
              scale={countScale}
              numTicks={rowNumTicks}
              stroke={xLabelColor}
              tickStroke={xLabelColor}
              tickLabelProps={() => ({
                fill: xLabelColor,
                fontSize: 8,
                textAnchor: 'end',
                dy: '0.33em'
              })}
            />
            <AxisBottom
              hideAxisLine
              hideTicks
              top={yMax}
              scale={scoreScale}
              stroke={yLabelColor}
              tickLabelProps={() => ({
                fill: yLabelColor,
                fontSize: 8,
                textAnchor: 'middle',
                dy: '-0.33em'
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
            <h4 style={{ color: yLabelColor }}>
              <strong>{getScore(tooltipData.bar.data)}</strong>
            </h4>
            <h4>{tooltipData.bar.data[tooltipData.key]}개</h4>
          </Tooltip>
        )}
      </div>
    );
  },
);