//module
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import styled from 'styled-components'
import superagent from 'superagent'
import moment from 'moment-timezone'
import _ from 'lodash'
//component
import SectionBox from './SectionBox'
import InformationBox from './InformationBox'
import IndicatorBox from './IndicatorBox'
import MainIndicatorBox from './MainIndicatorBox'
import DetailBox from './DetailBox'
import DayOnDayBox from './DayOnDayBox'
import WeekOnWeekText from './WeekOnWeekText'
import TimeSeriesGraph from './TimeSeriesGraph'
import MultipleTimeSeriesGraph from './MultipleTimeSeriesGraph'
import ProportionBarChart from './ProportionBarChart'
import ProportionStackBarChart from './ProportionStackBarChart'
import HistogramBarChart from './HistogramBarChart'
import CohortChart from './CohortChart'
import ConversionChart from './ConversionChart'
import NonAxisConversionChart from './NonAxisConversionChart'
import SpaghettiGraph from './SpaghettiGraph'
import RadioButton from './RadioButton'
import CheckBox from './CheckBox'
//function
import getClock from './functions/getClock'

//constant
const VIEWPORT_H = 1080,
	VIEWPORT_W = 1920
const BOX_1_H = 320,
	BOX_2_H = 240
const BOX_11_W = 796,
	BOX_12_W = 684,
	BOX_13_W = 310,
	BOX_3_W = 910

//styled-component
const Container = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	box-sizing: border-box;
	padding: ${(35 * 100) / VIEWPORT_H}vh ${(35 * 100) / VIEWPORT_W}vw;
	height: 100vh;
	width: 100vw;
`
const H3em = styled.h3`
	font-size: 1em;
`
const H4em = styled.h4`
	font-size: 1em;
