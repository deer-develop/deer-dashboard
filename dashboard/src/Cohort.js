//module
import { useState, useEffect } from "react";
import { useQuery } from 'react-query';
import styled from "styled-components";
import superagent from "superagent";
import moment from "moment-timezone"
//component
import CohortChart from "./CohortChart";
import SpaghettiGraph from "./SpaghettiGraph";
import CheckBox from "./CheckBox";
//function
import getClock from "./functions/getClock";

//constant
const VIEWPORT_H = 1080, VIEWPORT_W = 1920

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
function Chart() {
  //default setting
  const [clock, setClock] = useState({ year: "", month: "", date: "", hours: "", minutes: "" });
  const [alreadySet, setAlreadySet] = useState(false)
  const [retentionButton, setRetentionButton] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8])

  //nps
  const { status: npsIndicatorsStatus, data: npsIndicators, error: npsIndicatorsError, refetch: npsIndicatorsRefetch } = useQuery('nps-indicators', () => sendRequest('nps/indicators'), {
    enabled: false
  })
  const { status: useDissatisfactionIndicatorsStatus, data: useDissatisfactionIndicators, error: useDissatisfactionIndicatorsError, refetch: useDissatisfactionIndicatorsRefetch } = useQuery('use-dissatisfaction-indicators', () => sendRequest('use/dissatisfaction/indicators'), {
    enabled: false
  })
  const { status: retentionCohortStatus, data: retentionCohort, error: retentionCohortError, refetch: retentionCohortRefetch } = useQuery('retention-cohort', () => sendRequest('retention/cohort'), {
    enabled: false
  })

  const handleChange = (event) => {
    const index = parseInt(event.target.value)
    if (retentionButton.includes(index)) {
      setRetentionButton(retentionButton.filter((el) => el !== index));
    } else {
      setRetentionButton([...retentionButton, index]);
    }
  }

  let status = [npsIndicatorsStatus, useDissatisfactionIndicatorsStatus, retentionCohortStatus]
  let error = [npsIndicatorsError, useDissatisfactionIndicatorsError, retentionCohortError]
  const isLoading = (element) => element === 'loading'
  const isError = (element) => element != null
  const hourFetcher = new Map([
    [1, [[npsIndicatorsRefetch], [useDissatisfactionIndicatorsRefetch], [retentionCohortRefetch]]]
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

  return (
    <div>
      {status.some(isLoading) ? (
        <h2 style={{ padding: '30px 35px' }}>
          Loading...
        </h2>
      ) : error.some(isError) ? (
        <span>
          Error: {error.message}
        </span>
      ) : (
        <Container>
          <div style={{ width: '900px', height: '300px' }}>
            <div style={{ float: 'left', width: `${800 * 100 / 900}`, height: '100%' }}>
              <SpaghettiGraph data={retentionCohort.retentionCohortPercentage[0].bins} button={retentionButton} 
              width={800} height={500} rowNumTicks={9} marginLeft={35} marginTop={15} columnNumTicks={5} />
            </div>
            <div style={{ float: 'left', margin: '30px 0px 0px 8px', width: `${100 * 100 / 900}`, height: '100%' }}>
              <CheckBox value={0} title={'0주차'} active={retentionButton.includes(0) ? true : false} event={handleChange} />
              <CheckBox value={1} title={'1주차'} active={retentionButton.includes(1) ? true : false} event={handleChange} />
              <CheckBox value={2} title={'2주차'} active={retentionButton.includes(2) ? true : false} event={handleChange} />
              <CheckBox value={3} title={'3주차'} active={retentionButton.includes(3) ? true : false} event={handleChange} />
              <CheckBox value={4} title={'4주차'} active={retentionButton.includes(4) ? true : false} event={handleChange} />
              <CheckBox value={5} title={'5주차'} active={retentionButton.includes(5) ? true : false} event={handleChange} />
              <CheckBox value={6} title={'6주차'} active={retentionButton.includes(6) ? true : false} event={handleChange} />
              <CheckBox value={7} title={'7주차'} active={retentionButton.includes(7) ? true : false} event={handleChange} />
              <CheckBox value={8} title={'8주차'} active={retentionButton.includes(8) ? true : false} event={handleChange} />
            </div>
          </div>
        </Container>
      )}
    </div>
  );
};

export default Chart;
