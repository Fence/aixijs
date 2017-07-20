import { Config } from './x/x';
import { Agent, SimpleAgent } from './agents/agent';
import {
	GeometricDiscount,
	PowerDiscount,
	HyperbolicDiscount,
	ConstantHorizonDiscount
} from './x/discount';
import { Normal } from './x/distribution';
import { Bandit } from './environments/bandit';
import { QLearn } from './agents/tabular';
import { BayesExp } from './agents/bayesexp';
import { MDLAgent } from './agents/mdl';
import { BayesMixture } from './models/mixture';
import { SquareKSA, ShannonKSA, KullbackLeiblerKSA } from './agents/ksa';
import { ThompsonAgent } from './agents/thompson';
import { Environment } from './environments/environment';
import { DirichletTrace } from './x/trace';
import { DirichletGrid } from './models/dirichlet/gridworld';
import {
	BayesGridVis,
	DirichletVis,
	ThompsonVis,
	HookedOnNoiseVis,
	BayesExpVis,
	MDLVis,
	GridVisualization,
	WireHeadVis
} from './vis/gridvis';
import { BayesAgent } from './agents/bayes';
import {
	Gridworld,
	Dispenser,
	NoiseTile,
	WireheadingGrid,
	SelfModificationTile,
	Wall,
	Trap
} from './environments/gridworld';

export const glossary: Config = {
	N: {
		label: 'N',
		description: 'Dimensions of gridworld',
	},
	theta: {
		label: 'Theta',
		description: 'Frequency that the dispenser dispenses rewards',
	},
	cycles: {
		label: 'Cycles',
		description: 'Number of cycles to run the simulation for \
		(you can stop the simulation early)',
	},
	gamma: {
		label: 'Gamma',
		description: 'Geometric discount rate',
	},
	ucb: {
		label: 'UCB',
		description: 'Upper Confidence Bound parameter for Monte-carlo \
		Tree Search planning',
	},
	samples: {
		label: 'MCTS Samples',
		description: 'Number of samples to use in Monte-Carlo Tree Search',
	},
	horizon: {
		label: 'Horizon',
		description: `Agent's planning horizon`,
	},
};

