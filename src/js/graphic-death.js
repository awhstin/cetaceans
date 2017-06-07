import * as d3 from 'd3'
import loadData from './load-data-death'

const bodySel = d3.select('body') 
const containerSel = bodySel.select('.section--death')
const graphicSel = containerSel.select('.death__graphic')
const graphicContainerSel = graphicSel.select('.graphic__container')

let tkData = []
let sliderData = []
let predictionData = []
/*let margin = 100*/
let margin = {top: 200, bottom: 25, left: 100, right: 50}
let width = 0
let height = 0
let graphicW = 0
let graphicH = 0
let desktop = false

const scaleXage = d3.scaleLinear()
const scaleXbreeding = d3.scaleLinear()
const scaleXchart = d3.scaleLinear()
const scaleYchart = d3.scaleLinear()

const populationLine = d3.line()


let breedingSliderValue = null
let ageSliderValue = null
let maxYear = null


const animalsAdded = 26


function translate(x, y) {	

	return `translate(${x}, ${y})`
}

function updateDimensions() {
	width = graphicContainerSel.node().offsetWidth
/*	width = 800*/
	height = window.innerHeight
	//desktop = window.matchMedia('(min-width: 20000px)').matches
}

function resizeGraphic() {
	const ratio = 1.5
	graphicW = width
	graphicH = graphicW / ratio

	graphicSel
		.style('height', `${graphicH}px`)

}

function updateScales(data) {

	scaleXage
		.range([0, (graphicW - (margin.left + margin.right))/3])
		.domain([15, 62])
		.clamp(true)

	scaleXbreeding
		.range([0, (graphicW - (margin.left + margin.right))/3])
		.domain([2017, 2050])
		.clamp(true)

	scaleXchart
		.range([0, (graphicW - (margin.left + margin.right))])
		/*.domain([2017, d3.max(data, d => d.year)])*/
		.domain([2017, 2115])

	scaleYchart
		.range([(graphicH - margin.top - margin.bottom), 0])
		.domain([0, d3.max(data, d => d.population)])

	populationLine
		.x(d => scaleXchart(+d.year))
		.y(d => scaleYchart(+d.population))
		/*.domain([0, 600])*/

}


function setupDOM(){
	const svg = graphicContainerSel
		.append('svg')

	const gEnter = svg
		.append('g')
		.attr('class', 'deathPlot')

	// "All Animals Live to...." Slider
	const ageSlider = svg.append('g')
		.attr('class', 'slider slider--Age')
		.attr('transform', `translate(${margin.left}, ${margin.bottom *4})`)

	// "If Breeding Ended in..." Slider
	const breedingSlider = svg.append('g')
		.attr('class', 'slider slider--Breeding')
		.attr('transform', `translate(${margin.left *5}, ${margin.bottom *4})`)

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

function setupSliders (){

d3.select('.slider#lifespan')
	.on('input', function(){
		ageSliderValue = +this.value
		/*updateSlideValue(+this.value)*/
		calculateData(+this.value, breedingSliderValue)
		updateDOM(predictionData)
	})

d3.select('.slider#breedingban')
	.on('input', function(){
		breedingSliderValue = +this.value
		/*updateSlideValue(+this.value)*/
		calculateData(ageSliderValue, +this.value)
		updateDOM(predictionData)
	})

}

function updateSlideValue(value){
	console.log(value)
}

function updateDOM(data) {
	updateScales(data)
	updateAxis(data)

	const svg = graphicSel.select('svg')

	svg
		.attr('width', graphicW)
		.attr('height', graphicH)

	const g = svg.select('g')

	g.attr('transform', translate(margin.right, margin.top))

	const plot = g.select('.deathPlot')

	const line = g.selectAll('.line')
		.data([data])


	const lineEnter = line.enter()
		.append('path')
		.attr('class', 'line')
		.attr('d', populationLine)

	// exit
	line.exit().remove()

	// update

	const lineMerge = lineEnter.merge(line)
	
	lineMerge.transition()
		.duration(400)
		.attr('d', populationLine)
}

function updateAxis(data) {
	const axis = graphicSel.select('.g-axis')

	const axisLeft = d3.axisLeft(scaleYchart)
	const axisBottom = d3.axisBottom(scaleXchart)

	const x = axis.select('.axis--x')
	const y = axis.select('.axis--y')

	const trim = graphicH - (margin.top + margin.bottom)

	x
		.attr('transform', `translate(0, ${trim})`)
		.transition()
		.duration(1500)
		.call(axisBottom
			.tickFormat(d3.format('d')))

	y
		.call(axisLeft)
}

function updateAgeSlider(sliderValue){

	const ageHandle = d3.select('.ageHandle')
		.attr('cx', scaleXage(sliderValue))
}

function updateBreedingSlider(sliderValue){
	const breedingHandle = d3.select('.breedingHandle')
		.attr('cx', scaleXbreeding(sliderValue))
}

function calculateData(ageSliderValue, breedingSliderValue){
	sliderData = tkData

	const newYears = d3.range(2017, breedingSliderValue).map(i => ({birthYear: i, count: animalsAdded}))

	sliderData = sliderData.concat(newYears)

	sliderData.forEach(d => d.deathYear = Math.max((ageSliderValue + d.birthYear), 2017))

	let nestSlider = d3.nest()
		.key(d => +d.deathYear)
		.rollup(leaves => d3.sum(leaves, d => d.count))
		.entries(sliderData)

	maxYear = Math.max.apply(Math, sliderData.map( d => d.deathYear))

	const cleanNest = d3.range(2017, maxYear).map(i => {
		const key = i.toString()
		const match = nestSlider.find(d => d.key === key)
		if (match) return match
			else return { key, value: 0}
	})


	const births = d3.range(breedingSliderValue, maxYear ).map(i => ({birthYear: i, count: 0})) 

	const birthsAll = newYears.concat(births)

	const cleanedBirths = d3.range(2017, maxYear ).map( i => {
		const birthYear = i
		const match = birthsAll.find(d => d.birthYear === birthYear)
		if (match) return match
			else return { birthYear: birthYear, count: 0}
	})

	cleanedBirths.forEach(d => d.deathYear = Math.max((ageSliderValue + d.birthYear), 2017))


	predictionData = d3.range(2017, maxYear  ).map(i => ({year: i, population: 500}))

	let population = 563
	for (let i = 0; i < predictionData.length; i++){
		predictionData[i].population = population
		population += cleanedBirths[i].count
		population -= cleanNest[i].value
	}


	predictionData.push({year: maxYear , population: 0})



}


function setup() {
	setupDOM()
	calculateData(20, 2030)
	resize()


}

function resize() {
	updateDimensions()
	resizeGraphic()
	updateScales(predictionData)
	setupSliders()
	updateDOM(predictionData)
/*	updateAxis()*/
}


function init() {
	loadData()
		.then((result) => {
			tkData = result
			setup()
		})
		.catch(err => console.log(err))
}

export default { init, resize }