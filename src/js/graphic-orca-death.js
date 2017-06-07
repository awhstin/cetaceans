import * as d3 from 'd3'
import loadData from './load-data-orca-death'
import './polyfills/find'

const bodySel = d3.select('body') 
const containerSel = bodySel.select('.section--orcaDeath')
const graphicSel = containerSel.select('.orcaDeath__graphic')
const graphicContainerSel = graphicSel.select('.graphic__container')

let birthData = []
let predictionDataLow = []
let predictionDataHigh = []
let allPredictionData = []
let margin = {top: 50, bottom: 50, left: 100, right: 50}
let width = 0
let height = 0
let graphicW = 0
let graphicH = 0
let desktop = false
let population = 24

const scaleX = d3.scaleLinear()
const scaleY = d3.scaleLinear()

const populationLine = d3.line()
const areaFill = d3.area()

let lineWidth = 0
let circleR = 0
let dashArray = 0
let lineWidthPop = 0
let padding = 0

function calculateData(){

	// high estimate
	const highData = birthData

	highData.forEach(d => d.deathYear = Math.max((52 + d.birthYear), 2017))

	let nestHigh = d3.nest()
		.key(d => +d.deathYear)
		.rollup(leaves => d3.sum(leaves, d => d.count))
		.entries(highData)

	const maxYearHigh = Math.max.apply(Math, highData.map( d => d.deathYear))

	const allHighData = d3.range(2017, maxYearHigh).map(i => {
		const key = i.toString()
		const match = nestHigh.find(d => d.key === key)
		if (match) return match
			else return { key, value: 0}
	})

	predictionDataHigh = d3.range(2017, maxYearHigh).map(i => ({year: i, population: 500}))

	let populationH = 24
	for (let i = 0; i < predictionDataHigh.length; i++){
		predictionDataHigh[i].population = populationH
		populationH -= allHighData[i].value
	}

	predictionDataHigh.push({year: maxYearHigh + 1, population: 0})
	predictionDataHigh.forEach(d => d.Level = "High")



	// low estimate

	const lowData = birthData

	lowData.forEach(d => d.deathYear = Math.max((16 + d.birthYear), 2017))

	let nestLow = d3.nest()
		.key(d => +d.deathYear)
		.rollup(leaves => d3.sum(leaves, d => d.count))
		.entries(lowData)

	const maxYearLow = Math.max.apply(Math, lowData.map( d => d.deathYear))

	const allLowData = d3.range(2017, maxYearLow).map(i => {
		const key = i.toString()
		const match = nestLow.find(d => d.key === key)
		if (match) return match
			else return { key, value: 0}
	})


	predictionDataLow = d3.range(2017, maxYearLow).map(i => ({year: i, population: 500}))

	let population = 24
	for (let i = 0; i < predictionDataLow.length; i++){
		predictionDataLow[i].population = population
		population -= allLowData[i].value
	}

	predictionDataLow.push({year: maxYearLow, population: 0})

	predictionDataLow.forEach(d => d.Level = "Low")

	const bothPredictionData = predictionDataHigh.concat(predictionDataLow)

	allPredictionData = d3.nest()
		.key(d => d.Level)
		.entries(bothPredictionData)



}


function translate(x, y) {	

	return `translate(${x}, ${y})`
}

function updateDimensions() {
	width = graphicContainerSel.node().offsetWidth
	height = window.innerHeight

}

function resizeGraphic() {
	const ratio = 1.5
	graphicW = width
	graphicH = graphicW / ratio

	graphicSel
		.style('height', `${graphicH}px`)

	lineWidth = Math.max(2, .007 * graphicW)

	lineWidthPop = Math.max(2, 0.001 * graphicW)

	dashArray = Math.max(2, 0.01 * graphicW)

	circleR = Math.max(5, 0.015 * graphicW)

	padding = Math.max(2, 0.005 * graphicW)
}

