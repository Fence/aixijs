import { BayesTrace } from './../x/trace';
import { Trace } from '../x/trace';
import * as d3 from 'd3';
import { Util } from '../x/util';
import { Time, Vector } from '../x/x';

export type PlotConstructor = new (trace: Trace) => Plot;

export class Plot {
	xLabel: string;
	yLabel: string;
	key: string;
	data: Vector;
	id: string;

	private margin: any;
	private width: number;
	private height: number;
	private min: number;
	private max: number;


	private rofl: [number, number][];
	private cycles: number[];

	private T: Time;

	private xAxis: d3.Axis<any>;
	private yAxis: d3.Axis<any>;
	private yAxisLabel: d3.Selection<any, {}, HTMLElement, any>;

	private valueline: d3.Line<[number, number]>;
	private path: d3.Selection<d3.BaseType, {}, HTMLElement, any>;

	protected x: d3.ScaleLinear<number, number>;
	protected y: d3.ScaleLinear<number, number>;
	protected svg: d3.Selection<any, {}, HTMLElement, any>;

	constructor(trace: Trace,
		data: number[],
		id: string,
		yLabel: string,
		xLabel = 'Cycles') {

		this.id = id;
		this.xLabel = xLabel;
		this.yLabel = yLabel;

		this.key = 'averageReward';
		this.T = trace.T;
		this.cycles = trace.cycles;

		this.margin = { top: 50, right: 70, bottom: 30, left: 70 };
		this.width = 500 - this.margin.left - this.margin.right;
		this.height = 270 - this.margin.top - this.margin.bottom;
		this.data = data;

		this.rofl = Util.zip(this.cycles, data);

		d3.select('#' + id).remove();

		this.svg = d3.select('#plots')
			.append('svg')
			.attr('id', id)
			.attr('width', this.width + this.margin.left + this.margin.right)
			.attr('height', this.height + this.margin.top + this.margin.bottom)
			.append('g')
			.attr('transform', `translate(${this.margin.left},${this.margin.top})`);

		this.x = d3.scaleLinear().range([0, this.width]);
		this.y = d3.scaleLinear().range([this.height, 0]);

		this.x.domain([0, this.T]);
		if (data.length > 0) {
			this.min = d3.min(data)!;
			this.max = d3.max(data)!;
		} else {
			this.min = 0;
			this.max = 0;
		}

		this.y.domain([this.min, this.max]);
		this.valueline = d3.line()
			.x(d => this.x(d[0]))
			.y(d => this.y(d[1]));

		this.xAxis = d3.axisBottom(this.x).ticks(5);
		this.yAxis = d3.axisLeft(this.y).ticks(5);

		let color = (function* () {
			let idx = 0;
			let colors = ['steel-blue', 'red', 'green', 'black', 'grey', 'yellow'];
			let l = colors.length;
			while (true) {
				yield colors[idx++ % l];
			}
		}());

		this.path = this.svg.append('path')
			.attr('class', 'line');
		if (data.length > 0) {
			this.path.attr('d', this.valueline(this.rofl)!)
				.style('stroke', color.next().value);
		}

		this.svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0,${this.height})`)
			.call(this.xAxis);

		this.yAxisLabel = this.svg.append('g')
			.attr('class', 'y axis')
			.call(this.yAxis);

		this.svg.append('text')
			.attr('x', this.width / 2)
			.attr('y', this.height + this.margin.bottom)
			.style('text-anchor', 'middle')
			.text(this.xLabel);

		this.svg.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', 0 - this.height / 2)
			.attr('y', 0 - this.margin.left)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text(this.yLabel);
	}

	dataUpdate(trace: Trace) {
		let t = trace.iter - 1;
		let v = this.data[trace.iter - 1];
		if (v > this.max) {
			this.max = v;
		} else if (v < this.min) {
			this.min = v;
		}

		this.rofl.push([this.cycles[t], this.data[t]]);
		this.y.domain([this.min, this.max]);
		this.yAxis.scale(this.y);
		this.yAxisLabel.call(this.yAxis);
		this.path.attr('d', this.valueline(this.rofl)!);
	}

	update(time: number) {
		return;
	}
}

class TooltipPlot extends Plot {
	private tooltip: d3.Selection<any, {}, HTMLElement, any>;
	private label: string;
	constructor(trace: Trace,
		data: Vector,
		id: string,
		yLabel: string,
		tooltipLabel: string,
		xLabel = 'Cycles') {
		super(trace, <number[]>data, id, yLabel, xLabel);
		this.label = tooltipLabel;
		this.tooltip = this.svg.append('g').style('display', 'none');

		this.tooltip.append('circle')
			.attr('class', 'y')
			.style('fill', 'none')
			.style('stroke', 'grey')
			.attr('r', 4);

		this.tooltip.append('text')
			.attr('class', 'y1')
			.style('stroke', 'white')
			.style('stroke-width', '3.5px')
			.style('opacity', 0.8)
			.attr('dx', 8)
			.attr('dy', '-.3em');

		this.tooltip.append('text')
			.attr('class', 'y2')
			.attr('dx', 8)

			.attr('dy', '-.3em');
		this.tooltip.append('text')
			.attr('class', 'y3')
			.style('stroke', 'white')
			.style('stroke-width', '3.5px')
			.style('opacity', 0.8)
			.attr('dx', 8)
			.attr('dy', '1em');

		this.tooltip.append('text')
			.attr('class', 'y4')
			.attr('dx', 8)
			.attr('dy', '1em');
	}

	update(time: number) {
		let y = Util.roundTo(this.data[time], 2);
		this.tooltip.select('circle.y')
			.attr('transform',
			`translate(${this.x(time)},${this.y(y)})`);
		this.tooltip.style('display', null);

		for (let i = 1; i < 5; i++) {
			let text = 't: ' + (time + 1);
			if (i == 2) {
				text = this.label + ': ' + y;
			}

			this.tooltip.select('text.y' + i)
				.attr('transform',
				`translate(${this.x(time)},${this.y(y)})`)
				.text(text);
		}
	}
}

export class ExplorationPlot extends TooltipPlot {
	constructor(trace: Trace) {
		super(trace,
			trace.explored,
			'exp',
			'% explored',
			'expl');
	}
}

export class AverageRewardPlot extends TooltipPlot {
	constructor(trace: Trace) {
		super(trace,
			trace.averageReward,
			'rew',
			'Reward per Cycle',
			'r');
	}
}

export class TotalRewardPlot extends TooltipPlot {
	constructor(trace: Trace) {
		super(trace,
			trace.rewards,
			'rew',
			'Reward',
			'r');
	}
}

export class IGPlot extends TooltipPlot {
	constructor(trace: BayesTrace) {
		super(trace,
			trace.infoGain,
			'ig',
			'Information Gain',
			'ig');
	}
}