`
const Multiply = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding-right: ${(20 * 100) / 880}%;
	width: ${(32 * 100) / 880}%;
	height: 100%;
`

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
function Dashboard() {
	//default setting
	const [clock, setClock] = useState({ year: '', month: '', date: '', hours: '', minutes: '' })
	const [alreadySet, setAlreadySet] = useState(false)
	const [npsButton, setNpsButton] = useState('total')
	const [useButton, setUseButton] = useState('total')
	const [retentionButton, setRetentionButton] = useState([0, 1, 2, 3, 4, 5, 6])

	async function sendRequest(path) {
		try {
			const res = await superagent.get(`http://localhost:3001/${path}`)
			return JSON.parse(res.text)
		} catch (err) {
			return err
		}
	}

	//handle change
	const npsHandleChange = (event) => {
		setNpsButton(event.target.value)
	}
	const useHandleChange = (event) => {
		setUseButton(event.target.value)
	}

	const handleChange = (event) => {
		const index = parseInt(event.target.value)
		if (retentionButton.includes(index)) {
			setRetentionButton(retentionButton.filter((el) => el !== index))
		} else {
			setRetentionButton([...retentionButton, index])
		}
	}

	//get data
	//activation
	const {
		status: activationConversionStatus,
		data: activationConversion,
		error: activationConversionError,
	} = useQuery('activation-conversion', () => sendRequest('activation/conversion'), {
		refetchInterval: 15 * 60 * 1000,
	})
	const {
		status: activationNewUserStatus,
		data: activationNewUser,
		error: activationNewUserError,
	} = useQuery('activation-new-user', () => sendRequest('activation/new-user'), {
		refetchInterval: 15 * 60 * 1000,
	})
	const {
		status: activationHistoryStatus,
		data: activationHistory,
		error: activationHistoryError,
		refetch: activationHistoryRefetch,
	} = useQuery('activation-history', () => sendRequest('activation/history'), {
		enabled: false,
	})
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
		status: npsDissatisfactionIndicatorsStatus,
		data: npsDissatisfactionIndicators,
		error: npsDissatisfactionIndicatorsError,
		refetch: npsDissatisfactionIndicatorsRefetch,
	} = useQuery('nps-dissatisfaction-indicators', () => sendRequest(`nps/dissatisfaction/${npsButton}`), {
		enabled: false,
	})
	//retention
	const {
		status: retentionIndicatorsStatus,
		data: retentionIndicators,
		error: retentionIndicatorsError,
		refetch: retentionIndicatorsRefetch,
	} = useQuery('retention-indicators', () => sendRequest('retention/indicators'), {
		enabled: false,
	})
	const {
		status: retentionHistoryStatus,
		data: retentionHistory,
		error: retentionHistoryError,
		refetch: retentionHistoryRefetch,
	} = useQuery('retention-history', () => sendRequest('retention/history'), {
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
	//revenue
	const {
		status: revenueIndicatorsStatus,
		data: revenueIndicators,
		error: revenueIndicatorsError,
	} = useQuery('revenue-indicators', () => sendRequest('revenue/indicators'), {
		refetchInterval: 15 * 60 * 1000,
	})
	const {
		status: revenueOperationIndicatorsStatus,
		data: revenueOperationIndicators,
		error: revenueOperationIndicatorsError,
	} = useQuery('revenue-operation-indicators', () => sendRequest('revenue/operation/indicators'), {
		refetchInterval: 15 * 60 * 1000,
	})
	const {
		status: revenueHistoryStatus,
		data: revenueHistory,
		error: revenueHistoryError,
		refetch: revenueHistoryRefetch,
	} = useQuery('revenue-history', () => sendRequest('revenue/history'), {
		enabled: false,
	})
	//use
	const {
		status: useIndicatorsStatus,
		data: useIndicators,
		error: useIndicatorsError,
	} = useQuery('use-indicators', () => sendRequest('use/indicators'), {
		refetchInterval: 15 * 60 * 1000,
	})
	const {
		status: useHistoryStatus,
		data: useHistory,
		error: useHistoryError,
		refetch: useHistoryRefetch,
	} = useQuery('use-history', () => sendRequest('use/history'), {
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
		status: useDissatisfactionDetailsStatus,
		data: useDissatisfactionDetails,
		error: useDissatisfactionDetailsError,
		refetch: useDissatisfactionDetailsRefetch,
	} = useQuery('use-dissatisfaction-details', () => sendRequest(`use/dissatisfaction/details/${useButton}`), {
		enabled: false,
	})
	//user
	const {
		status: coreUserProportionIndicatorsStatus,
		data: coreUserProportionIndicators,
		error: coreUserProportionIndicatorsError,
		refetch: coreUserProportionIndicatorsRefetch,
	} = useQuery('core-user-proportion-indicators', () => sendRequest('user/proportion/indicators/core'), {
		enabled: false,
	})
	const {
		status: activeUserProportionIndicatorsStatus,
		data: activeUserProportionIndicators,
		error: activeUserProportionIndicatorsError,
		refetch: activeUserProportionIndicatorsRefetch,
	} = useQuery('active-user-proportion-indicators', () => sendRequest('user/proportion/indicators/active'), {
		enabled: false,
	})
	const {
		status: userActivityRateIndicatorsStatus,
		data: userActivityRateIndicators,
		error: userActivityRateIndicatorsError,
	} = useQuery('user-activity-rate-indicators', () => sendRequest('user/activity-rate/indicators'), {
		refetchInterval: 15 * 60 * 1000,
	})
	const {
		status: userCohortStatus,
		data: userCohort,
		error: userCohortError,
		refetch: userCohortRefetch,
	} = useQuery('user-cohort', () => sendRequest('user/cohort'), {
		enabled: false,
	})
	const {
		status: activeUserProportionHistoryIndicatorsStatus,
		data: activeUserProportionHistoryIndicators,
		error: activeUserProportionHistoryIndicatorsError,
		refetch: activeUserProportionHistoryIndicatorsRefetch,
	} = useQuery('active-user-proportion-history-indicators', () => sendRequest('user/proportion/history/active'), {
		enabled: false,
	})
	const {
		status: coreUserProportionHistoryIndicatorsStatus,
		data: coreUserProportionHistoryIndicators,
		error: coreUserProportionHistoryIndicatorsError,
		refetch: coreUserProportionHistoryIndicatorsRefetch,
	} = useQuery('core-user-proportion-history-indicators', () => sendRequest('user/proportion/history/core'), {
		enabled: false,
	})
	const {
		status: userActivityRateHistoryIndicatorsStatus,
		data: userActivityRateHistoryIndicators,
		error: userActivityRateHistoryIndicatorsError,
		refetch: userActivityRateHistoryIndicatorsRefetch,
	} = useQuery('user-activity-rate-history-indicators', () => sendRequest('user/activity-rate/history'), {
		enabled: false,
	})

	let status = [
		activationConversionStatus,
		activationNewUserStatus,
		activationHistoryStatus,
		npsIndicatorsStatus,
		npsDissatisfactionIndicatorsStatus,
		retentionIndicatorsStatus,
		retentionHistoryStatus,
		retentionCohortStatus,
		revenueIndicatorsStatus,
		revenueOperationIndicatorsStatus,
		revenueHistoryStatus,
		useIndicatorsStatus,
		useHistoryStatus,
		useDissatisfactionIndicatorsStatus,
		useDissatisfactionDetailsStatus,
		coreUserProportionIndicatorsStatus,
		activeUserProportionIndicatorsStatus,
		userActivityRateIndicatorsStatus,
		userCohortStatus,
		activeUserProportionHistoryIndicatorsStatus,
		coreUserProportionHistoryIndicatorsStatus,
		userActivityRateHistoryIndicatorsStatus,
	]
	let error = [
		activationConversionError,
		activationNewUserError,
		activationHistoryError,
		npsIndicatorsError,
		npsDissatisfactionIndicatorsError,
		retentionIndicatorsError,
		retentionHistoryError,
		retentionCohortError,
		revenueIndicatorsError,
		revenueOperationIndicatorsError,
		revenueHistoryError,
		useIndicatorsError,
		useHistoryError,
		useDissatisfactionIndicatorsError,
		useDissatisfactionDetailsError,
		coreUserProportionIndicatorsError,
		activeUserProportionIndicatorsError,
		userActivityRateIndicatorsError,
		userCohortError,
		activeUserProportionHistoryIndicatorsError,
		coreUserProportionHistoryIndicatorsError,
		userActivityRateHistoryIndicatorsError,
	]
	const isLoading = (element) => element === 'loading'
	const isError = (element) => element != null
	const hourFetcher = new Map([
		[
			1,
			[
				[activationHistoryRefetch],
				[useHistoryRefetch],
				[useDissatisfactionIndicatorsRefetch],
				[useDissatisfactionDetailsRefetch, () => setUseButton('total')],
				[npsIndicatorsRefetch],
				[npsDissatisfactionIndicatorsRefetch, () => setNpsButton('total')],
				[activeUserProportionIndicatorsRefetch],
				[retentionIndicatorsRefetch],
				[retentionHistoryRefetch],
				[revenueHistoryRefetch],
				[activeUserProportionHistoryIndicatorsRefetch],
				[userActivityRateHistoryIndicatorsRefetch],
			],
		],
	])
	const mondayFetcher = new Map([[coreUserProportionIndicatorsRefetch], [retentionCohortRefetch], [userCohortRefetch], [coreUserProportionHistoryIndicatorsRefetch]])

	//useEffect
	useEffect(() => {
		if (!alreadySet) {
			setAlreadySet(true)
			setInterval(() => setClock(getClock()), 1000)
			for (const [fetcher] of mondayFetcher) {
				console.log(fetcher)
				fetchAtEveryMonday(fetcher)
			}
			for (const [hour, items] of hourFetcher) {
				for (const [fetcher, cleaner] of items) {
					fetchAtGivenHourEveryDay(fetcher, hour, cleaner)
				}
			}
		}
	})
	useEffect(npsDissatisfactionIndicatorsRefetch, [npsButton])
	useEffect(useDissatisfactionDetailsRefetch, [useButton])

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
			{status.some(isLoading) || npsDissatisfactionIndicators === undefined || retentionCohort === undefined || useDissatisfactionDetails === undefined ? (
				<h2 style={{ padding: '30px 35px' }}>Loading...</h2>
			) : error.some(isError) ? (
				<span>Error: {error.message}</span>
			) : (
				<Container>
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							columnGap: `${(20 * 100) / VIEWPORT_W}%`,
							height: `${(40 * 100) / (VIEWPORT_H - 70)}%`,
						}}
					>
						<InformationBox width={(175 * 100) / (VIEWPORT_W - 70)} image={'images/calendar.png'}>
							<H3em style={{ paddingLeft: `${(32 * 100) / 175}%` }}>{clock.year}</H3em>
							<H4em>년&nbsp;</H4em>
							<H3em>{clock.month}</H3em>
							<H4em>월&nbsp;</H4em>
							<H3em>{clock.date}</H3em>
							<H4em>일</H4em>
						</InformationBox>
						<InformationBox width={(125 * 100) / (VIEWPORT_W - 70)} image={'images/time.png'}>
							<H4em style={{ paddingLeft: `${(32 * 100) / 125}%` }}>{clock.hours < 12 ? '오전' : '오후'}&nbsp;</H4em>
							<H3em>{clock.hours < 12 ? `${clock.hours}:${clock.minutes}` : `${clock.hours - 12}:${clock.minutes}`}</H3em>
						</InformationBox>
						<InformationBox width={(95 * 100) / (VIEWPORT_W - 70)} image={'images/sun.png'}></InformationBox>
					</div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							height: `${(BOX_1_H * 100) / (VIEWPORT_H - 70)}%`,
						}}
					>
						<SectionBox style={{ display: 'flex', flexDirection: 'column' }} width={(BOX_11_W * 100) / (VIEWPORT_W - 70)}>
							<div style={{ width: '100%', height: `${(115 * 100) / BOX_1_H}%` }}>
								<MainIndicatorBox style={{ float: 'left', marginRight: '0px' }} color={'#5346E0'} width={(235 * 100) / BOX_11_W} height={100} image={'images/profile.png'} title={'핵심유저 비율'}>
									<h2
										style={{
											display: 'inline-block',
											marginTop: '23px',
											fontSize: '45px',
											color: '#ffffff',
										}}
									>
										{coreUserProportionIndicators.userProportion.toFixed(1)}
									</h2>
									<h3
										style={{
											display: 'inline-block',
											fontSize: '15px',
											color: '#ffffff',
											marginLeft: '7.25px',
										}}
									>
										%
									</h3>
									<DetailBox index={1} width={(100 * 100) / 235} height={(60 * 100) / 107} positiveImage={'images/plus_core_user.png'} negativeImage={'images/minus_core_user.png'} figure1={coreUserProportionIndicators.inflowUser.toLocaleString('ko-KR')} figure2={coreUserProportionIndicators.outflowUser.toLocaleString('ko-KR')} unit={'명'} backgroundColor={'rgba(255, 255, 255, 0.1)'}></DetailBox>
								</MainIndicatorBox>
								<IndicatorBox style={{ display: 'flex', float: 'left', padding: '0px' }} width={(516 * 100) / BOX_11_W} height={(75 * 100) / 115}>
									<div
										style={{
											boxSizing: 'border-box',
											padding: '13px 0px 0px 13px',
											width: '160px',
											height: '100%',
										}}
									>
										<h4>핵심유저 활성율</h4>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{userActivityRateIndicators.coreUserActivityRate.toFixed(1)}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>%</h3>
										<DayOnDayBox figure={userActivityRateIndicators.coreUserActivityRateDayOnDay.toFixed(1)} />
									</div>
									<hr
										style={{
											border: 'none',
											position: 'absolute',
											left: '160px',
											margin: '0px',
											width: '0.6px',
											height: '100%',
											backgroundColor: '#CBD4E1',
										}}
									></hr>
									<div
										style={{
											position: 'relative',
											boxSizing: 'border-box',
											padding: '13px 0px 0px 13px',
											width: '180px',
											height: '100%',
										}}
									>
										<h4>활성유저 비율</h4>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{activeUserProportionIndicators.userProportion.toFixed(1)}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>%</h3>
										<DetailBox index={3} width={(70 * 100) / 180} height={(40 * 100) / 75} positiveImage={'images/plus_active_user.png'} negativeImage={'images/minus_active_user.png'} figure1={activeUserProportionIndicators.inflowUser.toLocaleString('ko-KR')} figure2={activeUserProportionIndicators.outflowUser.toLocaleString('ko-KR')} unit={'명'} backgroundColor={'#E2E8F0'}></DetailBox>
									</div>
									<div
										style={{
											boxSizing: 'border-box',
											paddingLeft: '40px',
											padding: '13px 0px 0px 13px',
											width: '176px',
											height: '100%',
										}}
									>
										<h4>활성유저 활성율</h4>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{userActivityRateIndicators.activeUserActivityRate.toFixed(1)}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>%</h3>
										<DayOnDayBox figure={userActivityRateIndicators.activeUserActivityRateDayOnDay.toFixed(1)} />
									</div>
								</IndicatorBox>
							</div>
							<div
								style={{
									display: 'flex',
									width: '100%',
									paddingTop: '8px',
									height: `${(205 * 100) / BOX_1_H}%`,
								}}
							>
								<div style={{ width: `${(320 * 100) / BOX_11_W}%`, height: '100%' }}>
									<CohortChart data={userCohort.retentionCohortPercentage} width={320} height={185} />
								</div>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										width: `${(476 * 100) / BOX_11_W}%`,
										height: '100%',
									}}
								>
									<div style={{ display: 'flex', width: '100%', height: `${(92 * 100) / 205}%` }}>
										<MultipleTimeSeriesGraph index={2} data1={coreUserProportionHistoryIndicators.userProportionHistory} data2={activeUserProportionHistoryIndicators.userProportionHistory} unit={'%'} width={450} height={92} rowNumTicks={3} marginLeft={35} marginTop={15} columnNumTicks={5} />
									</div>
									<div style={{ display: 'flex', width: '100%', height: `${(92 * 100) / 205}%` }}>
										<MultipleTimeSeriesGraph index={1} data1={userActivityRateHistoryIndicators.coreUserActivityRateHistory} data2={userActivityRateHistoryIndicators.activeUserActivityRateHistory} unit={'%'} width={450} height={92} rowNumTicks={3} marginLeft={35} marginTop={15} columnNumTicks={5} />
									</div>
								</div>
							</div>
						</SectionBox>
						<SectionBox style={{ display: 'flex', flexDirection: 'column' }} width={(BOX_12_W * 100) / (VIEWPORT_W - 70)}>
							<div style={{ width: '100%', height: `${(105 * 100) / BOX_1_H}%` }}>
								<div style={{ float: 'left', width: `${(145 * 100) / BOX_12_W}%`, height: '100%' }}>
									<IndicatorBox style={{ position: 'absolute', display: 'inline', paddingRight: '13px' }} width={(130 * 100) / BOX_12_W} height={(90 * 100) / BOX_1_H} title={'초기유저 재방문율'}>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{retentionIndicators.retention.toFixed(1)}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>%</h3>
										<h4 style={{ color: '#64748b' }}>
											{retentionIndicators.retentionReferenceMonth}월 {retentionIndicators.retentionReferenceDate}일 가입자 기준
										</h4>
									</IndicatorBox>
								</div>
								<div style={{ float: 'left', width: `${(539 * 100) / BOX_12_W}%`, height: '100%' }}>
									<TimeSeriesGraph index={2} data={retentionHistory.retentionHistory} unit={'%'} width={520} height={105} rowNumTicks={3} marginLeft={35} marginTop={15} columnNumTicks={5} />
								</div>
							</div>
							<div
								style={{
									display: 'flex',
									paddingTop: '18px',
									width: '100%',
									height: `${(215 * 100) / BOX_1_H}%`,
								}}
							>
								<div style={{ width: `${(320 * 100) / BOX_12_W}%`, height: '100%' }}>
									<CohortChart data={retentionCohort.retentionCohortPercentage} width={320} height={185} />
								</div>
								<div style={{ width: `${(240 * 100) / BOX_12_W}%`, height: '100%' }}>
									<SpaghettiGraph data={retentionCohort.retentionCohortPercentage} button={retentionButton} width={240} height={180} rowNumTicks={9} marginLeft={35} marginTop={15} columnNumTicks={5} />
								</div>
								<div
									style={{
										padding: '15px 0px 0px 4px',
										width: `${(124 * 100) / BOX_12_W}`,
										height: '100%',
									}}
								>
									{checkBoxOption}
								</div>
							</div>
						</SectionBox>
						<SectionBox style={{ display: 'flex', flexDirection: 'column' }} width={(BOX_13_W * 100) / (VIEWPORT_W - 70)}>
							<div style={{ width: '100%', height: `${(105 * 100) / BOX_1_H}%` }}>
								<div style={{ float: 'left', width: `${(160 * 100) / BOX_13_W}%`, height: '100%' }}>
									<IndicatorBox style={{ position: 'absolute', display: 'inline', paddingRight: '13px' }} height={(90 * 100) / BOX_1_H} title={'NPS'}>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{npsIndicators.npsScore.toFixed(1)}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>점</h3>
										<WeekOnWeekText index={1} figure={npsIndicators.npsScoreWeekOnWeek.toFixed(1)} unit={'점'} />
									</IndicatorBox>
								</div>
								<div style={{ float: 'left', width: `${(150 * 100) / BOX_13_W}%`, height: '100%' }}>
									<HistogramBarChart data={npsIndicators.npsScoreDistribution} width={150} height={105} />
								</div>
							</div>
							<div style={{ width: '100%', height: `${(215 * 100) / BOX_1_H}%` }}>
								<div style={{ float: 'left', width: `${(240 * 100) / BOX_13_W}`, height: '100%' }}>
									<ProportionBarChart data={npsDissatisfactionIndicators.top6NpsDissatisfactionProportion} width={240} height={200} proportionMax={100} marginTop={30} marginBottom={40} marginLeft={90} />
								</div>
								<div
									style={{
										float: 'left',
										margin: '30px 0px 0px 8px',
										width: `${(70 * 100) / BOX_13_W}`,
										height: '100%',
									}}
								>
									<RadioButton value={'total'} title={'전체'} active={npsButton === 'total'} event={npsHandleChange} />
									<RadioButton value={'detractors'} title={'비추천'} active={npsButton === 'detractors'} event={npsHandleChange} />
									<RadioButton value={'passives'} title={'중립'} active={npsButton === 'passives'} event={npsHandleChange} />
									<RadioButton value={'promoters'} title={'추천'} active={npsButton === 'promoters'} event={npsHandleChange} />
								</div>
							</div>
						</SectionBox>
					</div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							height: `${(BOX_2_H * 100) / (VIEWPORT_H - 70)}%`,
						}}
					>
						<SectionBox style={{ flexDirection: 'row' }} width={(BOX_11_W * 100) / (VIEWPORT_W - 70)}>
							<div style={{ width: `${(420 * 100) / BOX_11_W}%`, height: '100%' }}>
								<div style={{ width: '100%', height: `${(90 * 100) / BOX_2_H}%` }}>
									<IndicatorBox style={{ display: 'flex', padding: '0px' }} width={(280 * 100) / 420} height={(75 * 100) / 90}>
										<div
											style={{
												boxSizing: 'border-box',
												padding: '13px 0px 0px 13px',
												width: '140px',
												height: '100%',
											}}
										>
											<h4>첫 이용 전환율</h4>
											<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{activationConversion.userActivationConversion.toFixed(1)}</h2>
											<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>%</h3>
										</div>
										<hr
											style={{
												border: 'none',
												position: 'absolute',
												left: '140px',
												margin: '0px',
												width: '0.6px',
												height: '100%',
												backgroundColor: '#CBD4E1',
											}}
										></hr>
										<div
											style={{
												boxSizing: 'border-box',
												padding: '13px 0px 0px 13px',
												width: '140px',
												height: '100%',
											}}
										>
											<h4>신규 가입자 수</h4>
											<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{activationNewUser.newUser.toLocaleString('ko-KR')}</h2>
											<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>명</h3>
											<DayOnDayBox figure={activationNewUser.newUserDayOnDay} />
										</div>
									</IndicatorBox>
								</div>
								<div style={{ width: '100%', height: `${(135 * 100) / BOX_2_H}%` }}>
									<TimeSeriesGraph index={1} data={activationHistory.newUserHistory} unit={'명'} width={420} height={120} rowNumTicks={3} marginLeft={45} marginTop={4} columnNumTicks={5} />
								</div>
							</div>
							<div style={{ paddingLeft: '10px', width: `${(376 * 100) / BOX_11_W}%`, height: '100%' }}>
								<div style={{ width: '100%', height: `${(50 * 100) / 240}%` }}></div>
								<div style={{ width: '100%', height: `${(190 * 100) / 240}%` }}>
									<div style={{ float: 'left', width: `${(205 * 100) / 366}%`, height: '100%' }}>
										<ConversionChart index={1} data={activationConversion.licenseRequiredUserActivation} width={205} height={190} />
									</div>
									<div
										style={{
											float: 'left',
											paddingLeft: '10px',
											width: `${(151 * 100) / 366}%`,
											height: '100%',
										}}
									>
										<NonAxisConversionChart index={2} data={activationConversion.licenseNotRequiredUserActivation} width={138} height={190} />
									</div>
								</div>
							</div>
						</SectionBox>
						<SectionBox style={{ display: 'flex', flexDirection: 'column' }} width={(BOX_12_W * 100) / (VIEWPORT_W - 70)}>
							<div style={{ width: '100%', height: `${(105 * 100) / BOX_2_H}%` }}>
								<IndicatorBox style={{ position: 'absolute', display: 'inline', paddingRight: '13px' }} height={(75 * 100) / BOX_2_H} title={'총 이용 횟수'}>
									<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{useIndicators.totalUse.toLocaleString('ko-KR')}</h2>
									<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>회</h3>
									<DayOnDayBox figure={useIndicators.totalUseDayOnDay} />
								</IndicatorBox>
							</div>
							<div style={{ position: 'relative', width: '100%', height: `${(120 * 100) / BOX_2_H}%` }}>
								<TimeSeriesGraph index={1} data={useHistory.totalUseHistory} unit={'회'} width={670} height={120} rowNumTicks={10} marginLeft={50} marginTop={0} columnNumTicks={5} />
							</div>
						</SectionBox>
						<SectionBox style={{ display: 'flex', flexDirection: 'column' }} width={(BOX_13_W * 100) / (VIEWPORT_W - 70)}>
							<div style={{ width: '100%', height: `${(105 * 100) / BOX_2_H}%` }}>
								<div style={{ float: 'left', width: `${(155 * 100) / BOX_13_W}%`, height: '100%' }}>
									<IndicatorBox style={{ position: 'absolute', display: 'inline', paddingRight: '13px' }} height={(90 * 100) / BOX_2_H} title={'이용 대비 불만 비율'}>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{useDissatisfactionIndicators.useDissatisfactionRatio.toFixed(2)}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>%</h3>
										<WeekOnWeekText index={2} figure={useDissatisfactionIndicators.useDissatisfactionDayOnWeek.toFixed(2)} unit={'%'} />
									</IndicatorBox>
								</div>
								<div
									style={{
										float: 'left',
										boxSizing: 'border-box',
										paddingTop: '70px',
										width: `${(155 * 100) / BOX_13_W}%`,
										height: '100%',
									}}
								>
									<ProportionStackBarChart data={useDissatisfactionIndicators.useDissatisfactionProportion} width={140} height={35} />
								</div>
							</div>
							<div style={{ width: '100%', height: `${(125 * 100) / BOX_2_H}%` }}>
								<div style={{ float: 'left', width: `${(240 * 100) / BOX_13_W}`, height: '100%' }}>
									<ProportionBarChart data={useDissatisfactionDetails.top4UseDissatisfactionProportion} width={230} height={140} proportionMax={100} marginTop={14} marginBottom={35} marginLeft={80} />
								</div>
								<div
									style={{
										float: 'left',
										margin: '16px 0px 0px 8px',
										width: `${(70 * 100) / BOX_13_W}`,
										height: '100%',
									}}
								>
									<RadioButton value={'total'} title={'전체'} active={useButton === 'total'} event={useHandleChange} />
									<RadioButton value={'issue'} title={'이용 문제'} active={useButton === 'issue'} event={useHandleChange} />
									<RadioButton value={'breakdown'} title={'고장 신고'} active={useButton === 'breakdown'} event={useHandleChange} />
								</div>
							</div>
						</SectionBox>
					</div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							height: `${(BOX_1_H * 100) / (VIEWPORT_H - 70)}%`,
						}}
					>
						<SectionBox style={{ flexDirection: 'column' }} width={(BOX_3_W * 100) / (VIEWPORT_W - 70)}>
							<div style={{ width: '100%', height: `${(130 * 100) / BOX_1_H}%` }}>
								<div style={{ float: 'left', width: `${(400 * 100) / BOX_3_W}%`, height: '100%' }}>
									<MainIndicatorBox color={'#5346E0'} width={(385 * 100) / 400} height={(115 * 100) / 130} image={'images/coin.png'} title={'오늘 매출'}>
										<h2
											style={{
												display: 'inline-block',
												marginTop: '23px',
												fontSize: '45px',
												color: '#ffffff',
											}}
										>
											{revenueIndicators.revenue.toLocaleString('ko-KR')}
										</h2>
										<h3
											style={{
												display: 'inline-block',
												fontSize: '15px',
												color: '#ffffff',
												marginLeft: '7.25px',
											}}
										>
											만원
										</h3>
										<DetailBox index={2} style={{ bottom: '34px' }} width={(120 * 100) / 385} height={(30 * 100) / 115} positiveImage={'images/up_revenue.png'} negativeImage={'images/down_revenue.png'} figure1={revenueIndicators.revenueDayOnDay} unit={'만원'} backgroundColor={'rgba(255, 255, 255, 0.1)'}></DetailBox>
									</MainIndicatorBox>
								</div>
								<div
									style={{
										float: 'left',
										paddingTop: '15px',
										width: `${(510 * 100) / BOX_3_W}%`,
										height: '100%',
									}}
								>
									<TimeSeriesGraph index={2} data={revenueHistory.revenueHistory} unit={'만원'} width={495} height={115} rowNumTicks={10} marginLeft={40} marginTop={5} columnNumTicks={5} />
								</div>
							</div>
							<div style={{ position: 'relative', width: '100%', height: `${(105 * 100) / BOX_1_H}%` }}>
								<IndicatorBox style={{ display: 'flex', padding: '0px' }} width={(880 * 100) / BOX_3_W} height={(90 * 100) / 105}>
									<div
										style={{
											boxSizing: 'border-box',
											padding: '13px 0px 0px 13px',
											width: `${(150 * 100) / 880}%`,
											height: '100%',
										}}
									>
										<h4>보유 대수</h4>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{revenueOperationIndicators.possessedDeer.toLocaleString('ko-KR')}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>대</h3>
									</div>
									<Multiply>
										<img src="images/multiply.png" alt="icon" style={{ width: '32px', height: '32px' }} />
									</Multiply>
									<div
										style={{
											boxSizing: 'border-box',
											padding: '13px 0px 0px 13px',
											width: `${(130 * 100) / 880}%`,
											height: '100%',
										}}
									>
										<h4>배포율</h4>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{revenueOperationIndicators.deployedDeerRate.toFixed(1)}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>%</h3>
									</div>
									<Multiply>
										<img src="images/multiply.png" alt="icon" style={{ width: '32px', height: '32px' }} />
									</Multiply>
									<div
										style={{
											boxSizing: 'border-box',
											padding: '13px 0px 0px 13px',
											width: `${(130 * 100) / 880}%`,
											height: '100%',
										}}
									>
										<h4>활성률</h4>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{revenueOperationIndicators.activeDeerRate.toFixed(1)}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>%</h3>
									</div>
									<Multiply>
										<img src="images/multiply.png" alt="icon" style={{ width: '32px', height: '32px' }} />
									</Multiply>
									<div
										style={{
											boxSizing: 'border-box',
											padding: '13px 0px 0px 13px',
											width: `${(130 * 100) / 880}%`,
											height: '100%',
										}}
									>
										<h4>활성 대당이용 횟수</h4>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{revenueOperationIndicators.usePerActiveDeer.toFixed(2)}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>회</h3>
									</div>
									<Multiply>
										<img src="images/multiply.png" alt="icon" style={{ width: '32px', height: '32px' }} />
									</Multiply>
									<div
										style={{
											boxSizing: 'border-box',
											padding: '13px 0px 0px 13px',
											width: `${(132 * 100) / 880}%`,
											height: '100%',
										}}
									>
										<h4>평균 이용료</h4>
										<h2 style={{ display: 'inline-block', marginTop: '4px' }}>{revenueOperationIndicators.averageUsePay.toLocaleString('ko-KR')}</h2>
										<h3 style={{ display: 'inline-block', color: '#000000', marginLeft: '5px' }}>원</h3>
									</div>
								</IndicatorBox>
							</div>
						</SectionBox>

						<SectionBox width={(BOX_3_W * 100) / (VIEWPORT_W - 70)}>
							<MainIndicatorBox color={'#877CFF'} width={(328 * 100) / BOX_3_W} height={(115 * 100) / BOX_1_H} image={'images/wallet.png'} title={'회사 잔고'}>
								<DetailBox index={1} width={(110 * 100) / 328} height={(60 * 100) / 115} positiveImage={'images/plus_cash.png'} negativeImage={'images/minus_cash.png'} backgroundColor={'rgba(255, 255, 255, 0.1)'}></DetailBox>
							</MainIndicatorBox>
						</SectionBox>
					</div>
				</Container>
			)}
		</div>
	)
}

export default Dashboard
