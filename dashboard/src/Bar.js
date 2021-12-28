//module
import { useState, useEffect } from "react";
import { useQuery } from 'react-query';
import styled from "styled-components";
import superagent from "superagent";
import moment from "moment-timezone"
//component
import ProportionBarChart from "./ProportionBarChart";
import RadioButton from "./RadioButton";
//function
import getClock from "./functions/getClock";

//constant
const VIEWPORT_H = 1080, VIEWPORT_W = 1920
const BOX_1_H = 320, BOX_2_H = 240
const BOX_11_W = 796, BOX_12_W = 684, BOX_13_W = 310, BOX_3_W = 910

//styled-component
const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  box-sizing: border-box;
  padding: ${35 * 100 / VIEWPORT_H}vh ${35 * 100 / VIEWPORT_W}vw;
  height: 100vh;
  width: 100vw;
`

const sendRequest = async (path) => {
  try {
    const res = await superagent.get(`http://localhost:3001/${path}`)
    return JSON.parse(res.text)
  } catch (err) {
    return err
  }
}

const fetchAtGivenHourEveryDay = (fetcher, hour, cleaner) => {
  const now = moment()
  const dayAdd = now.isBefore(now.clone().set('hour', hour)) ? 0 : 1
  const nextFetchTime = now.clone().add(dayAdd, 'days').set('hour', hour)
  fetcher()
  cleaner && cleaner()
  setTimeout(() => {
    fetchAtGivenHourEveryDay()
  }, nextFetchTime.diff(now, 'milliseconds'))
}

const fetchAtEveryMonday = (fetcher) => {
  const now = moment()
  const thisMonday = now.clone().isoWeekday(1).startOf('day').set('minute', 15)
  const weekAdd = now.isBefore(thisMonday) ? 0 : 1
  const nextFetchTime = now.clone().add(weekAdd, 'weeks').isoWeekday(1).startOf('day').set('minute', 15)
  fetcher()
  setTimeout(() => {
    fetchAtEveryMonday()
  }, nextFetchTime.diff(now, 'milliseconds'))
}

//HTML
function Bar() {
  //default setting
  const [clock, setClock] = useState({ year: "", month: "", date: "", hours: "", minutes: "" });
  const [alreadySet, setAlreadySet] = useState(false)
  const [npsButton, setNpsButton] = useState('total')
  const [useButton, setUseButton] = useState('total')

  //nps
  const { status: npsIndicatorsStatus, data: npsIndicators, error: npsIndicatorsError, refetch: npsIndicatorsRefetch } = useQuery('nps-indicators', () => sendRequest('nps/indicators'), {
    enabled: false
  })
  const { status: npsDissatisfactionIndicatorsStatus, data: npsDissatisfactionIndicators, error: npsDissatisfactionIndicatorsError, refetch: npsDissatisfactionIndicatorsRefetch } = useQuery('nps-dissatisfaction-indicators', () => sendRequest(`nps/dissatisfaction/${npsButton}`), {
    enabled: false
  })
  const { status: useDissatisfactionDetailsStatus, data: useDissatisfactionDetails, error: useDissatisfactionDetailsError, refetch: useDissatisfactionDetailsRefetch } = useQuery('use-dissatisfaction-details', () => sendRequest(`use/dissatisfaction/details/${useButton}`), {
    enabled: false
  })

  const useHandleChange = (event) => {
    setUseButton(event.target.value)
  }

  let status = [npsIndicatorsStatus, npsDissatisfactionIndicatorsStatus, useDissatisfactionDetailsStatus]
  let error = [npsIndicatorsError, npsDissatisfactionIndicatorsError, useDissatisfactionDetailsError]
  const isLoading = (element) => element === 'loading'
  const isError = (element) => element != null
  const hourFetcher = new Map([
    [1, [[npsIndicatorsRefetch], [npsDissatisfactionIndicatorsRefetch, () => setNpsButton('total')], [useDissatisfactionDetailsRefetch, () => setUseButton('total')]]]
  ])

  useEffect(() => {
    if (!alreadySet) {
      setAlreadySet(true)
      setInterval(() => setClock(getClock()), 1000)
      for (const [hour, items] of hourFetcher) {
        for (const [fetcher, cleaner] of items) {
          fetchAtGivenHourEveryDay(fetcher, hour, cleaner)
        }
      }
    }
  })

  // useEffect(
  //   useDissatisfactionDetailsRefetch()
  //   , [useButton])

  return (
    <div>
      {status.some(isLoading) || useDissatisfactionDetails === undefined ? (
        <h2 style={{ padding: '30px 35px' }}>
          Loading...
        </h2>
      ) : error.some(isError) ? (
        <span>
          Error: {error.message}
        </span>
      ) : (
        <Container>
          <div style={{ width: '320px', height: '215px' }}>
            <div style={{ float: 'left', width: `${220 * 100 / BOX_13_W}`, height: '100%' }}>
              <ProportionBarChart data={useDissatisfactionDetails.top4UseDissatisfactionProportion} width={240} height={200} 
              proportionMax={100} />
            </div>
            <div style={{ float: 'left', margin: '30px 0px 0px 8px', width: `${90 * 100 / BOX_13_W}`, height: '100%' }}>
              <RadioButton value={'total'} title={'전체'} active={useButton === 'total'} event={useHandleChange} />
              <RadioButton value={'issue'} title={'이용 문제'} active={useButton === 'issue'} event={useHandleChange} />
              <RadioButton value={'breakdown'} title={'고장 신고'} active={useButton === 'breakdown'} event={useHandleChange} />
            </div>
          </div>
        </Container>
      )}
    </div>
  );
};

export default Bar;
