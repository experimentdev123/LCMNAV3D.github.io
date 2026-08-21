// Per-page SEO metadata. Titles target search intent; descriptions are 140-160 chars,
// complete sentences (never truncated), and describe what the page actually contains.
const SECTIONS = {
  gs:  { name: 'Getting Started',         href: 'index.html#part-i-getting-started' },
  gf:  { name: 'Going Further',           href: 'index.html#part-ii-going-further' },
  bt:  { name: 'Behaviour Tree Patterns', href: 'index.html#chapter-12-behaviour-tree-stock-patterns' },
  ref: { name: 'Reference',               href: 'index.html#part-iii-reference' },
  api: { name: 'Appendix',                href: 'index.html#part-iv-appendix' },
};

const PAGES = {
  'index.html': {
    crumb: null, section: null, nav: 'Overview',
    title: 'LCM Nav3D Documentation | 3D Pathfinding for Unreal Engine',
    desc: 'Production-grade volumetric 3D navigation for Unreal Engine 5. Sparse voxel octree pathfinding, GPU voxelization, 10,000+ Mass Entity agents and true-3D EQS.',
  },
  'nav3d-vs-recast.html': {
    crumb: 'Nav3D vs Recast', section: 'gs', nav: 'Nav3D vs Recast',
    title: 'Nav3D vs Recast Navmesh for Flying AI in Unreal Engine',
    desc: 'Why Unreal\'s Recast navmesh cannot represent open air, where each flying-AI workaround breaks down, and when volumetric SVO navigation is the right answer instead.',
    // Mirrors the "Common questions" section on the page. Structured data must
    // never assert anything the visible page does not.
    faq: [
      ['Can Unreal\'s navmesh handle flying AI at all?',
       'Only by approximating it. A navmesh describes a walkable surface, so any flying behaviour built on it is really surface navigation with an offset, or a set of stacked surfaces with hand-authored transitions. That is fine for a hover drone following terrain and inadequate for anything that has to choose its altitude.'],
      ['Do I have to choose between Recast and LCM Nav3D?',
       'No. They coexist in the same level and are designed to. Ground agents run on Recast, flying agents run on the sparse voxel octree, and a crowd avoidance bridge lets Unreal\'s Detour RVO crowd system see the flying agents.'],
      ['Why an octree instead of a simple 3D grid?',
       'Density. A uniform grid spends the same memory on empty sky as on solid geometry, and the cost grows with the cube of the extent. The octree is sparse: one node covers a large empty region and it only subdivides where there is something to subdivide around, so navigation data is driven by how cluttered the level is rather than how big it is.'],
      ['Does LCM Nav3D replace Unreal\'s navigation system?',
       'No, it sits beside it. Recast, Behavior Trees, StateTree, EQS, AI Perception, Mass and the Gameplay Debugger all keep working as they do now. LCM Nav3D adds tasks, tests, traits and a debugger category to them rather than substituting for them.'],
      ['Which Unreal Engine versions does LCM Nav3D support?',
       'Unreal Engine 5.2 to 5.8, on Windows 64-bit and Linux.'],
    ],
  },
  'installation.html': {
    crumb: 'Installation', section: 'gs', nav: "Installation",
    title: 'Install LCM Nav3D in Unreal Engine 5 - Fab or Manual Setup',
    desc: 'Step-by-step install of the LCM Nav3D plugin into an Unreal Engine 5.2-5.8 project, from Fab or by hand, plus how to verify the install with a demo map.',
  },
  'core-concepts.html': {
    crumb: 'Core Concepts', section: 'gs', nav: "Core concepts",
    title: 'Core Concepts: Sparse Voxel Octree Navigation | LCM Nav3D',
    desc: 'How LCM Nav3D carves empty air into a sparse voxel octree and paths through it. Covers the navigation manager actor, world extent, voxel size and clearance.',
  },
  'your-first-flying-agent.html': {
    crumb: 'Your First Flying Agent', section: 'gs', nav: "Your first flying agent",
    title: 'Your First Flying AI Agent in Unreal Engine | LCM Nav3D',
    desc: 'Build a pawn that flies through true 3D space to a goal in Unreal Engine, using a navigation manager, an AIController and one LCM Fly To task. No C++ needed.',
  },
  'statetree-agent.html': {
    crumb: 'The Same Agent in StateTree', section: 'gs', nav: "The same agent in StateTree",
    title: 'Flying AI with StateTree in Unreal Engine | LCM Nav3D',
    desc: 'Author identical 3D flight behaviour in StateTree instead of a Behavior Tree. Swap RunBehaviorTree for a StateTreeAIComponent and bind the Fly To task target.',
  },
  'dynamic-obstacles.html': {
    crumb: 'Dynamic Obstacles', section: 'gs', nav: "Dynamic obstacles",
    title: 'Dynamic Obstacles and Runtime Rerouting | LCM Nav3D',
    desc: 'Add a Dynamic Obstacle component to any moving actor. LCM Nav3D restamps the octree and agents reroute live around doors, platforms and destructible cover.',
  },
  'mass-entity-crowds.html': {
    crumb: 'Mass Entity Crowds', section: 'gf', nav: "Mass Entity crowds",
    title: 'Mass Entity Crowds: 10,000+ 3D Agents | LCM Nav3D',
    desc: 'Add one trait to a Mass Entity Config and a crowd navigates in full 3D through the Unreal ECS. No per-agent controller, no tick function and no code required.',
  },
  'tactical-eqs.html': {
    crumb: 'Tactical EQS in True 3D', section: 'gf', nav: "Tactical EQS in true 3D",
    title: 'True 3D Tactical EQS Queries in Unreal | LCM Nav3D',
    desc: 'LCM Nav3D ships EQS generators and tests that work in true 3D: candidate points anywhere in the navigable volume, scored by volumetric line-of-sight and cover.',
  },
  'ai-perception.html': {
    crumb: 'AI Perception', section: 'gf', nav: "AI perception",
    title: 'AI Perception to Volumetric Threat Tracking | LCM Nav3D',
    desc: "Wire Unreal's UAIPerceptionComponent into LCM Nav3D through the AI Perception Bridge, so perceived threats feed true-3D EQS queries for flanking and cover.",
  },
  'hybrid-recast.html': {
    crumb: 'Hybrid Recast + Nav3D', section: 'gf', nav: "Hybrid Recast + Nav3D",
    title: 'Hybrid Recast + 3D Navigation in One Level | LCM Nav3D',
    desc: 'Run walking agents on Recast and flying agents on the SVO in one level. The Crowd Avoidance Bridge lets Detour RVO steer Recast agents around LCM Nav3D pawns.',
  },
  'nav-links-and-areas.html': {
    crumb: 'Nav Links and Area Modifiers', section: 'gf', nav: "Nav links and area modifiers",
    title: '3D Nav Links and Volumetric Area Modifiers | LCM Nav3D',
    desc: 'Vertical ladders, jump shafts and teleporters via ULcmNavLinkComponent, plus volumetric cost overlays for water, storms and danger zones via NavArea modifiers.',
  },
  'gameplay-debugger.html': {
    crumb: 'The Gameplay Debugger', section: 'gf', nav: "The Gameplay Debugger",
    title: 'Reading Agent State in the Gameplay Debugger | LCM Nav3D',
    desc: "LCM Nav3D adds its own category to Unreal's stock Gameplay Debugger. Press the debugger key in PIE, pick an agent and read per-agent and plugin-wide state live.",
  },
  'bt-wait.html': {
    crumb: 'Wait', section: 'bt', nav: "Wait",
    title: 'BT Wait: Use the Stock UBTTask_Wait Node | LCM Nav3D',
    desc: "Unreal Engine's stock Wait task works as-is with LCM Nav3D flying agents. The pattern, why no plugin variant ships, and the one LCM Nav3D-specific alternative.",
  },
  'bt-is-at-location.html': {
    crumb: 'Is At Location', section: 'bt', nav: "Is At Location",
    title: 'BT IsAtLocation: Use the Stock UE5 Decorator | LCM Nav3D',
    desc: 'UBTDecorator_IsAtLocation already works on LCM Nav3D pawns. Three-step usage, why no plugin-specific variant exists, and when the path-finding variant helps.',
  },
  'bt-look-at.html': {
    crumb: 'Look At', section: 'bt', nav: "Look At",
    title: 'BT LookAt: Use UBTTask_RotateToFaceBBEntry | LCM Nav3D',
    desc: "Unreal's stock Rotate to Face BB Entry task covers both LookAt and TurnInPlace for LCM Nav3D agents. Setup, tuning and when a custom rotation task is worth it.",
  },
  'bt-turn-in-place.html': {
    crumb: 'Turn In Place', section: 'bt', nav: "Turn In Place",
    title: 'BT TurnInPlace: Stock Rotate + DefaultFocus | LCM Nav3D',
    desc: "Turn an LCM Nav3D agent in place with Unreal's stock rotation task, and hold facing during other tasks with the DefaultFocus service. Plus constant-rate turns.",
  },
  'bt-health-below.html': {
    crumb: 'Health Below', section: 'bt', nav: "Health Below",
    title: 'BT HealthBelow: Blackboard + Decorator Pattern | LCM Nav3D',
    desc: 'Unreal ships all you need: a Float blackboard key plus a Blackboard-Compare decorator. The pattern, a GameplayTag variant, and why no LCM Nav3D node ships.',
  },
  'bt-perception-relay.html': {
    crumb: 'Perception Relay', section: 'bt', nav: "Perception Relay",
    title: 'BT PerceptionRelay: Bind the Delegate Directly | LCM Nav3D',
    desc: 'UAIPerceptionComponent already emits perception updates as a delegate. Bind it in your AI controller and write to a blackboard key - no custom BT service needed.',
  },
  'bt-memory-decay.html': {
    crumb: 'Memory Decay', section: 'bt', nav: "Memory Decay",
    title: 'BT MemoryDecay: Use GetLastStimulusLocation | LCM Nav3D',
    desc: "Unreal's UAIPerceptionComponent already tracks per-actor last-known stimulus location with age. Use it as a BT service instead of a hand-rolled decay timer.",
  },
  'editor-tools.html': {
    crumb: 'Editor Tools', section: 'ref', nav: "Editor tools",
    title: 'Editor Tools: Wizard, Health Check, Auto-Tuner | LCM Nav3D',
    desc: 'Every LCM Nav3D panel behind the Nav3D toolbar button: the Welcome screen, Manager panel, Bake Volumes, Setup Wizard, Health Check and the Auto-Tuner.',
  },
  'settings.html': {
    crumb: 'Settings Reference', section: 'ref', nav: "Settings reference",
    title: 'Settings Reference: LcmNavigationManagerSVO | LCM Nav3D',
    desc: 'Every field on the LCM Nav3D navigation manager, with verified defaults and limits: setup, voxels, collision, performance, skeleton, debug and runtime state.',
  },
  'troubleshooting.html': {
    crumb: 'Troubleshooting', section: 'ref', nav: "Troubleshooting",
    title: 'Troubleshooting 3D Navigation Problems | LCM Nav3D',
    desc: 'LCM Nav3D problems in the order people hit them: agents that will not move, "no path found", ignored geometry, dead dynamic obstacles and performance issues.',
    // Answers are drawn verbatim from the Quick Triage table and sections 1-7 on
    // the page itself. Structured data must not assert anything the page does not.
    faq: [
      ['Why does my LCM Nav3D agent not move at all?',
       'The usual cause is that there is no navigation manager in the level. If the Output Log shows "LCMBTTask_FlyTo: No SVO Manager found in the level!", drag an LcmNavigationManagerSVO into the level - one per level, required. Then check that the AI possessed the pawn (Auto Possess AI is set, an AI Controller Class is assigned, and the controller actually runs the tree), that the pawn has a movement component supporting flight with a non-zero Max Speed, and that the goal was actually set.'],
      ['Why does LCM Nav3D report "no path found" through a gap I can clearly see?',
       'Clearance Padding sealed the opening. When Clearance Padding is close to Min Voxel Size, obstacle inflation fills narrow openings completely - a 2 m doorway with 100 cm voxels and 100 cm padding can vanish entirely. Lower Clearance Padding, or lower Min Voxel Size so the opening survives the inflation, then confirm with Draw Debug Volumes that free voxels run through the opening.'],
      ['Why do short paths work while long ones fail?',
       'This is almost always an infinite-world issue: the route crosses chunks that have not generated yet. Turn on Persistent Skeleton under section 5, Coarse Skeleton - it is off by default and is what allows long-range planning before the detail exists. For routing to be complete on the first frame, tick Use Baked Skeleton and click Bake Skeleton. Tick Assist Infinite Streaming on the Fly To task for agents that must traverse the frontier.'],
      ['Why do my agents fly straight through walls?',
       'If agents fly through a wall, the wall is not in the octree. Voxelization uses collision, not visual geometry, so a mesh set to No Collision is invisible to navigation. Check that the mesh has collision and that its channel is listed in Obstacle Query Channels under section 3, Collision.'],
      ['Why are my moving obstacles ignored by LCM Nav3D agents?',
       'The moving actor is missing the Dynamic Obstacle component. Add an LCM Nav3D Dynamic Obstacle component to any actor that should push agents aside as it moves.'],
      ['Why can I not find the LCM Nav3D demo maps?',
       'Show Plugin Content is switched off in the Content Browser. Enable it, and the worked examples appear under the plugin’s Content/Demo/ folder, grouped by Behaviour Tree, StateTree and Mass Entity.'],
      ['Why did my frame rate drop after adding LCM Nav3D?',
       'Voxel resolution is too fine. Raise Min Voxel Size - finer voxels multiply the node count sharply - and re-measure before tuning anything else.'],
      ['Why does my agent jitter or vibrate in place?',
       'Physics is fighting navigation. Set the mesh collision to No Collision to confirm that is the cause, then re-add collision carefully.'],
    ],
  },
  'flight-locomotion.html': {
    crumb: 'Flight and Locomotion', section: 'ref', nav: "Flight and locomotion",
    title: '6-DOF Flight and Swim Locomotion Reference | LCM Nav3D',
    desc: 'Physically plausible 6-DOF locomotion for drones, birds and fish, layered on LCM Nav3D guidance. Archetypes, the animation contract, tuning and determinism.',
  },
  'mass-traits.html': {
    crumb: 'Mass Traits Reference', section: 'ref', nav: "Mass traits reference",
    title: 'Mass Entity Trait Reference | LCM Nav3D',
    desc: 'Every LCM Nav3D Mass Entity trait, the combination matrix, the editor validator and the one rule you must not break: exactly one movement trait per agent.',
  },
  'api-reference.html': {
    crumb: 'API Reference', section: 'api', nav: "API reference",
    title: 'API Reference: Blueprint, BT, StateTree, Mass | LCM Nav3D',
    desc: 'Every LCM Nav3D class, function and property you can reach from Blueprint, the Details panel, a Behaviour Tree, a StateTree or a Mass Entity config.',
  },
};

// Sidebar order and grouping. build.js renders the sidebar and the prev/next pager
// from this, into every page - so adding a document means adding it here and to
// PAGES above, and nothing else needs hand-editing.
const NAV = [
  { heading: 'Start here', items: ['index.html', 'nav3d-vs-recast.html'] },
  { heading: 'Getting started', items: [
    'installation.html', 'core-concepts.html', 'your-first-flying-agent.html',
    'statetree-agent.html', 'dynamic-obstacles.html'] },
  { heading: 'Going further', items: [
    'mass-entity-crowds.html', 'tactical-eqs.html', 'ai-perception.html',
    'hybrid-recast.html', 'nav-links-and-areas.html', 'gameplay-debugger.html'] },
  { heading: 'Behaviour Tree patterns', items: [
    'bt-wait.html', 'bt-is-at-location.html', 'bt-look-at.html', 'bt-turn-in-place.html',
    'bt-health-below.html', 'bt-perception-relay.html', 'bt-memory-decay.html'] },
  { heading: 'Reference', items: [
    'editor-tools.html', 'settings.html', 'troubleshooting.html',
    'flight-locomotion.html', 'mass-traits.html', 'api-reference.html'] },
];

module.exports = { PAGES, SECTIONS, NAV };
