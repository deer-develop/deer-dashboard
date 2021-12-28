//module
import { useState, useEffect } from "react";
import { useQuery } from 'react-query';
import styled from "styled-components";
import superagent from "superagent";
import moment from "moment-timezone"
//component
import ConversionChart from "./ConversionChart";

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
function Conversion() {
  //default setting
  const [alreadySet, setAlreadySet] = useState(false)

  //nps
  const { status: activationConversionStatus, data: activationConversion, error: activationConversionError } = useQuery('activation-conversion', () => sendRequest('activation/conversion'), {
    refetchInterval: 15 * 60 * 1000
  })

  let status = [activationConversionStatus]
  let error = [activationConversionError]
  const isLoading = (element) => element === 'loading'
  const isError = (element) => element != null

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
          <ConversionChart data={activationConversion.licenseRequiredUserActivation} width={800} height={500} />
        </Container>
      )}
    </div>
  );
};

export default Conversion;