function updateScales(data) {

	scaleX
		.range([0, (graphicW - (margin.left + margin.right))])
		.domain([2017, 2070])

	scaleY
		.range([(graphicH - margin.top - margin.bottom), 0])
		.domain([0, 25])

	populationLine
		.x(d => scaleX(+d.year))
		.y(d => scaleY(+d.population))

	areaFill
		.x(d => scaleX(d.year))
		.y0(graphicH- margin.top - margin.bottom)
		.y1(d => scaleY(d.population))


}


function setupDOM(){
	const svg = graphicContainerSel
		.append('svg')

	const gEnter = svg
		.append('g')
		.attr('class', 'plotG')

	gEnter
		.append('g')
		.attr('class', 'orcaDeathPlot')

	const axis = gEnter
		.append('g')
		.attr('class', 'g-axis')

	const x = axis
		.append('g')
		.attr('class', 'axis axis--x')

	const y = axis
		.append('g')
		.attr('class', 'axis axis--y')

}

function updateDOM(data) {

	const svg = graphicSel.select('svg')

	svg
		.attr('width', graphicW)
		.attr('height', graphicH)


	const g = svg.select('.plotG')

	g.attr('transform', translate(margin.right, margin.top))

	const plot = g.select('.orcaDeathPlot')

	const level = plot.selectAll('.level')
		.data(data/*, d => d.key*/)

	const levelEnter = level.enter().append('g')
		.attr('class', d => `level level--${d.key}`)

	level.exit()
		.transition()
		.duration(500)
		.ease(d3.easeCubicInOut)
		.style('opacity', 0)
		.remove()

	const levelMerge = levelEnter.merge(level)




	// Creating a clipping path
	const lowerArea = plot.selectAll('.level--Low')


	const clip = lowerArea.selectAll('#areaClip').data(d => [d.values])

	const clipEnter = clip.enter()
/*		.append('clipPath')*/
		.append('path')
			.attr('id', 'areaClip')
			.attr('d', areaFill)

	clip.exit().remove()

	const clipMerge = clipEnter.merge(clip)

	clipMerge.transition()
		.duration(200)
		.attr('d', areaFill)





	// Filling in the area

	const upperArea = plot.selectAll('.level--High')

	const area = upperArea.selectAll('.area').data(d => [d.values])

	const areaEnter = area.enter()
		.append('path')
		.attr('class', 'area')
		.attr('d', areaFill)
/*		.attr('clip-path', 'url(#areaClip)')*/
		

	area.exit().remove()

	const areaMerge = areaEnter.merge(area)

	areaMerge.transition()
		.duration(200)
		.attr('d', areaFill)


	// Drawing lines
	const line = levelMerge.selectAll('.line').data(d => [d.values])


	const lineEnter = line.enter()
		.append('path')
		.attr('class', (d, i) => `line line--${d.Level}`)
		.attr('d', populationLine)
		.style('stroke-width', `${lineWidth}px`)
		.style('stroke-dasharray', `${dashArray}, ${dashArray/2}`)

		console.log(lineWidth)

		// exit
	line.exit().remove()

	// update

	const lineMerge = lineEnter.merge(line)
	
	lineMerge.transition()
		.duration(200)
		.attr('d', populationLine)
		.style('stroke-width', `${lineWidth}px`)
		.style('stroke-dasharray', `${dashArray}, ${dashArray/2}`)


	// Adding circles

	const circleData = [{
		id: 'endHigh',
		x: 2070,
		y: 0
	},{
		id: 'endLow',
		x: 2033,
		y: 0
	},{
		id: 'beginning',
		x: 2017,
		y: 24
	}]

	const circle = plot.selectAll('.circle').data(circleData)

	const circleEnter = circle.enter()
		.append('circle')
		.attr('class', d => `circle circle--${d.id}`)
		.attr('cx', d => scaleX(d.x))
		.attr('cy', d => scaleY(d.y))
		.attr('r', `${circleR}`)

	circle.exit().remove()

	const circleMerge = circleEnter.merge(circle)

	circleMerge.transition()
		.duration(200)
			.attr('cx', d => scaleX(d.x))
			.attr('cy', d => scaleY(d.y))
			.attr('r', `${circleR}`)


	// Adding Y line element
	const lineData = [{'id': 'data', 'x': 2017, 'y': 'other' }]

	const populationGroup = plot.selectAll('.popG').data(lineData)

	const popGroupEnter = populationGroup.enter()
		.append('g')
		.attr('class', 'popG')

	populationGroup.exit().remove()

	const popGroupMerge = popGroupEnter.merge(populationGroup)


	// Adding line

	const populationLabel = popGroupMerge.selectAll('.popLine').data(lineData)

	const popEnter = populationLabel.enter()
		.append('line')
		.attr('class', 'popLine')
		.attr('x1', scaleX(2017))
		.attr('x2', scaleX(2017))
		.attr('y1', scaleY(0))
		.attr('y2', scaleY(24))
		.attr('transform', `translate(${-graphicW/27}, 0)`)
		.attr('class', 'popLine')
		.style('stroke-width', `${lineWidthPop}px`)

	populationLabel.exit().remove()

	const popMerge = popEnter.merge(populationLabel)

	popMerge.transition()
		.duration(200)
		.attr('x1', scaleX(2017))
		.attr('x2', scaleX(2017))
		.attr('y1', scaleY(0))
		.attr('y2', scaleY(24))
		.attr('transform', `translate(${-graphicW/27}, 0)`)
		.style('stroke-width', `${lineWidthPop}px`)


	// Adding Text

	const populationText = popGroupMerge.selectAll('.popText').data(lineData)

	const popTextEnter = populationText.enter()
		.append('text')
		.attr('class', 'popText')
		.attr('transform', `translate(${-graphicW/33}, ${graphicH/2}) rotate(-90)`)
		.text('population')

	populationText.exit().remove()

	const popTextMerge = popTextEnter.merge(populationText)

	popTextMerge.transition()
		.duration(200)
		.attr('transform', `translate(${-graphicW/33}, ${graphicH/2}) rotate(-90)`)


	// Adding rectangle behind text
	let popTextMeas = d3.select('.popText')
	let bbox = popTextMeas.node().getBBox()
	

	const popRect = popGroupMerge.selectAll('.popRect').data(lineData)

	const popRectEnter = popRect.enter()
		.append('rect')
		.attr('x', bbox.x - padding)
		.attr('y', bbox.y - padding)
		.attr('width', bbox.width + (padding*2))
		.attr('height', bbox.height + (padding*2))
		.attr('class', 'popRect')
		.attr('transform', `translate(${-graphicW/33}, ${graphicH/2}) rotate(-90)`)

	popRect.exit().remove()

	const popRectMerge = popRectEnter.merge(popRect)

	popRectMerge.transition()
		.duration(200)
		.attr('x', bbox.x - padding)
		.attr('y', bbox.y - padding)
		.attr('width', bbox.width + (padding*2))
		.attr('height', bbox.height + (padding*2))
		.attr('transform', `translate(${-graphicW/33}, ${graphicH/2}) rotate(-90)`)

	// Raise text on top of background rectangle
	popTextMerge.raise()





}





function updateAxis(data) {
	const axis = graphicSel.select('.g-axis')

	const axisLeft = d3.axisLeft(scaleY)
	const axisBottom = d3.axisBottom(scaleX)

	const x = axis.select('.axis--x')
	const y = axis.select('.axis--y')

	const trim = graphicH - (margin.top + margin.bottom)


	axis.append("marker")
			.attr('refX', 5)
			.attr('refY', 0)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto')
			.attr('id', 'arrowHead')
		.append("path")
			.attr("d", "M0,-5L10,0L0,5")
			.attr("class","arrowHead");

	x
		.attr('transform', `translate(0, ${trim})`)
		.transition()
		.duration(200)
		.call(axisBottom
			.tickFormat(d3.format('d')))

	y
		.attr('transform', `translate(-50, 0)`)
		.call(axisLeft
			.ticks(0))
}




function setup() {
	setupDOM()
	calculateData()
	resize()


}

function resize() {
	updateDimensions()
	resizeGraphic()
	updateScales(allPredictionData)
	updateDOM(allPredictionData)
	updateAxis(allPredictionData)
}


function init() {
	loadData()
		.then((result) => {
			birthData = result
			setup()
		})
		.catch(err => console.log(err))
}

export default { init, resize }