import React from 'react';
import { BarStack } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { GridRows, GridColumns } from '@visx/grid';
import { withTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';

export const barColor = '#B0A9FF';
export const accentBarColor = '#7A6DFF';
export const subBarColor = '#E2E8F0';
export const gridColor = '#CBD4E1';
export const xLabelColor = '#64748B';
export const yLabelColor = '#94A3B8';
export const background = '#ffffff';
const defaultMargin = { top: 5, left: 30, right: 0, bottom: 30 };
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: background,
  color: 'white',
};

// format
const formatYAxis = (d) => `${d}%`;

// accessors
const getItem = (d) => d.item;
const key1 = ['currentProportion'];
const key2 = ['previousProportion'];

let tooltipTimeout

export default withTooltip(
  ({
    index,
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
    columnNumTicks = 5
  }) => {
    if (index === 1) {
      margin.left = 30
    } else if (index === 2) {
      margin.left = 0
    }

    // bounds
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    // scales
    const proportionScale = scaleLinear({
      domain: [0, 100],
      nice: true,
    });
    const itemScale = scaleBand({
      domain: data.map(getItem),
      padding: 0.35,
    });
    const colorScale = scaleOrdinal({
      domain: [key1, key2],
      range: [barColor, subBarColor],
    });
    const color = scaleOrdinal({
      domain: ['회원가입', '결제 등록', '면허 등록', '첫 이용'],
      range: [barColor, barColor, barColor, accentBarColor],
    });

    itemScale.rangeRound([0, xMax]);
    proportionScale.rangeRound([yMax, 0]);

    return width < 10 ? null : (
      <div>
        <svg width={width} height={height}>
          <rect width={width} height={height} fill={'transparent'} />
          <Group top={margin.top} left={margin.left}>
            <GridRows
              scale={proportionScale}
              width={xMax}
              height={yMax}
              strokeWidth={0.6}
              stroke={gridColor}
              strokeOpacity={0.7}
              pointerEvents="none"
              numTicks={columnNumTicks}
            />
            <BarStack
              data={data}
              keys={key2}
              height={yMax}
              x={getItem}
              xScale={itemScale}
              yScale={proportionScale}
              color={colorScale}
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
                      fill={subBarColor}
                      rx={6}
                    />
                  )),
                )
              }
            </BarStack>
            <BarStack
              data={data}
              keys={key1}
              height={yMax}
              x={getItem}
              xScale={itemScale}
              yScale={proportionScale}
              color={colorScale}
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
                      fill={color(getItem(bar.bar.data))}
                      rx={6}
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
            <BarStack
              data={data}
              keys={key1}
              height={yMax}
              x={getItem}
              xScale={itemScale}
              yScale={proportionScale}
              color={colorScale}
            >
              {(barStacks) =>
                barStacks.map((barStack) =>
                  barStack.bars.map((bar) => (
                    <rect
                      key={`bar-stack-${barStack.index}-${bar.index}`}
                      x={bar.x}
                      y={yMax - 10}
                      width={bar.width}
                      height={10}
                      fill={color(getItem(bar.bar.data))}
                      rx={0}
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
            {index === 1 ? 
              <AxisLeft
                hideAxisLine
                hideTicks
                scale={proportionScale}
                numTicks={columnNumTicks}
                tickFormat={formatYAxis}
                tickLabelProps={() => ({
                  fill: yLabelColor,
                  fontSize: 8,
                  textAnchor: 'end',
                  dy: '0.33em'
                })}
              /> : null
            }
            <AxisBottom
              hideAxisLine
              hideTicks
              top={yMax}
              scale={itemScale}
              stroke={xLabelColor}
              tickLabelProps={() => ({
                fill: xLabelColor,
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
              <strong>{getItem(tooltipData.bar.data)}</strong>
            </h4>
            <h4>{tooltipData.bar.data[tooltipData.key]}%</h4>
          </Tooltip>
        )}
      </div>
    );
  },
);