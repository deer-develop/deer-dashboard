//module
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import styled from 'styled-components'
import superagent from 'superagent'
import moment from 'moment-timezone'
import _ from 'lodash'
//component
import CohortChart from './CohortChart'
import SpaghettiGraph from './SpaghettiGraph'
import CheckBox from './CheckBox'
//function
import getClock from './functions/getClock'

//constant
const VIEWPORT_H = 1080,
	VIEWPORT_W = 1920

//styled-component
const Container = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
	box-sizing: border-box;
	padding: ${(35 * 100) / VIEWPORT_H}vh ${(35 * 100) / VIEWPORT_W}vw;
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
	const [clock, setClock] = useState({ year: '', month: '', date: '', hours: '', minutes: '' })
	const [alreadySet, setAlreadySet] = useState(false)
	const [retentionButton, setRetentionButton] = useState(_.range(7))

	//nps
	const {
		status: npsIndicatorsStatus,
		data: npsIndicators,
		error: npsIndicatorsError,
		refetch: npsIndicatorsRefetch,
	} = useQuery('nps-indicators', () => sendRequest('nps/indicators'), {
		enabled: false,
	})
	const {
		status: useDissatisfactionIndicatorsStatus,
		data: useDissatisfactionIndicators,
		error: useDissatisfactionIndicatorsError,
		refetch: useDissatisfactionIndicatorsRefetch,
	} = useQuery('use-dissatisfaction-indicators', () => sendRequest('use/dissatisfaction/indicators'), {
		enabled: false,
	})
	const {
		status: retentionCohortStatus,
		data: retentionCohort,
		error: retentionCohortError,
		refetch: retentionCohortRefetch,
	} = useQuery('retention-cohort', () => sendRequest('retention/cohort'), {
		enabled: false,
	})

	const handleChange = (event) => {
		const index = parseInt(event.target.value)
		if (retentionButton.includes(index)) {
			setRetentionButton(retentionButton.filter((el) => el !== index))
		} else {
			setRetentionButton([...retentionButton, index])
		}
	}

	let status = [npsIndicatorsStatus, useDissatisfactionIndicatorsStatus, retentionCohortStatus]
	let error = [npsIndicatorsError, useDissatisfactionIndicatorsError, retentionCohortError]
	const isLoading = (element) => element === 'loading'
	const isError = (element) => element != null
	const hourFetcher = new Map([[1, [[npsIndicatorsRefetch], [useDissatisfactionIndicatorsRefetch], [retentionCohortRefetch]]]])

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

	const checkBoxOption = _.range(9).map((x) => (
		<CheckBox
			value={x}
			title={
				moment()
					.subtract(x + 1, 'weeks')
					.isoWeekday(1)
					.format('MM월 DD일') +
				' ~ ' +
				moment().subtract(x, 'weeks').isoWeekday(0).format('MM월 DD일')
			}
			active={retentionButton.includes(x)}
			event={handleChange}
		/>
	))

	return (
		<div>
			{status.some(isLoading) || retentionCohort === undefined ? (
				<h2 style={{ padding: '30px 35px' }}>Loading...</h2>
			) : error.some(isError) ? (
				<span>Error: {error.message}</span>
			) : (
				<Container>
					<div style={{ width: '900px', height: '300px' }}>
						<div style={{ float: 'left', width: `${(600 * 100) / 900}`, height: '100%' }}>
							<SpaghettiGraph data={retentionCohort.retentionCohortPercentage} button={retentionButton} width={600} height={500} rowNumTicks={9} marginLeft={35} marginTop={15} columnNumTicks={5} />
						</div>
						<div style={{ float: 'left', margin: '30px 0px 0px 8px', width: `${(300 * 100) / 900}`, height: '100%' }}>{checkBoxOption}</div>
					</div>
				</Container>
			)}
		</div>
	)
}

export default Chart