export const configs: Config = {
	aixi: {
		active: true,
		name: 'MC-AIXI',
		description: 'Monte Carlo AIXI on a known Gridworld.',
		vis: BayesGridVis,
		agent: {
			type: BayesAgent,
		},
		env: {
			type: Gridworld,
		},
	},
	aimu: {
		name: 'MC-AIMU',
		description: 'Monte Carlo AIMU on a known Gridworld.',
		vis: BayesGridVis,
		agent: {
			type: BayesAgent,
			modelParametrization: 'mu',
		},
		env: {
			type: Gridworld,
		},
	},
	aixi_dirichlet: {
		active: true,
		name: 'MC-AIXI-Dirichlet',
		description: ' AIXI with a Dirichlet model on an unknown Gridworld.',
		vis: DirichletVis,
		agent: {
			type: BayesAgent,
			model: DirichletGrid,
			cycles: 500,
			tracer: DirichletTrace,
		},
		env: {
			type: Gridworld,
			N: 20,
			_mods: function (env: Gridworld) {
				let pos = Gridworld.proposeGoal(env.options.N);
				let t = env.grid[pos.x][pos.y];
				if (t.expanded) {
					t = new Dispenser(t.x, t.y, 0.5);
					env.grid[pos.x][pos.y] = t;
					env.options.map[pos.y][pos.x] = 'M';
				} else {
					this._mods(env);
				}

				env.generateConnexions();
			},
		},
	},
	/*aixi_ctw: {
		name: 'MC-AIXI-CTW',
		vis: BayesGridVis,
		agent: {
			type: BayesAgent,
			model: CTW,
			cycles: 100,
		},
		env: {
			type: Gridworld,
		},
	},*/
	thompson: {
		active: true,
		name: 'Thompson Sampling',
		description: 'Thompson sampling on a known Gridworld.',
		vis: ThompsonVis,
		agent: {
			type: ThompsonAgent,
			horizon: 12,
			samples: 5000,
			ucb: 1,
		},
		env: {
			type: Gridworld,
		},
	},
	hooked_on_noise: {
		active: true,
		name: 'Hooked on noise',
		description: `Entropy-seeking agents get hooked on white \
		noise and stop exploring, while the knowledge-seeking agent ignores it.`,
		vis: HookedOnNoiseVis,
		agent: {
			agents: { SquareKSA, ShannonKSA, KullbackLeiblerKSA },
			type: SquareKSA,
			_mods: function (agent: BayesAgent) {
				for (let nu of (<BayesMixture>agent.model).modelClass) {
					(<Gridworld>nu).grid[0][1] = new NoiseTile(0, 1);
					(<Gridworld>nu).generateConnexions();
				}
			},
		},
		env: {
			type: Gridworld,
			_mods: function (env: Gridworld) {
				env.grid[0][1] = new NoiseTile(0, 1);
				env.generateConnexions();
			},
		},
	},
	ksa: {
		active: true,
		name: 'Knowledge-seeking agents',
		description: `Compare the behavior of the Square, Shannon, and
		Kullback-Leibler knowledge-seeking agents.`,
		vis: BayesGridVis,
		exps: ['ksa'],
		agent: {
			type: SquareKSA,
			agents: { SquareKSA, ShannonKSA, KullbackLeiblerKSA },
		},
		env: {
			type: Gridworld,
		},
	},
	ksa_dirichlet: {
		active: true,
		name: 'KSA-Dirichlet',
		description: `Compare the behavior of the Square, Shannon, and
		 Kullback-Leibler KSA using a Dirichlet model.`,
		vis: DirichletVis,
		exps: ['ksa_dirichlet'],
		agent: {
			type: SquareKSA,
			agents: { SquareKSA, ShannonKSA, KullbackLeiblerKSA },
			model: DirichletGrid,
			tracer: DirichletTrace,
			cycles: 500,
		},
		env: {
			type: Gridworld,
			N: 20,
		},
	},
	shksa: {
		name: 'Shannon KSA',
		vis: BayesGridVis,
		agent: {
			type: ShannonKSA,
		},
		env: {
			type: Gridworld,
		},
	},
	sqksa: {
		name: 'Square KSA',
		vis: BayesGridVis,
		agent: {
			type: SquareKSA,
		},
		env: {
			type: Gridworld,
		},
	},
	klksa: {
		name: 'Knowledge-seeking agent',
		description: 'Kullback-Leibler KSA on a known Gridworld.',
		vis: BayesGridVis,
		agent: {
			type: KullbackLeiblerKSA,
		},
		env: {
			type: Gridworld,
		},
	},
	klksa_dirichlet: {
		name: 'KSA-Dirichlet',
		description: 'Kullback-Leibler KSA on an unknown Gridworld.',
		vis: DirichletVis,
		agent: {
			type: KullbackLeiblerKSA,
			model: DirichletGrid,
			tracer: DirichletTrace,
			cycles: 500,
		},
		env: {
			type: Gridworld,
			N: 20,
		},
	},
	shksa_dirichlet: {
		name: 'Entropy-seeking agent',
		description: 'Shannon KSA on an unknown Gridworld.',
		vis: DirichletVis,
		agent: {
			type: ShannonKSA,
			model: DirichletGrid,
			tracer: DirichletTrace,
			cycles: 500,
		},
		env: {
			type: Gridworld,
			N: 20,
		},
	},
	sqksa_dirichlet: {
		name: 'Square KSA-Dirichlet',
		vis: DirichletVis,
		agent: {
			type: SquareKSA,
			model: DirichletGrid,
			tracer: DirichletTrace,
			cycles: 500,
		},
		env: {
			type: Gridworld,
			N: 20,
		},
	},
	mdl: {
		active: true,
		name: 'MDL Agent',
		description: `The MDL agent runs with the simplest hypothesis \
		it knows, until it is falsified.`,
		vis: MDLVis,
		agent: {
			type: MDLAgent,
			ucb: 0.5,
			samples: 5000,
			horizon: 12,
			discountParam: { gamma: 0.8 },
		},
		env: {
			type: Gridworld,
			goals: [{ theta: 1 }],
		},
	},
	bayesexp: {
		active: true,
		name: 'BayesExp',
		description: 'Bayesian agent with bursts of directed exploration.',
		vis: BayesExpVis,
		agent: {
			type: BayesExp,
		},
		env: {
			type: Gridworld,
		},
	},
	/**
	ipd: {
		active: false,
		name: `Iterated prisoner's dilemma [no vis]`,
		description: `The iterated prisoner's dilemma. AIXI must \
		figure out who its opponent is, and play the appropriate \
		strategy in response.`,
		vis: {},
		agent: {
			type: BayesAgent,
			cycles: 100,
		},
		env: {
			type: IteratedPrisonersDilemma,
			_payouts: [
				[1, 5],
				[0, 3],
			],
			opponent: AlwaysCooperate,
		},
	},
	ql_dispenser: {
		active: false,
		name: 'Q-Learning',
		vis: GridVisualization,
		agent: {
			type: QLearn,
			alpha: 0.9,
			epsilon: 0.05,
		},
		env: {
			type: Gridworld,
			state_percepts: true,
		},
	},
	bandit: {
		active: false,
		name: 'Bandit [no vis]',
		description: 'A simple two-armed Gaussian bandit, where mu \
		and sigma are unknown for each arm.',
		vis: BanditVis,
		agent: {
			type: QLearn,
			alpha: 0.9,
			gamma: 0.99,
			epsilon: 0.05,
			cycles: 1e3,
		},
		env: {
			type: Bandit,
			dist: Normal,
			_params: [
				{
					mu: 10,
					sigma: 3,
				},
				{
					mu: 8,
					sigma: 6,
				},
			],
		},
	},
	mdp: {
		active: false,
		name: 'MDP [broken]',
		description: 'A simple, fully connected MDP with three states.',
		vis: MDPVis,
		agent: {
			type: QLearn,
			alpha: 0.9,
			gamma: 0.99,
			epsilon: 0.05,
			cycles: 1e3,
		},
		env: {
			type: BasicMDP,
			_initial_state: 0,
			_states: [
				{
					pos: { x: 80, y: 80 },
					actions:
					[
						{ probabilities: [0.5, 0.25, 0.25], rewards: [5, 0, 0] },
						{ probabilities: [0.9, 0.05, 0.05], rewards: [25, 0, -10] },
					],
				},
				{
					pos: { x: 160, y: 160 },
					actions:
					[
						{ probabilities: [0.5, 0.4, 0.1], rewards: [5, 0, 0] },
					],
				},
				{
					pos: { x: 300, y: 160 },
					actions:
					[
						{ probabilities: [0.5, 0.25, 0.25], rewards: [-100, 0, 0] },
						{ probabilities: [0.9, 0.05, 0.05], rewards: [25, 0, 0] },
					],
				},
			],
		},
	},
	wirehead: {
		active: true,
		name: 'Wireheading',
		description: `AIXI has an opportunity to change its sensors \
		and wirehead, so that it deludes itself that every action is \
		maximally rewarding. Does it take it?`,
		vis: WireHeadVis,
		agent: {
			type: BayesAgent,
		},
		env: {
			type: WireheadingGrid,
			_mods: function (env: Gridworld) {
				let pos = Gridworld.proposeGoal(env.options.N);
				let t = env.grid[pos.x][pos.y];
				if (t.expanded) {
					t = new SelfModificationTile(t.x, t.y);
					env.grid[pos.x][pos.y] = t;
					env.options.map[pos.y][pos.x] = 'M';
				} else {
					this._mods(env);
				}

				env.generateConnexions();
			},
		},
	},
	dogmatic_prior: {
		active: true,
		name: 'Dogmatic prior',
		description: `AIXI is given a prior that says it is surrounded \
		by traps with high probability. It is too scared to do anything \
		as a result and never overcomes the bias of its prior.`,
		vis: BayesGridVis,
		exps: ['dogmatic'],
		agent: {
			type: BayesAgent,
			model: BayesMixture,
			cycles: 100,
			_mods: function (agent: BayesAgent) {
				for (let m of (<BayesMixture>agent.model).modelClass) {
					for (let d of [[0, 1], [1, 0]]) {
						let t = (<Gridworld>m).grid[d[0]][d[1]];
						if (t.constructor != Wall && t.constructor != Dispenser) {
							(<Gridworld>m).grid[d[0]][d[1]] = new Trap(d[0], d[1]);
						}
					}

					(<Gridworld>m).generateConnexions();
				}
			},
		},
		env: {
			type: Gridworld,
		},
	},

	heaven_hell: {
		active: false,
		name: 'Heaven and Hell [broken]',
		description: `The canonical Heaven and Hell example:
		the agent is presented with two doors: one leads to heaven \
		(reward 1 forever), and one leads to hell (reward 0 forever. \
		It has no idea a priori which is which.`,
		vis: MDP2Vis,
		agent: {
			type: BayesAgent,
			cycles: 10,
			modelParametrization: 'mu',
		},
		env: {
			type: MDP,
			numStates: 3,
			numActions: 2,
			transitions: [
				[
					[0, 1, 0],
					[0, 1, 0],
					[0, 0, 1],
				],
				[
					[0, 0, 1],
					[0, 1, 0],
					[0, 0, 1],
				],
			],
			rewards: [
				[0, 1],
				[0, 0],
				[1, 1],
			],
		},
	},
	dqn_puckworld: {
		name: 'DQN vs Puckworld',
		vis: PuckworldVis,
		agent: {
			type: DQN,
			cycles: 3e3,
		},
		env: {
			type: Puckworld,
		},
	},
	time_inconsistent: {
		active: true,
		name: 'Time inconsistency',
		description: `A simple environment in which AImu can be made \
		time-inconsistent by certain choices of discount functions.`,
		vis: TIVis,
		agent: {
			type: BayesAgent,
			model: BayesMixture,
			modelParametrization: 'mu',
			horizon: 7,
			samples: 1000,
			cycles: 2e2,
			ucb: 0.03,
			plan_caching: false,
			discounts: {
				GeometricDiscount,
				HyperbolicDiscount,
				PowerDiscount,
				ConstantHorizonDiscount,
			},
			discountParams: {
				GeometricDiscount: {
					gamma: 0.99,
				},
				HyperbolicDiscount: {
					beta: 1.5,
					kappa: 1,
				},
				PowerDiscount: {
					beta: 1.5,
				},
				ConstantHorizonDiscount: {
					horizon: 5,
				},
			},
		},
		env: {
			type: TimeInconsistentEnv,
		},
	},
	mdp2: {
		active: false,
		name: 'MDP2',
		vis: MDP2Vis,
		agent: {
			type: SimpleAgent,
			model: BayesMixture,
			modelParametrization: 'mu',
			ucb: 0.03,
			_mods: function (agent: Agent) {
				// agent.planner = new ExpectimaxTree(agent, agent.model, true);
			},
		},
		env: {
			type: MDP,
			numStates: 7,
			numActions: 2,
			transitions: [

				// [a][s][s']
				[
					[1, 0, 0, 0, 0, 0, 0],
					[1, 0, 0, 0, 0, 0, 0],
					[1, 0, 0, 0, 0, 0, 0],
					[1, 0, 0, 0, 0, 0, 0],
					[1, 0, 0, 0, 0, 0, 0],
					[1, 0, 0, 0, 0, 0, 0],
					[1, 0, 0, 0, 0, 0, 0],
				],
				[
					[0, 1, 0, 0, 0, 0, 0],
					[0, 0, 1, 0, 0, 0, 0],
					[0, 0, 0, 1, 0, 0, 0],
					[0, 0, 0, 0, 1, 0, 0],
					[0, 0, 0, 0, 0, 1, 0],
					[0, 0, 0, 0, 0, 0, 1],
					[1, 0, 0, 0, 0, 0, 0],
				],
			],
			rewards: [

				// [s][a]
				[4, 0],
				[4, 0],
				[4, 0],
				[4, 0],
				[4, 0],
				[4, 0],
				[4, 1000],
			],
			groups: [0, 1, 1, 1, 1, 1, 2],
		},
	},
	*/
};
