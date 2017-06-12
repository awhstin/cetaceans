import debounce from 'lodash.debounce'
import { select, addClass } from './utils/dom'
import isMobile from './utils/is-mobile'
import graphicAcquisitions from './graphic-acquisitions'
import graphicOrcaDeath from './graphic-orca-death'
import graphicDeath from './graphic-death'
import graphicLifespan from './graphic-lifespan'
import * as d3 from 'd3'

const bodyEl = select('body')
let previousWidth = 0

function handleResize() {
	const width = bodyEl.offsetWidth
	if (previousWidth !== width) {
		d3.select('.intro').style('height', `${window.innerHeight * 0.85}px`)
		previousWidth = width
		graphicAcquisitions.resize()
		graphicLifespan.resize()
		graphicOrcaDeath.resize()
		graphicDeath.resize()
	}
}

function init() {
	d3.select('.intro').style('height', `${window.innerHeight * 0.85}px`)
	// add mobile class to body tag
	if (isMobile.any()) addClass(bodyEl, 'is-mobile')
	// setup resize event
	window.addEventListener('resize', debounce(handleResize, 150))
	// kick off graphic code
	graphicAcquisitions.init()
	graphicLifespan.init()
	graphicOrcaDeath.init()
	graphicDeath.init()
}

init()
