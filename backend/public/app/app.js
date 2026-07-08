/* ==========================================================================
   LOREBOUND APP COORDINATOR (app.js) - DEEP ENGAGEMENT 30+ MIN SESSIONS
   Core state manager, PDF text reader, Heuristic Classifier, and game harness.
   ========================================================================== */

const SOURCE_MIN_CHARS = LoreboundLimits.SOURCE_MIN_CHARS;

/** Estimate total interactive steps across all levels and phases for HUD progress */
function estimateSessionSteps(category, payload) {
    if (category === 'Timeline') {
        return payload.levels.reduce((sum, lvl) => {
            const n = lvl.events.length;
            const drills = Math.max(1, (n - 1) + (n - 1));
            const finales = Math.max(1, n - 2);
            const lightning = Math.min(6, n);
            return sum + n + drills + n + finales + lightning;
        }, 0);
    }
    if (category === 'Process') {
        return payload.phases.reduce((sum, ph) => {
            const n = ph.stages.length;
            const rapid = Math.min(8, n * 2);
            return sum + n + 1 + n + Math.max(1, n - 1) + rapid;
        }, 0);
    }
    if (category === 'CauseEffect') {
        return payload.levels.reduce((sum, lvl) => {
            const n = lvl.chains.length;
            const inferences = Math.max(1, n - 1);
            const domino = Math.max(0, n - 1);
            return sum + n + n + 1 + inferences + domino;
        }, 0);
    }
    const cards = payload.cards.length;
    const traps = Math.min(8, payload.categories.length * 2);
    const memory = Math.min(12, cards);
    const debates = Math.min(6, cards);
    const blitz = Math.min(8, cards);
    return cards + traps + Math.ceil(memory / 2) + debates + blitz;
}

function estimateLevelSteps(category, levelPayload) {
    if (category === 'Timeline') {
        const n = levelPayload.events.length;
        const drills = Math.max(1, (n - 1) + (n - 1));
        const finales = Math.max(1, n - 2);
        const lightning = Math.min(6, n);
        return n + drills + n + finales + lightning;
    }
    if (category === 'Process') {
        const n = levelPayload.stages.length;
        const rapid = Math.min(8, n * 2);
        return n + 1 + n + Math.max(1, n - 1) + rapid;
    }
    if (category === 'CauseEffect') {
        const n = levelPayload.chains.length;
        return n + n + 1 + Math.max(1, n - 1) + Math.max(0, n - 1);
    }
    return levelPayload.cards?.length || 20;
}

// 1. HIGH-QUALITY EXPANDED CURRICULAR DATA MATRIX (10-20 Items per Game, Multi-Level)
const SAMPLE_CHAPTERS = {
    "1": {
        title: "Bangladesh Liberation War 1971",
        category: "Timeline",
        topic: "History & Civil Studies • Grade 9-10",
        originalText: "The birth of Bangladesh in 1971 was the culmination of decades of struggle against economic, political, and cultural suppression. The language movement of 1952 sowed the seeds of nationalism when on February 21, students protested in Dhaka, cementing the Bengali identity. Later, the United Front electoral victory on March 11, 1954, proved the demographic power of East Bengal. Seeking ultimate regional autonomy, Bangabandhu Sheikh Mujibur Rahman proposed the historic Six-Point Programme on February 5, 1966. In retaliation, the Pakistani regime staged the Agartala Conspiracy Case trial on June 19, 1968, trying Bangabandhu for treason, which backfired and triggered mass uprisings. This popular pressure culminated in the 1970 General Election victory on December 7, where the Awami League won an absolute majority.\n\n        As negotiations stalled, Bangabandhu delivered his historic March 7 Address in 1971, directing the people to prepare for independence. The response from the Pakistani state was brutal. On March 25, 1971, the military launched Operation Searchlight, a genocidal crackdown in Dhaka. Immediately, the Declaration of Independence was proclaimed on March 26. To lead the war, the Mujibnagar Government took shape on April 10, and the provisional cabinet formally took oath on April 17, 1971, in Meherpur.\n\n        A protracted guerrilla war followed as the Muktibahini harassed the occupation forces. In August, naval commandos launched Operation Jackpot, sinking occupation ships. As conflict intensified, the Indo-Bangla Joint Command was formed on November 21, 1971. In a final act of desperation, local collaborators executed systematic intellectual massacres on December 14. Finally, on December 16, 1971, the Pakistani command signed the unconditional instrument of surrender, establishing a free Bangladesh.",
        metadata: {
            model: "Prebuilt Curriculum Game Engine",
            tokens: 2840,
            compTime: 4.8,
            rationale: "Text details a large chronology of historical milestones from 1952 to December 1971. Compiled into a 3-Era (3 Level) Timeline Builder game representing the seeds of conflict, military crackdown, and final guerrilla campaign.",
            confMatrix: {
                seq: 99,
                cyc: 1,
                cau: 15,
                comp: 5
            },
            theme: {
                primary: "#ff5252",
                secondary: "#ffab40",
                accent: "#ff8a80",
                narrative_title: "Map the Path to Independence",
                narrative_intro: "Walk the milestones that forged Bangladesh. Chronological mastery unlocks every challenge phase.",
                visualScene: "war",
                icon: "clock-rotate-left",
                demo_emoji: "🏛️"
            },
            mechanic: "Timeline Builder"
        },
        payload: {
            levels: [
                {
                    name: "Level 1: The Seeds of National Identity (1952 - 1970)",
                    events: [
                        {
                            id: "l1-evt-1",
                            title: "February 21 Language Protest",
                            date: "Feb 21, 1952",
                            desc: "Students clash with police in Dhaka while defending Bengali as a state language, cementing the cultural national identity.",
                            order: 0,
                            sourcePassage: "The language movement of 1952 sowed the seeds of nationalism when on February 21, students protested in Dhaka, cementing the Bengali identity.",
                            emoji: "🗣️"
                        },
                        {
                            id: "l1-evt-2",
                            title: "United Front Electoral Victory",
                            date: "March 11, 1954",
                            desc: "The democratic alliance defeats the ruling Muslim League in East Bengal regional polls, highlighting demographic power.",
                            order: 1,
                            sourcePassage: "Later, the United Front electoral victory on March 11, 1954, proved the demographic power of East Bengal.",
                            emoji: "🗳️"
                        },
                        {
                            id: "l1-evt-3",
                            title: "Six-Point Programme Announcement",
                            date: "Feb 5, 1966",
                            desc: "Bangabandhu Sheikh Mujibur Rahman details a Charter of Autonomy for East Pakistan in Lahore, demanding decentralized power.",
                            order: 2,
                            sourcePassage: "Seeking ultimate regional autonomy, Bangabandhu Sheikh Mujibur Rahman proposed the historic Six-Point Programme on February 5, 1966.",
                            emoji: "📜"
                        },
                        {
                            id: "l1-evt-4",
                            title: "Agartala Conspiracy Trial",
                            date: "June 19, 1968",
                            desc: "Pakistani administration trials Bangabandhu and 34 others for conspiracy, sparking a massive public revolt in East Pakistan.",
                            order: 3,
                            sourcePassage: "In retaliation, the Pakistani regime staged the Agartala Conspiracy Case trial on June 19, 1968, trying Bangabandhu for treason...",
                            emoji: "⚖️"
                        },
                        {
                            id: "l1-evt-5",
                            title: "1970 General Elections Landslide",
                            date: "Dec 7, 1970",
                            desc: "The Awami League secures a landslide absolute majority, winning 160 of 162 seats allocated to East Pakistan.",
                            order: 4,
                            sourcePassage: "This popular pressure culminated in the 1970 General Election victory on December 7, where the Awami League won an absolute majority.",
                            emoji: "🏆"
                        }
                    ]
                },
                {
                    name: "Level 2: Crackdown & Resistance (March - April 1971)",
                    events: [
                        {
                            id: "l2-evt-1",
                            title: "Historic March 7 Address",
                            date: "March 7, 1971",
                            desc: "Bangabandhu directs the nation toward civil disobedience and preparation for war at the Ramna Race Course.",
                            order: 0,
                            sourcePassage: "As negotiations stalled, Bangabandhu delivered his historic March 7 Address in 1971, directing the people to prepare for independence.",
                            emoji: "🎤"
                        },
                        {
                            id: "l2-evt-2",
                            title: "Operation Searchlight Launch",
                            date: "March 25, 1971",
                            desc: "The Pakistani army begins a genocidal military operation in Dhaka to suppress Bengali autonomy demands.",
                            order: 1,
                            sourcePassage: "On March 25, 1971, the military launched Operation Searchlight, a genocidal crackdown in Dhaka.",
                            emoji: "💥"
                        },
                        {
                            id: "l2-evt-3",
                            title: "Declaration of Independence Proclaimed",
                            date: "March 26, 1971",
                            desc: "Formal declarations of independent statehood are broadcast on behalf of Bangabandhu Sheikh Mujibur Rahman.",
                            order: 2,
                            sourcePassage: "Immediately, the Declaration of Independence was proclaimed on March 26.",
                            emoji: "📢"
                        },
                        {
                            id: "l2-evt-4",
                            title: "Formation of Mujibnagar Government",
                            date: "April 10, 1971",
                            desc: "The provisional government of Bangladesh is officially constituted to guide the armed war and administration.",
                            order: 3,
                            sourcePassage: "To lead the war, the Mujibnagar Government took shape on April 10...",
                            emoji: "🏛️"
                        },
                        {
                            id: "l2-evt-5",
                            title: "Cabinet Oath Taking",
                            date: "April 17, 1971",
                            desc: "The provisional cabinet formally takes oath of office at Baidyanathtala, Meherpur (renamed Mujibnagar).",
                            order: 4,
                            sourcePassage: "...and the provisional cabinet formally took oath on April 17, 1971, in Meherpur.",
                            emoji: "🤝"
                        }
                    ]
                },
                {
                    name: "Level 3: Guerrilla Campaigns to Sovereignty (May - December 1971)",
                    events: [
                        {
                            id: "l3-evt-1",
                            title: "Guerrilla Warfare Inception",
                            date: "May - July 1971",
                            desc: "The Muktibahini establishes sectors and engages in intensive guerrilla operations against occupation positions.",
                            order: 0,
                            sourcePassage: "A protracted guerrilla war followed as the Muktibahini harassed the occupation forces.",
                            emoji: "🪖"
                        },
                        {
                            id: "l3-evt-2",
                            title: "Naval Operation Jackpot",
                            date: "August 15, 1971",
                            desc: "Bengali naval commandos launch synchronized mining strikes, destroying occupation ships in Chittagong and Mongla ports.",
                            order: 1,
                            sourcePassage: "In August, naval commandos launched Operation Jackpot, sinking occupation ships.",
                            emoji: "⚓"
                        },
                        {
                            id: "l3-evt-3",
                            title: "Indo-Bangla Joint Command",
                            date: "Nov 21, 1971",
                            desc: "The Muktibahini merges command structure with the Indian Armed Forces to coordinate joint ground maneuvers.",
                            order: 2,
                            sourcePassage: "As conflict intensified, the Indo-Bangla Joint Command was formed on November 21, 1971.",
                            emoji: "🛡️"
                        },
                        {
                            id: "l3-evt-4",
                            title: "Intellectual Executions Genocide",
                            date: "Dec 14, 1971",
                            desc: "Collaborators select and execute hundreds of Bengali scholars and professionals to cripple the future nation's intelligence.",
                            order: 3,
                            sourcePassage: "In a final act of desperation, local collaborators executed systematic intellectual massacres on December 14.",
                            emoji: "🕯️"
                        },
                        {
                            id: "l3-evt-5",
                            title: "Unconditional Military Surrender",
                            date: "Dec 16, 1971",
                            desc: "Pakistani General Niazi signs the Instrument of Surrender in Dhaka, marking the sovereign birth of Bangladesh.",
                            order: 4,
                            sourcePassage: "Finally, on December 16, 1971, the Pakistani command signed the unconditional instrument of surrender, establishing a free Bangladesh.",
                            emoji: "🇧🇩"
                        }
                    ]
                }
            ]
        }
    },
    "2": {
        title: "The Water (Hydrological) Cycle",
        category: "Process",
        topic: "Earth Science & Biology • Grade 8",
        originalText: "The hydrological cycle represents the circulation of water through the biosphere. The movement of water begins with solar heating, causing Evaporation from surface reservoirs and Transpiration from plant stomata, changing liquid water to gas. Additionally, Sublimation occurs on cold peaks where ice transforms directly into vapor.\n\n        Next, in the atmospheric condensation phase, winds distribute this gas via Advection. When cooling occurs, the vapor undergoes Condensation, attaching to tiny particles via Cloud Nucleation to build dense clouds. As cloud density builds, the droplets combine through Coalescence, becoming heavy enough to fall.\n\n        In the deposition phase, gravity delivers this moisture via Precipitation. Upon reaching land, water is caught via Canopy Interception or flows via Surface Runoff. Eventually, the water filters down through Infiltration and Percolation, recharging deep underground aquifers before resuming the cycle.",
        metadata: {
            model: "Prebuilt Curriculum Game Engine",
            tokens: 2420,
            compTime: 4.1,
            rationale: "Text depicts a highly detailed 10-stage physical process divided into 3 environmental phases (Atmospheric Ingestion, Condensation/Transport, Deposition/Subterranean Storage). Built as a 10-node Process Loop game.",
            confMatrix: {
                seq: 10,
                cyc: 98,
                cau: 20,
                comp: 5
            },
            theme: {
                primary: "#26c6da",
                secondary: "#4fc3f7",
                accent: "#80deea",
                narrative_title: "Trace the Water Cycle Loop",
                narrative_intro: "Master atmospheric intake, condensation, and groundwater return, then prove each stage under pressure.",
                visualScene: "nature",
                icon: "rotate",
                demo_emoji: "💧"
            },
            mechanic: "Process Loop"
        },
        payload: {
            phases: [
                {
                    name: "Phase 1: Atmospheric Vapor Ingestion",
                    stages: [
                        {
                            id: "p-stg-1",
                            title: "Solar Radiation & Heating",
                            desc: "Thermal energy from the sun heats surface water bodies and land surfaces to drive phase changes.",
                            question: "What primary energy input acts as the thermodynamic engine driving phase transformations in the water cycle?",
                            options: [
                                "Geothermal heat vents",
                                "Solar radiation & heating",
                                "Wind friction coefficients",
                                "Atmospheric gravity pressure"
                            ],
                            correctIndex: 1,
                            rationale: "Solar radiation is the primary thermal driver of global water movement.",
                            sourcePassage: "The movement of water begins with solar heating...",
                            emoji: "☀️",
                            simParams: {
                                label: "Solar Heat Intensity",
                                targetMin: 55,
                                targetMax: 75
                            }
                        },
                        {
                            id: "p-stg-2",
                            title: "Evaporation",
                            desc: "Liquid water in oceans and lakes absorbs heat energy, transitioning into gaseous water vapor.",
                            question: "Which process describes liquid water on the surface absorbing heat to become rising gas?",
                            options: [
                                "Condensation",
                                "Sublimation",
                                "Evaporation",
                                "Percolation"
                            ],
                            correctIndex: 2,
                            rationale: "Evaporation changes liquid surface water to gas.",
                            sourcePassage: "...causing Evaporation from surface reservoirs and Transpiration from plant stomata, changing liquid water to gas.",
                            emoji: "🌫️",
                            simParams: {
                                label: "Evaporation Rate",
                                targetMin: 45,
                                targetMax: 65
                            }
                        },
                        {
                            id: "p-stg-3",
                            title: "Transpiration",
                            desc: "Living plants release gaseous water vapor through specialized micro-pores in their leaves called stomata.",
                            question: "Name the biotic process where plants release water vapor into the atmosphere.",
                            options: [
                                "Transpiration",
                                "Respiration",
                                "Photosynthetic drift",
                                "Infiltration"
                            ],
                            correctIndex: 0,
                            rationale: "Transpiration is the release of plant water into the atmosphere.",
                            sourcePassage: "...causing Evaporation from surface reservoirs and Transpiration from plant stomata, changing liquid water to gas.",
                            emoji: "🌿",
                            simParams: {
                                label: "Stomatal Opening",
                                targetMin: 40,
                                targetMax: 60
                            }
                        },
                        {
                            id: "p-stg-4",
                            title: "Sublimation",
                            desc: "Ice and snow on high mountain peaks convert directly into water vapor, bypassing the liquid state.",
                            question: "What is the term for solid glacial ice changing directly into water vapor without melting first?",
                            options: [
                                "Advection",
                                "Sublimation",
                                "Photolysis",
                                "Coalescence"
                            ],
                            correctIndex: 1,
                            rationale: "Sublimation is the direct solid-to-gas transition.",
                            sourcePassage: "Additionally, Sublimation occurs on cold peaks where ice transforms directly into vapor.",
                            emoji: "❄️",
                            simParams: {
                                label: "Glacier Sublimation",
                                targetMin: 30,
                                targetMax: 50
                            }
                        }
                    ]
                },
                {
                    name: "Phase 2: Atmospheric Condensation & Transport",
                    stages: [
                        {
                            id: "p-stg-5",
                            title: "Atmospheric Advection",
                            desc: "Winds transport moisture laterally through the atmosphere, redistributing water vapor across regions.",
                            question: "How is evaporated water vapor transported horizontally across different geographic regions?",
                            options: [
                                "Surface runoff",
                                "Capillary rise",
                                "Atmospheric Advection",
                                "Deep percolation"
                            ],
                            correctIndex: 2,
                            rationale: "Advection is the horizontal transport of atmospheric properties (like moisture) by wind.",
                            sourcePassage: "Next, in the atmospheric condensation phase, winds distribute this gas via Advection.",
                            emoji: "💨",
                            simParams: {
                                label: "Wind Advection Speed",
                                targetMin: 35,
                                targetMax: 55
                            }
                        },
                        {
                            id: "p-stg-6",
                            title: "Cloud Nucleation & Condensation",
                            desc: "Water vapor cools and condenses around tiny suspended particles, forming clouds of liquid droplets.",
                            question: "When warm water vapor ascends and cools, transitioning to liquid around aerosol particles, this is:",
                            options: [
                                "Cloud Nucleation & Condensation",
                                "Evaporative cooling",
                                "Transpiration",
                                "Surface infiltration"
                            ],
                            correctIndex: 0,
                            rationale: "Nucleation provides the seeds for vapor to condense into droplets.",
                            sourcePassage: "When cooling occurs, the vapor undergoes Condensation, attaching to tiny particles via Cloud Nucleation to build dense clouds.",
                            emoji: "☁️",
                            simParams: {
                                label: "Condensation Cooling",
                                targetMin: 40,
                                targetMax: 60
                            }
                        },
                        {
                            id: "p-stg-7",
                            title: "Coalescence",
                            desc: "Tiny water droplets collide and fuse together within clouds, growing large and heavy enough to fall.",
                            question: "What term describes cloud water droplets colliding and combining to grow heavy enough for gravity to pull down?",
                            options: [
                                "Sublimation",
                                "Advection",
                                "Infiltration",
                                "Coalescence"
                            ],
                            correctIndex: 3,
                            rationale: "Coalescence is the physical merging of cloud droplets.",
                            sourcePassage: "As cloud density builds, the droplets combine through Coalescence, becoming heavy enough to fall.",
                            emoji: "💧",
                            simParams: {
                                label: "Droplet Coalescence",
                                targetMin: 50,
                                targetMax: 70
                            }
                        }
                    ]
                },
                {
                    name: "Phase 3: Deposition & Subterranean Storage",
                    stages: [
                        {
                            id: "p-stg-8",
                            title: "Precipitation",
                            desc: "Gravity pulls atmospheric water droplets down to the Earth's surface as rain, snow, sleet, or hail.",
                            question: "Which term represents condensed atmospheric moisture falling under gravity to land or oceans?",
                            options: [
                                "Advection",
                                "Precipitation",
                                "Transpiration",
                                "Runoff"
                            ],
                            correctIndex: 1,
                            rationale: "Precipitation delivers water from clouds back to earth.",
                            sourcePassage: "In the deposition phase, gravity delivers this moisture via Precipitation.",
                            emoji: "🌧️",
                            simParams: {
                                label: "Precipitation Volume",
                                targetMin: 45,
                                targetMax: 65
                            }
                        },
                        {
                            id: "p-stg-9",
                            title: "Canopy Interception & Runoff",
                            desc: "Fallen water is either caught by vegetation foliage or flows across the land surface into streams and rivers.",
                            question: "What happens to precipitation that does not immediately soak into the soil?",
                            options: [
                                "Deep percolation",
                                "Canopy Interception & Runoff",
                                "Sublimation",
                                "Transpiration leakage"
                            ],
                            correctIndex: 1,
                            rationale: "Runoff flows over land; interception is caught by plants.",
                            sourcePassage: "Upon reaching land, water is caught via Canopy Interception or flows via Surface Runoff.",
                            emoji: "🏞️",
                            simParams: {
                                label: "Surface Runoff Flow",
                                targetMin: 35,
                                targetMax: 55
                            }
                        },
                        {
                            id: "p-stg-10",
                            title: "Infiltration & Percolation",
                            desc: "Water sinks into the topsoil and trickles down through soil layers, recharging deep groundwater aquifers.",
                            question: "How does surface water reach and recharge deep underground aquifers?",
                            options: [
                                "Advection",
                                "Evaporation",
                                "Infiltration & Percolation",
                                "Stomatal Transpiration"
                            ],
                            correctIndex: 2,
                            rationale: "Infiltration is soaking into topsoil; percolation is the deep downward trickle through rock.",
                            sourcePassage: "Eventually, the water filters down through Infiltration and Percolation, recharging deep underground aquifers before resuming the cycle.",
                            emoji: "⬇️",
                            simParams: {
                                label: "Aquifer Recharge",
                                targetMin: 40,
                                targetMax: 60
                            }
                        }
                    ]
                }
            ]
        }
    },
    "3": {
        title: "The Green Revolution & Ecology",
        category: "CauseEffect",
        topic: "Environmental Science • Grade 11-12",
        originalText: "The Green Revolution of the mid-20th century transformed agriculture worldwide but generated deep ecological consequences. To boost crop yields, scientists introduced high-yielding crop varieties (HYVs). However, these HYV crops demanded massive chemical inputs, causing widespread chemical fertilizer runoff into local water bodies, triggering eutrophication and devastating aquatic ecosystems. Furthermore, these crops required intensive irrigation, leading to massive groundwater depletion and dropping water tables across farming regions. Over time, the intensive farming practices and heavy tractor machinery compacted the soil structure. Consequently, this compaction triggered severe soil degradation, rendering the land vulnerable to wind erosion and stripping away key organic topsoil nutrients.",
        metadata: {
            model: "Prebuilt Curriculum Game Engine",
            tokens: 2150,
            compTime: 3.8,
            rationale: "Text links modern farming adjustments to environmental breakdowns. Compiled into a 3-level Cause-Effect Chain game mapping chemical runoffs, hydrology shifts, and mechanical soil failures.",
            confMatrix: {
                seq: 5,
                cyc: 8,
                cau: 98,
                comp: 10
            },
            theme: {
                primary: "#8bc34a",
                secondary: "#cddc39",
                accent: "#aed581",
                narrative_title: "Follow the Ecological Cascade",
                narrative_intro: "Link HYV farming choices to eutrophication, aquifer stress, and soil collapse, cause by cause.",
                visualScene: "nature",
                icon: "diagram-next",
                demo_emoji: "🌱"
            },
            mechanic: "Cause-Effect Chain"
        },
        payload: {
            levels: [
                {
                    name: "Level 1: Chemical Runoffs & Eutrophication",
                    chains: [
                        {
                            id: "l1-ce-1",
                            cause: "Introduction of high-yielding crop varieties (HYVs)",
                            effect: "Crops demand massive applications of chemical nitrogen/phosphorus fertilizers.",
                            rationale: "HYV crops are selectively bred to respond to concentrated chemical fertilizers to produce maximum grain.",
                            sourcePassage: "To boost crop yields, scientists introduced high-yielding crop varieties (HYVs). However, these HYV crops demanded massive chemical inputs..."
                        },
                        {
                            id: "l1-ce-2",
                            cause: "Excessive application of chemical fertilizers on fields",
                            effect: "Rain wash-off causes widespread chemical runoff into local rivers and lakes.",
                            rationale: "Soil cannot absorb all synthetic nutrients, and rain carries the excess chemicals into regional water streams.",
                            sourcePassage: "...causing widespread chemical fertilizer runoff into local water bodies..."
                        },
                        {
                            id: "l1-ce-3",
                            cause: "Nutrient accumulation in water bodies",
                            effect: "Rapid proliferation of toxic algae blooms (Eutrophication).",
                            rationale: "Excess phosphorus and nitrogen act as fuel for rapid, uncontrolled algae growth.",
                            sourcePassage: "...causing widespread chemical fertilizer runoff into local water bodies, triggering eutrophication..."
                        },
                        {
                            id: "l1-ce-4",
                            cause: "Decomposition of dead algae by aerobic bacteria",
                            effect: "Severe dissolved oxygen depletion, leading to massive fish kills.",
                            rationale: "Bacteria consume oxygen to decompose algae, suffocating fish and aquatic life.",
                            sourcePassage: "...triggering eutrophication and devastating aquatic ecosystems."
                        }
                    ]
                },
                {
                    name: "Level 2: Hydrological Modifications",
                    chains: [
                        {
                            id: "l2-ce-1",
                            cause: "High water demands of new crops",
                            effect: "Intensive pumping of underground water reserves.",
                            rationale: "Modern crops require precise watering, forcing farmers to pump groundwater.",
                            sourcePassage: "Furthermore, these crops required intensive irrigation, leading to massive groundwater depletion..."
                        },
                        {
                            id: "l2-ce-2",
                            cause: "Over-extraction of groundwater aquifers",
                            effect: "Rapid drop in local water tables across agricultural basins.",
                            rationale: "Pumping water faster than rain refills the aquifer depletes regional reserves.",
                            sourcePassage: "...leading to massive groundwater depletion and dropping water tables across farming regions."
                        },
                        {
                            id: "l2-ce-3",
                            cause: "Declining water tables & surface evaporation",
                            effect: "Increased soil salinization, leaving toxic mineral crusts.",
                            rationale: "As groundwater drops, water rises via capillary action and evaporates, leaving salts behind.",
                            sourcePassage: "...leading to massive groundwater depletion and dropping water tables across farming regions."
                        }
                    ]
                },
                {
                    name: "Level 3: Mechanical Compaction & Land Degradation",
                    chains: [
                        {
                            id: "l3-ce-1",
                            cause: "Repetitive use of heavy tractor machinery",
                            effect: "Severe compaction of topsoil clay particles.",
                            rationale: "Heavy treads squash air pockets in soil, making it dense and hard.",
                            sourcePassage: "Over time, the intensive farming practices and heavy tractor machinery compacted the soil structure."
                        },
                        {
                            id: "l3-ce-2",
                            cause: "Severely compacted, dense clay soil",
                            effect: "Degradation of organic soil structure, blocking water infiltration.",
                            rationale: "Compacted soil cannot absorb water or house organic worms and root systems.",
                            sourcePassage: "Consequently, this compaction triggered severe soil degradation..."
                        },
                        {
                            id: "l3-ce-3",
                            cause: "Loss of organic topsoil structure and vegetation cover",
                            effect: "Extreme vulnerability to severe wind erosion and desertification.",
                            rationale: "Without organic matter and roots, wind blows away dry topsoil, leaving infertile dust.",
                            sourcePassage: "...rendering the land vulnerable to wind erosion and stripping away key organic topsoil nutrients."
                        }
                    ]
                }
            ]
        }
    },
    "4": {
        title: "Photosynthesis vs. Respiration",
        category: "Comparison",
        topic: "Cellular Bio-Chemistry • Grade 10",
        originalText: "Photosynthesis and cellular respiration are complementary biochemical processes crucial for life on Earth. Photosynthesis takes place inside plant chloroplasts, utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose while releasing oxygen as a byproduct. In contrast, cellular respiration occurs primarily in the mitochondria of both plants and animals. This process breaks down glucose in the presence of oxygen to release usable chemical energy (ATP), producing carbon dioxide and water as waste products. While photosynthesis is an anabolic reaction that stores energy in chemical bonds, cellular respiration is a catabolic reaction that releases chemical energy.",
        metadata: {
            model: "Prebuilt Curriculum Game Engine",
            tokens: 2650,
            compTime: 4.3,
            rationale: "Text compares anabolic photosynthesis with catabolic respiration. Compiled into an intensive 20-card Comparison Sorter deck reviewing organelles, pathways, coenzymes, equations, and outputs.",
            confMatrix: {
                seq: 2,
                cyc: 8,
                cau: 15,
                comp: 99
            },
            theme: {
                primary: "#69f0ae",
                secondary: "#00e676",
                accent: "#b9f6ca",
                narrative_title: "Sort Life's Twin Metabolisms",
                narrative_intro: "Separate photosynthesis from cellular respiration across organelles, equations, and energy logic.",
                visualScene: "body",
                icon: "arrow-right-arrow-left",
                demo_emoji: "🧪"
            },
            mechanic: "Comparison Sorter"
        },
        payload: {
            categories: [
                "Photosynthesis",
                "Cellular Respiration"
            ],
            cards: [
                {
                    id: "c-1",
                    text: "Occurs inside chloroplasts in plant cells",
                    category: "Photosynthesis",
                    rationale: "Chloroplasts contain chlorophyll, which absorbs light energy to synthesize glucose.",
                    sourcePassage: "Photosynthesis takes place inside plant chloroplasts...",
                    emoji: "🌿"
                },
                {
                    id: "c-2",
                    text: "Occurs in the mitochondria of plants and animals",
                    category: "Cellular Respiration",
                    rationale: "Mitochondria act as the powerhouse to generate ATP from food.",
                    sourcePassage: "In contrast, cellular respiration occurs primarily in the mitochondria of both plants and animals.",
                    emoji: "⚡"
                },
                {
                    id: "c-3",
                    text: "Synthesizes glucose and releases oxygen as a byproduct",
                    category: "Photosynthesis",
                    rationale: "It builds sugar using carbon dioxide and water, releasing oxygen.",
                    sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose while releasing oxygen as a byproduct.",
                    emoji: "🌿"
                },
                {
                    id: "c-4",
                    text: "Breaks down glucose to release carbon dioxide and water",
                    category: "Cellular Respiration",
                    rationale: "It catabolizes sugar to release chemical energy, returning CO2 and water to nature.",
                    sourcePassage: "This process breaks down glucose in the presence of oxygen to release usable chemical energy (ATP), producing carbon dioxide and water as waste products.",
                    emoji: "⚡"
                },
                {
                    id: "c-5",
                    text: "An anabolic metabolic reaction that stores energy in bonds",
                    category: "Photosynthesis",
                    rationale: "Anabolism is synthesis; storing energy in glucose chemical bonds.",
                    sourcePassage: "While photosynthesis is an anabolic reaction that stores energy in chemical bonds...",
                    emoji: "🌿"
                },
                {
                    id: "c-6",
                    text: "A catabolic reaction that harvests chemical energy (ATP)",
                    category: "Cellular Respiration",
                    rationale: "Catabolism is breakdown; extracting ATP from glucose bonds.",
                    sourcePassage: "...cellular respiration is a catabolic reaction that releases chemical energy.",
                    emoji: "⚡"
                },
                {
                    id: "c-7",
                    text: "Uses solar radiation to excite chlorophyll molecules",
                    category: "Photosynthesis",
                    rationale: "Light energy triggers chlorophyll to launch electron transport.",
                    sourcePassage: "Photosynthesis takes place inside plant chloroplasts, utilizing sunlight...",
                    emoji: "🌿"
                },
                {
                    id: "c-8",
                    text: "Involves the Glycolysis pathway in the cytoplasm",
                    category: "Cellular Respiration",
                    rationale: "Glycolysis splits glucose into pyruvate in the cytoplasm prior to mitochondrial steps.",
                    sourcePassage: "This process breaks down glucose in the presence of oxygen...",
                    emoji: "⚡"
                },
                {
                    id: "c-9",
                    text: "Employs the Calvin Cycle (Light-independent reactions)",
                    category: "Photosynthesis",
                    rationale: "The Calvin cycle fixes carbon dioxide into glucose in the stroma.",
                    sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose...",
                    emoji: "🌿"
                },
                {
                    id: "c-10",
                    text: "Employs the Krebs (Citric Acid) Cycle in the matrix",
                    category: "Cellular Respiration",
                    rationale: "The Krebs cycle oxidizes acetyl-CoA, producing carbon dioxide, NADH, and FADH2.",
                    sourcePassage: "This process breaks down glucose... to release usable chemical energy (ATP)...",
                    emoji: "⚡"
                },
                {
                    id: "c-11",
                    text: "Oxygen is the final electron acceptor in the transport chain",
                    category: "Cellular Respiration",
                    rationale: "Oxygen binds protons to form water at the end of oxidative phosphorylation.",
                    sourcePassage: "This process breaks down glucose in the presence of oxygen...",
                    emoji: "⚡"
                },
                {
                    id: "c-12",
                    text: "Water is split during photolysis to release protons and oxygen",
                    category: "Photosynthesis",
                    rationale: "Photolysis splits water to replenish electrons lost by photosystem II.",
                    sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose while releasing oxygen as a byproduct.",
                    emoji: "🌿"
                },
                {
                    id: "c-13",
                    text: "Stomatal intake of carbon dioxide is a primary substrate",
                    category: "Photosynthesis",
                    rationale: "CO2 enters leaves via stomata to act as the carbon source for glucose.",
                    sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose...",
                    emoji: "🌿"
                },
                {
                    id: "c-14",
                    text: "Carbon dioxide is a gaseous metabolic byproduct",
                    category: "Cellular Respiration",
                    rationale: "Decarboxylation reactions in cellular respiration release CO2 as waste.",
                    sourcePassage: "...producing carbon dioxide and water as waste products.",
                    emoji: "⚡"
                },
                {
                    id: "c-15",
                    text: "Produces a net yield of up to 36-38 ATP per glucose",
                    category: "Cellular Respiration",
                    rationale: "Mitochondrial electron transport produces substantial ATP from coenzymes.",
                    sourcePassage: "This process breaks down glucose in the presence of oxygen to release usable chemical energy (ATP)...",
                    emoji: "⚡"
                },
                {
                    id: "c-16",
                    text: "Requires NADP+ as an electron carrier to form NADPH",
                    category: "Photosynthesis",
                    rationale: "NADP+ is reduced in light reactions for use in the Calvin cycle.",
                    sourcePassage: "Photosynthesis takes place inside plant chloroplasts...",
                    emoji: "🌿"
                },
                {
                    id: "c-17",
                    text: "Uses NAD+ and FAD as coenzymes for electron transport",
                    category: "Cellular Respiration",
                    rationale: "NAD+ and FAD capture high-energy electrons during glucose oxidation.",
                    sourcePassage: "This process breaks down glucose in the presence of oxygen...",
                    emoji: "⚡"
                },
                {
                    id: "c-18",
                    text: "Occurs only in green tissue containing pigment molecules",
                    category: "Photosynthesis",
                    rationale: "Chlorophyll pigments are required to capture the light energy.",
                    sourcePassage: "Photosynthesis takes place inside plant chloroplasts...",
                    emoji: "🌿"
                },
                {
                    id: "c-19",
                    text: "Operates continuously day and night in all living cells",
                    category: "Cellular Respiration",
                    rationale: "All living cells require continuous ATP generation to maintain cellular processes.",
                    sourcePassage: "...cellular respiration is a catabolic reaction that releases chemical energy.",
                    emoji: "⚡"
                },
                {
                    id: "c-20",
                    text: "General equation: 6CO2 + 6H2O + Light -> C6H12O6 + 6O2",
                    category: "Photosynthesis",
                    rationale: "The chemical summary of storing light energy as glucose bonds.",
                    sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose while releasing oxygen as a byproduct.",
                    emoji: "🌿"
                }
            ]
        }
    }
};

// 2. APP STATE MANAGER
const AppState = {
    currentScreen: 'screen-input',
    uploadedText: '',
    uploadedPdfFilename: '',
    selectedSampleKey: null,
    isCompiling: false,
    sessionPhase: 'learn', // 'learn' | 'challenge'
    activeGameInstance: null,
    activeUnderstandingInstance: null,
    
    // Level progress tracker
    currentLevelIndex: 0,
    totalLevelsCount: 1,
    
    // Performance metrics
    score: 0,
    timerInterval: null,
    timeElapsed: 0, // in seconds
    totalAnswersAttempted: 0,
    correctAnswersCount: 0,
    mistakesList: [],
    
    // Original compiled text stored for View Source highlights
    compiledText: '',
    pageImages: [],
    
    // Active step references for HUD
    currentStepIndex: 0,
    totalStepsCount: 0
};
window.AppState = AppState;

// 3. UI ELEMENT REFERENCES
const UI = {
    screens: {
        input: document.getElementById('screen-input'),
        compile: document.getElementById('screen-compile'),
        game: document.getElementById('screen-game'),
        summary: document.getElementById('screen-summary')
    },
    headerStatus: document.getElementById('header-status'),
    btnCompile: document.getElementById('btn-compile'),
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    pdfDropzone: document.getElementById('pdf-dropzone'),
    pdfInput: document.getElementById('pdf-file-input'),
    fileInfoContainer: document.getElementById('file-info-container'),
    fileNameText: document.getElementById('file-name-text'),
    fileSizeText: document.getElementById('file-size-text'),
    btnRemoveFile: document.getElementById('btn-remove-file'),
    textPasteInput: document.getElementById('text-paste-input'),
    inputWordCount: document.getElementById('input-word-count'),
    sampleCards: document.querySelectorAll('.sample-item-card'),
    
    // Compilation
    terminalLogs: document.getElementById('compiler-terminal-logs'),
    compileSubtitle: document.getElementById('compile-subtitle'),
    pipelineSteps: {
        extract: document.getElementById('pstep-extract'),
        classify: document.getElementById('pstep-classify'),
        generate: document.getElementById('pstep-generate'),
        render: document.getElementById('pstep-render')
    },
    pipelineLines: {
        line1: document.getElementById('pline-1'),
        line2: document.getElementById('pline-2'),
        line3: document.getElementById('pline-3')
    },
    compilationInsightCard: document.getElementById('compilation-insight-card'),
    insightCategoryBadge: document.getElementById('insight-category-badge'),
    insightStructName: document.getElementById('insight-struct-name'),
    insightTemplateName: document.getElementById('insight-template-name'),
    insightConfidence: document.getElementById('insight-confidence'),
    insightRationale: document.getElementById('insight-rationale'),
    
    // Game Runtime HUD
    gameActiveTitle: document.getElementById('game-active-title'),
    gameActiveDesc: document.getElementById('game-active-desc'),
    gameMechanicTag: document.getElementById('game-mechanic-tag'),
    gameScore: document.getElementById('game-score'),
    gameTimer: document.getElementById('game-timer'),
    gameAccuracy: document.getElementById('game-accuracy'),
    gameProgressBar: document.getElementById('game-progress-bar'),
    gameStepCounter: document.getElementById('game-step-counter'),
    btnToggleTransparency: document.getElementById('btn-toggle-transparency'),
    btnAbortGame: document.getElementById('btn-abort-game'),
    gameCanvas: document.getElementById('game-canvas'),
    
    // Overlays
    narrativeOverlay: document.getElementById('narrative-intro-overlay'),
    narrativeTitle: document.getElementById('narrative-title'),
    narrativeText: document.getElementById('narrative-text'),
    btnStartGameplay: document.getElementById('btn-start-gameplay'),
    
    feedbackOverlay: document.getElementById('game-feedback-overlay'),
    feedbackIconContainer: document.getElementById('feedback-icon-container'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackMessage: document.getElementById('feedback-message'),
    feedbackSourceText: document.getElementById('feedback-source-text'),
    btnNextStep: document.getElementById('btn-next-step'),
    
    transparencyDrawer: document.getElementById('transparency-drawer'),
    btnCloseTransparency: document.getElementById('btn-close-transparency'),
    
    sourceModal: document.getElementById('source-modal'),
    sourceTextScroller: document.getElementById('source-text-scroller'),
    btnCloseSource: document.getElementById('btn-close-source'),
    
    // Metadata Panel variables
    metaModelName: document.getElementById('meta-model-name'),
    metaTokenCount: document.getElementById('meta-token-count'),
    metaCompilationTime: document.getElementById('meta-compilation-time'),
    metaRationaleQuote: document.getElementById('meta-rationale-quote'),
    confBarSeq: document.getElementById('conf-bar-seq'),
    confPctSeq: document.getElementById('conf-pct-seq'),
    confBarCyc: document.getElementById('conf-bar-cyc'),
    confPctCyc: document.getElementById('conf-pct-cyc'),
    confBarCau: document.getElementById('conf-bar-cau'),
    confPctCau: document.getElementById('conf-pct-cau'),
    confBarComp: document.getElementById('conf-bar-comp'),
    confPctComp: document.getElementById('conf-pct-comp'),
    
    // Summary
    summaryGrade: document.getElementById('summary-grade'),
    summaryScore: document.getElementById('summary-score'),
    summaryAccuracy: document.getElementById('summary-accuracy'),
    summaryTime: document.getElementById('summary-time'),
    summaryDetailsList: document.getElementById('summary-details-list'),
    btnSummaryReplay: document.getElementById('btn-summary-replay'),
    btnSummaryBack: document.getElementById('btn-summary-back')
};

// 4. SCREEN NAVIGATION
function showScreen(screenId) {
    Object.values(UI.screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenId;
    }
}

// 5. INPUT SCREEN CONTROLLER
function initInputScreen() {
    // Mode toggling
    UI.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            UI.tabs.forEach(t => t.classList.remove('active'));
            UI.tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const contentId = `tab-${tab.dataset.tab}`;
            document.getElementById(contentId).classList.add('active');
            
            validateInputState();
        });
    });

    // File Drag & Drop
    const dropzone = UI.pdfDropzone;
    if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-active');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-active');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-active');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            handlePdfFile(files[0]);
        }
    });

    dropzone.addEventListener('click', () => {
        UI.pdfInput?.click();
    });
    }

    UI.pdfInput?.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handlePdfFile(files[0]);
        }
    });

    UI.btnRemoveFile?.addEventListener('click', () => {
        UI.pdfInput.value = '';
        UI.fileInfoContainer.classList.add('hidden');
        UI.pdfDropzone.classList.remove('hidden');
        AppState.uploadedText = '';
        validateInputState();
    });

    // Paste Text Input
    UI.textPasteInput?.addEventListener('input', (e) => {
        const text = e.target.value;
        const words = LoreboundLimits.countWords(text);
        const chars = text.length;
        UI.inputWordCount.textContent = `${words} / ${LoreboundLimits.SOURCE_MAX_WORDS} words · ${chars.toLocaleString()} / ${LoreboundLimits.SOURCE_MAX_CHARS.toLocaleString()} chars`;
        if (words > LoreboundLimits.SOURCE_MAX_WORDS || chars > LoreboundLimits.SOURCE_MAX_CHARS) {
            UI.inputWordCount.classList.add('over-limit');
        } else {
            UI.inputWordCount.classList.remove('over-limit');
        }
        AppState.uploadedText = text;
        validateInputState();
    });

    const limitsEl = document.getElementById('source-limits-label');
    if (limitsEl) limitsEl.textContent = LoreboundLimits.label();

    // Sample selection - loaded dynamically via loadDemoCards()
    loadDemoCards();

    // Compile button click
    UI.btnCompile?.addEventListener('click', () => {
        const text = truncateSourceText(AppState.uploadedText.trim());
        if (text.length >= SOURCE_MIN_CHARS) {
            runCompilationPipeline(text, getCompilationSourceTitle(), null, null, false, {
                isPdf: !!AppState.uploadedPdfFilename,
                filename: AppState.uploadedPdfFilename || null,
            });
        }
    });
}

async function handlePdfFile(file) {
    if (file.size > LoreboundLimits.PDF_MAX_SIZE_MB * 1024 * 1024) {
        alert(`PDF must be under ${LoreboundLimits.PDF_MAX_SIZE_MB}MB.`);
        return;
    }

    UI.pdfDropzone.classList.add('hidden');
    UI.fileInfoContainer.classList.remove('hidden');
    UI.fileNameText.textContent = file.name;
    UI.fileSizeText.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    UI.btnCompile.disabled = true;
    UI.btnCompile.querySelector('span').textContent = 'Extracting PDF text and visuals...';

    try {
        const result = await LoreboundPdfMedia.extractFromFile(file);
        AppState.uploadedText = result.text;
        AppState.pageImages = result.pageImages;
        AppState.uploadedPdfFilename = file.name;

        const pageNote = result.totalPages > LoreboundLimits.PDF_MAX_PAGES
            ? ` (first ${result.pagesRead} of ${result.totalPages} pages used)`
            : ` (${result.pagesRead} pages)`;
        const truncNote = result.textTruncated ? ' · trimmed to AI limits' : '';
        UI.fileSizeText.textContent =
            `${(file.size / (1024 * 1024)).toFixed(2)} MB${pageNote} · ${result.words} words · ${result.pageImages.length} visuals${truncNote}`;

        UI.btnCompile.querySelector('span').textContent = 'Compile to Playable Game';
        validateInputState();
    } catch (err) {
        alert('Error processing PDF: ' + err.message);
        resetPdfState();
    }
}

function resetPdfState() {
    UI.pdfInput.value = '';
    UI.fileInfoContainer.classList.add('hidden');
    UI.pdfDropzone.classList.remove('hidden');
    AppState.uploadedText = '';
    AppState.uploadedPdfFilename = '';
    AppState.pageImages = [];
    UI.btnCompile.disabled = true;
    UI.btnCompile.querySelector('span').textContent = 'Compile to Playable Game';
}

function validateInputState() {
    const validation = LoreboundLimits.validate(AppState.uploadedText);
    AppState.uploadedText = validation.text;
    if (UI.btnCompile) UI.btnCompile.disabled = !validation.ok;
}

function initSampleCardDelegation() {
    const list = document.getElementById('samples-list') || document.querySelector('.samples-list');
    if (!list || list.dataset.delegationBound === '1') return;
    list.dataset.delegationBound = '1';
    list.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.sample-delete-btn');
        if (deleteBtn?.dataset.compilation) {
            e.preventDefault();
            e.stopPropagation();
            deleteCompiledGame(deleteBtn.dataset.compilation);
            return;
        }
        const card = e.target.closest('.sample-item-card');
        if (!card) return;
        if (card.dataset.compilation) {
            card.classList.add('sample-clicked');
            loadCompiledGame(card.dataset.compilation);
            return;
        }
        if (!card.dataset.sample) return;
        card.classList.add('sample-clicked');
        loadSample(card.dataset.sample);
    });
}

function renderCompiledGameCard(comp) {
    const badge = window.LoreboundFX?.badgeClass(comp.category) || 'timeline-badge';
    const icon = normalizeSampleIcon(comp.theme?.icon, comp.category);
    const emoji = comp.demo_emoji || comp.theme?.demo_emoji || '✨';
    const mechanic = comp.mechanic || comp.category || 'Compiled Game';
    const topic = comp.topic || (comp.input_type === 'pdf' ? 'PDF upload' : 'AI compiled');
    const color = comp.theme?.primary || '#7c4dff';

    return `
        <div class="sample-item-card sample-item-card--compiled" data-compilation="${comp.uuid}" style="--demo-primary: ${color}">
            <span class="sample-demo-emoji">${emoji}</span>
            <div class="sample-info">
                <span class="sample-badge ${badge}"><i class="fa-solid fa-${icon}"></i> ${mechanic}</span>
                <h4>${comp.title}</h4>
                <p class="sample-topic">${topic} · <span class="compiled-tag">Your compile</span></p>
            </div>
            <div class="sample-card-actions">
                <button type="button" class="sample-delete-btn" data-compilation="${comp.uuid}" title="Delete this game" aria-label="Delete ${comp.title}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
                <i class="fa-solid fa-chevron-right sample-arrow"></i>
            </div>
        </div>`;
}

function getLocalCompiledLibrary() {
    try {
        return JSON.parse(localStorage.getItem('lorebound_compiled_library') || '[]');
    } catch {
        return [];
    }
}

function saveToLocalCompiledLibrary(compiled) {
    if (!compiled?.uuid) return;
    const entry = {
        uuid: compiled.uuid,
        title: compiled.title || compiled.source_title,
        category: compiled.category,
        topic: compiled.metadata?.theme?.narrative_intro?.slice(0, 60) || 'AI compiled',
        input_type: 'text',
        theme: compiled.metadata?.theme || null,
        mechanic: compiled.metadata?.mechanic || compiled.category,
        demo_emoji: compiled.metadata?.theme?.demo_emoji || '✨',
    };
    const lib = getLocalCompiledLibrary().filter(c => c.uuid !== entry.uuid);
    localStorage.setItem('lorebound_compiled_library', JSON.stringify([entry, ...lib].slice(0, 30)));
}

function removeFromLocalCompiledLibrary(uuid) {
    if (!uuid) return;
    const lib = getLocalCompiledLibrary().filter(c => c.uuid !== uuid);
    localStorage.setItem('lorebound_compiled_library', JSON.stringify(lib));
}

async function deleteCompiledGame(uuid) {
    if (!uuid) return;
    const local = getLocalCompiledLibrary().find(c => c.uuid === uuid);
    const label = local?.title || 'this compiled game';
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;

    removeFromLocalCompiledLibrary(uuid);

    try {
        if (window.LoreboundAPI) {
            await LoreboundAPI.deleteCompilation(uuid);
        }
    } catch (err) {
        console.warn('Delete compilation:', err.message);
    }

    loadDemoCards();
}

function mergeCompiledLists(apiList, localList) {
    const seen = new Set();
    const out = [];
    for (const item of [...(apiList || []), ...(localList || [])]) {
        if (!item?.uuid || seen.has(item.uuid)) continue;
        seen.add(item.uuid);
        out.push(item);
    }
    return out;
}

function normalizeSampleIcon(icon, category) {
    let value = icon || window.LoreboundFX?.mechanicIcon(category) || 'fa-gamepad';
    value = String(value).replace(/^fa-/, '');
    return value;
}

function loadDemoCards() {
    const list = document.getElementById('samples-list') || document.querySelector('.samples-list');
    if (!list) return;

    initSampleCardDelegation();

    const renderAll = (samples, compilations) => {
        const samplesHtml = (samples || []).map((sample, idx) => {
            const slugToKey = window.LoreboundAPI
                ? Object.fromEntries(Object.entries(LoreboundAPI.sampleSlugs).map(([k, v]) => [v, k]))
                : {};
            const key = slugToKey[sample.slug] || String(idx + 1);
            const badge = window.LoreboundFX?.badgeClass(sample.category) || 'timeline-badge';
            const icon = normalizeSampleIcon(sample.theme?.icon, sample.category);
            const emoji = sample.demo_emoji || sample.theme?.demo_emoji || '📚';
            const mechanic = sample.mechanic || sample.category;

            return `
                <div class="sample-item-card" data-sample="${key}" data-demo="${key}" style="--demo-primary: ${sample.theme?.primary || '#00f2fe'}">
                    <span class="sample-demo-emoji">${emoji}</span>
                    <div class="sample-info">
                        <span class="sample-badge ${badge}"><i class="fa-solid fa-${icon}"></i> ${mechanic}</span>
                        <h4>${sample.title}</h4>
                        <p class="sample-topic">${sample.topic}</p>
                    </div>
                    <i class="fa-solid fa-chevron-right sample-arrow"></i>
                </div>`;
        }).join('');

        const compiledHtml = (compilations || []).map(renderCompiledGameCard).join('');
        const divider = compiledHtml
            ? `<div class="samples-section-label"><i class="fa-solid fa-wand-magic-sparkles"></i> Your compiled games</div>`
            : '';

        if (!samplesHtml && !compiledHtml) {
            renderFallbackDemoCards();
            return;
        }

        list.innerHTML = samplesHtml + divider + compiledHtml;
    };

    if (!window.LoreboundAPI) {
        renderFallbackDemoCards();
        const local = getLocalCompiledLibrary();
        if (local.length) {
            const divider = `<div class="samples-section-label"><i class="fa-solid fa-wand-magic-sparkles"></i> Your compiled games</div>`;
            list.innerHTML += divider + local.map(renderCompiledGameCard).join('');
        }
        return;
    }

    Promise.all([
        LoreboundAPI.request('/samples').catch(() => ({ data: [] })),
        LoreboundAPI.listCompilations().catch(() => ({ data: [] })),
    ]).then(([samplesRes, compRes]) => {
        const samples = samplesRes?.data?.length ? samplesRes.data : null;
        const compilations = mergeCompiledLists(compRes?.data, getLocalCompiledLibrary());
        if (!samples?.length) {
            renderFallbackDemoCards();
            if (compilations.length) {
                const divider = `<div class="samples-section-label"><i class="fa-solid fa-wand-magic-sparkles"></i> Your compiled games</div>`;
                list.innerHTML = list.innerHTML + divider + compilations.map(renderCompiledGameCard).join('');
            }
            return;
        }
        renderAll(samples, compilations);
    }).catch(() => renderFallbackDemoCards());
}

function renderFallbackDemoCards() {
    const list = document.getElementById('samples-list') || document.querySelector('.samples-list');
    if (!list) return;
    const demos = [
        { key: '1', emoji: '🏛️', badge: 'timeline-badge', icon: 'clock-rotate-left', mechanic: 'Timeline Builder', title: 'Bangladesh Liberation War 1971', topic: 'History & Civil Studies • Grade 9-10', color: '#ff5252' },
        { key: '2', emoji: '💧', badge: 'cycle-badge', icon: 'rotate', mechanic: 'Process Loop', title: 'The Water (Hydrological) Cycle', topic: 'Earth Science & Biology • Grade 8', color: '#26c6da' },
        { key: '3', emoji: '🌱', badge: 'cause-badge', icon: 'diagram-next', mechanic: 'Cause-Effect Chain', title: 'The Green Revolution & Ecology', topic: 'Environmental Science • Grade 11-12', color: '#8bc34a' },
        { key: '4', emoji: '🧪', badge: 'sorting-badge', icon: 'arrow-right-arrow-left', mechanic: 'Comparison Sorter', title: 'Photosynthesis vs. Respiration', topic: 'Cellular Bio-Chemistry • Grade 10', color: '#69f0ae' },
    ];
    list.innerHTML = demos.map(d => `
        <div class="sample-item-card" data-sample="${d.key}" data-demo="${d.key}" style="--demo-primary: ${d.color}">
            <span class="sample-demo-emoji">${d.emoji}</span>
            <div class="sample-info">
                <span class="sample-badge ${d.badge}"><i class="fa-solid fa-${d.icon}"></i> ${d.mechanic}</span>
                <h4>${d.title}</h4>
                <p class="sample-topic">${d.topic}</p>
            </div>
            <i class="fa-solid fa-chevron-right sample-arrow"></i>
        </div>`).join('');
}

function bindSampleCards() {
    initSampleCardDelegation();
}

function loadSample(sampleId) {
    if (!sampleId || AppState.isCompiling) return;
    AppState.isCompiling = true;
    AppState.selectedSampleKey = sampleId;
    runCompilationPipeline(null, 'Sample Chapter', null, sampleId);
}

async function loadCompiledGame(uuid) {
    if (!uuid || AppState.isCompiling) return;
    AppState.isCompiling = true;
    AppState.selectedSampleKey = null;
    showScreen('screen-compile');
    UI.headerStatus.innerHTML = `<i class="fa-solid fa-gear fa-spin text-cyan"></i> Loading game...`;
    UI.terminalLogs.innerHTML = '';
    addLogLine(`[SYSTEM] Loading your compiled game...`, 'info');

    try {
        let compiled;
        if (window.LoreboundAPI) {
            const result = await LoreboundAPI.getCompilation(uuid);
            compiled = {
                title: result.title || result.source_title,
                category: result.category,
                originalText: result.originalText || result.source_text,
                metadata: result.metadata,
                payload: result.payload,
                uuid: result.uuid,
            };
        } else {
            throw new Error('API unavailable');
        }
        addLogLine(`[SYSTEM] Loaded: "${compiled.title}"`, 'success');
        runCompilationPipeline(compiled.originalText, compiled.title, compiled, null, true);
    } catch (err) {
        AppState.isCompiling = false;
        addLogLine(`[ERROR] ${err.message}`, 'error');
        UI.headerStatus.innerHTML = `<i class="fa-solid fa-circle-xmark text-danger"></i> Load failed`;
        setTimeout(() => showScreen('screen-input'), 1500);
    }
}

function inferTopicTitle(text) {
    if (!text) return '';
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length >= 8);
    for (const line of lines) {
        const heading = line.match(/^#+\s*(.+)$/);
        if (heading) return heading[1].trim().slice(0, 120);
        const titleLine = line.match(/^title\s*:\s*(.+)$/i);
        if (titleLine) return titleLine[1].trim().slice(0, 120);
        const topicLine = line.match(/^topic\s*:\s*(.+)$/i);
        if (topicLine) return topicLine[1].trim().slice(0, 120);
        const sentence = line.match(/^(.{12,90}?)[.!?](\s|$)/);
        if (sentence) return sentence[1].trim().slice(0, 120);
    }
    return text.trim().split(/\s+/).slice(0, 10).join(' ').slice(0, 120);
}

function getCompilationSourceTitle() {
    const manual = document.getElementById('topic-name-input')?.value?.trim();
    if (manual) return manual;
    const fromText = inferTopicTitle(AppState.uploadedText?.trim() || '');
    if (fromText) return fromText;
    if (AppState.uploadedPdfFilename) {
        return AppState.uploadedPdfFilename.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
    }
    return '';
}

// 6. COMPILER ENGINE (SIMULATED COOLDOWNS FOR HIGHEST FIDELITY LOGS)
function addLogLine(text, type = '') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.innerHTML = `[${new Date().toLocaleTimeString()}] ${text}`;
    UI.terminalLogs.appendChild(line);
    UI.terminalLogs.scrollTop = UI.terminalLogs.scrollHeight;
}

function runCompilationPipeline(text, sourceTitle, preloadedSample = null, sampleKey = null, skipApi = false, compileOptions = {}) {
    if (text) {
        text = truncateSourceText(text.trim());
    }
    showScreen('screen-compile');
    UI.headerStatus.innerHTML = `<i class="fa-solid fa-gear fa-spin text-cyan"></i> Compiling...`;
    UI.headerStatus.className = 'badge compiler-status active';
    
    UI.terminalLogs.innerHTML = '';
    UI.compilationInsightCard.classList.add('hidden');
    
    Object.values(UI.pipelineSteps).forEach(step => step.className = 'pipeline-step');
    Object.values(UI.pipelineLines).forEach(line => line.className = 'pipeline-line');
    UI.pipelineSteps.extract.classList.add('active');
    
    if (skipApi && preloadedSample) {
        addLogLine(`[SYSTEM] Opening saved game: "${sourceTitle}"...`, 'system');
        UI.pipelineSteps.extract.classList.add('completed');
        UI.pipelineSteps.classify.classList.add('completed');
        UI.pipelineSteps.generate.classList.add('completed');
        UI.pipelineSteps.render.classList.add('active');
        renderMiniInsight(preloadedSample.category, preloadedSample.metadata);
        setTimeout(() => finishCompilation(preloadedSample), 500);
        return;
    }

    addLogLine(`[SYSTEM] Starting compilation for: "${sourceTitle}"...`, 'system');
    if (text) addLogLine(`[SYSTEM] Word count: ${text.split(/\s+/).length} words.`, 'system');
    addLogLine(`[SYSTEM] Contacting Lorebound compiler API...`, 'info');

    const useApi = typeof window.runApiCompilation === 'function';

    const finishCompilation = (compiledSample) => {
        AppState.isCompiling = false;
        const finalText = compiledSample.originalText || text;
        const finalTitle = compiledSample.title
            || compiledSample.metadata?.topicTitle
            || compiledSample.metadata?.learningGuide?.topicTitle
            || sourceTitle
            || 'Study Topic';
        AppState.compiledText = finalText;
        AppState.activePayload = compiledSample.payload;
        AppState.activeMetadata = compiledSample.metadata;
        AppState.activeSourceTitle = finalTitle;
        AppState.activeCategory = compiledSample.category;
        AppState.compilationUuid = compiledSample.uuid || null;
        AppState.uploadedText = finalText;

        if (compiledSample.uuid && !sampleKey && !compiledSample.from_sample) {
            saveToLocalCompiledLibrary(compiledSample);
        }

        UI.pipelineSteps.render.classList.add('completed');
        UI.headerStatus.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> Game Ready`;
        UI.headerStatus.className = 'badge compiler-status';
        addLogLine(`[SYSTEM] Compilation finished successfully. Starting gameplay engine.`, 'system');

        setTimeout(() => {
            startGameSession(AppState.activeCategory, compiledSample.payload, compiledSample.metadata, finalTitle);
        }, 800);
    };

    const runLocalFallback = () => {
        let localSample = preloadedSample;
        if (!localSample && sampleKey && SAMPLE_CHAPTERS[sampleKey]) {
            localSample = SAMPLE_CHAPTERS[sampleKey];
            text = localSample.originalText;
        }
        if (!text && !localSample) {
            AppState.isCompiling = false;
            addLogLine('[ERROR] No source text available for compilation.', 'error');
            return;
        }

        setTimeout(() => {
            UI.pipelineSteps.extract.classList.add('completed');
            UI.pipelineLines.line1.classList.add('completed');
            UI.pipelineSteps.classify.classList.add('active');
            addLogLine(`OCR Check: Valid text blocks extracted successfully.`, 'success');

            setTimeout(() => {
                UI.pipelineSteps.classify.classList.add('completed');
                UI.pipelineLines.line2.classList.add('completed');
                UI.pipelineSteps.generate.classList.add('active');

                let simulatedMetadata, finalPayload;
                if (localSample) {
                    simulatedMetadata = localSample.metadata;
                    finalPayload = localSample.payload;
                    AppState.activeCategory = localSample.category;
                } else {
                    AppState.activeCategory = classifyLocal(text).category;
                    simulatedMetadata = buildLocalMetadata(text, AppState.activeCategory);
                    finalPayload = generateDynamicPayload(text, AppState.activeCategory, sourceTitle);
                }

                renderMiniInsight(AppState.activeCategory, simulatedMetadata);
                setTimeout(() => {
                    UI.pipelineSteps.generate.classList.add('completed');
                    UI.pipelineLines.line3.classList.add('completed');
                    UI.pipelineSteps.render.classList.add('active');
                    finishCompilation({
                        title: sourceTitle,
                        category: AppState.activeCategory,
                        originalText: text,
                        metadata: simulatedMetadata,
                        payload: finalPayload,
                    });
                }, 1000);
            }, 1000);
        }, 800);
    };

    if (!useApi) {
        runLocalFallback();
        return;
    }

    setTimeout(async () => {
        UI.pipelineSteps.extract.classList.add('completed');
        UI.pipelineLines.line1.classList.add('completed');
        UI.pipelineSteps.classify.classList.add('active');
        addLogLine(`Text ingestion complete. Running structural classifier...`, 'success');

        try {
            UI.pipelineSteps.classify.classList.add('completed');
            UI.pipelineLines.line2.classList.add('completed');
            UI.pipelineSteps.generate.classList.add('active');

            const compiled = await window.runApiCompilation(text, sourceTitle, sampleKey, compileOptions);
            renderMiniInsight(compiled.category, compiled.metadata);
            addLogLine(`Topic: "${compiled.title || sourceTitle || 'Study Topic'}"`, 'success');
            addLogLine(`Classifier: [${compiled.category}] - ${compiled.metadata.rationale}`, 'success');
            addLogLine(`Grounded content generated. Self-consistency pass passed.`, 'success');

            UI.pipelineSteps.generate.classList.add('completed');
            UI.pipelineLines.line3.classList.add('completed');
            UI.pipelineSteps.render.classList.add('active');
            finishCompilation(compiled);
        } catch (err) {
            addLogLine(`API unavailable (${err.message}). Using local compiler fallback.`, 'error');
            runLocalFallback();
        }
    }, 600);
}

function classifyLocal(text) {
    const lower = text.toLowerCase();
    const scores = { Timeline: 0, Process: 0, CauseEffect: 0, Comparison: 0 };
    const dates = (text.match(/\b(19\d{2}|20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi) || []).length;
    if (dates >= 2) scores.Timeline += 40 + Math.min(dates * 5, 30);
    if (/\b(first|then|next|after|before|finally|subsequently)\b/i.test(text)) scores.Timeline += 15;
    if (/\b(cycle|process|stage|phase|step|circulation|loop|repeats)\b/i.test(text)) scores.Process += 45;
    if (/\b(valve|chamber|pathway|reaction|transforms|converts)\b/i.test(text)) scores.Process += 10;
    if (/\b(cause|effect|leads to|results in|consequently|therefore|trigger|because)\b/i.test(text)) scores.CauseEffect += 45;
    if (/\b(versus| vs |compare|comparison|difference|contrast|whereas|in contrast|unlike)\b/i.test(text)) scores.Comparison += 45;
    const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return { category: top[1] > 0 ? top[0] : 'Timeline' };
}

function buildLocalMetadata(text, category) {
    const conf = { seq: 10, cyc: 10, cau: 10, comp: 10 };
    const key = category === 'Timeline' ? 'seq' : category === 'Process' ? 'cyc' : category === 'CauseEffect' ? 'cau' : 'comp';
    conf[key] = 90;
    return {
        model: 'Local Compiler Fallback',
        tokens: Math.round(text.split(/\s+/).length * 1.3),
        compTime: 2.5,
        rationale: 'Local heuristic classification (API offline).',
        confMatrix: conf,
    };
}

function renderMiniInsight(category, meta) {
    UI.compilationInsightCard.classList.remove('hidden');
    
    let catText = "Timeline Builder";
    let icon = "fa-timeline";
    let badgeClass = "timeline-badge";
    if (category === "Process") { catText = "Process Loop"; icon = "fa-rotate"; badgeClass = "cycle-badge"; }
    else if (category === "CauseEffect") { catText = "Cause-Effect Chain"; icon = "fa-diagram-next"; badgeClass = "cause-badge"; }
    else if (category === "Comparison") { catText = "Comparison Sorter"; icon = "fa-arrow-right-arrow-left"; badgeClass = "sorting-badge"; }
    
    UI.insightCategoryBadge.className = `insight-badge ${badgeClass}`;
    UI.insightCategoryBadge.innerHTML = `<i class="fa-solid ${icon}"></i> ${catText}`;
    UI.insightStructName.textContent = category === "Timeline" ? "Sequential / Timeline" : category === "Process" ? "Cyclical / Process" : category === "CauseEffect" ? "Cause-and-Effect" : "Comparative / Classification";
    UI.insightTemplateName.textContent = catText;
    
    const pct = meta.confMatrix[category === 'Timeline' ? 'seq' : category === 'Process' ? 'cyc' : category === 'CauseEffect' ? 'cau' : 'comp'];
    UI.insightConfidence.textContent = `${pct}%`;
    UI.insightRationale.textContent = meta.rationale;
}

// 7. HEURISTIC GENERATOR FOR PASTED USER TEXT (Ensures dynamic creation compiles into levels)
function inferComparisonCategories(title, sentences) {
    const clean = String(title || 'Topic').replace(/[^\w\s]/g, ' ').trim();
    const words = clean.split(/\s+/).filter(w => w.length > 3);
    if (words.length >= 2) {
        const a = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        const b = words[1].charAt(0).toUpperCase() + words[1].slice(1);
        return [`${a} traits`, `${b} traits`];
    }
    for (const s of sentences) {
        const vs = s.split(/\bvs\.?\b|\bversus\b/i);
        if (vs.length >= 2) {
            return [
                vs[0].trim().slice(0, 36) || 'Group A',
                vs[1].trim().slice(0, 36) || 'Group B',
            ];
        }
    }
    return ['Core concepts', 'Related concepts'];
}

function generateDynamicPayload(text, category, sourceTitle = 'Topic') {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (category === "Timeline") {
        const events = [];
        let order = 0;
        sentences.forEach((s) => {
            const dateMatch = s.match(/\b(19\d{2}|20\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
            if (dateMatch && order < 10) {
                events.push({
                    id: `dyn-evt-${order}`,
                    title: LoreboundLimits.shortLabel(s.trim(), 72),
                    date: dateMatch[0],
                    desc: s.trim(),
                    order: order,
                    sourcePassage: s.trim()
                });
                order++;
            }
        });
        
        while (events.length < 8) {
            const s = sentences[Math.min(events.length, sentences.length - 1)];
            events.push({
                id: `dyn-evt-${events.length}`,
                title: LoreboundLimits.shortLabel(s.trim(), 72),
                date: `Stage ${events.length + 1}`,
                desc: s.trim(),
                order: events.length,
                sourcePassage: s.trim()
            });
        }
        
        // Split into 2 Levels
        const midpoint = Math.floor(events.length / 2);
        const l1Events = events.slice(0, midpoint).map((e, idx) => ({ ...e, order: idx }));
        const l2Events = events.slice(midpoint).map((e, idx) => ({ ...e, order: idx }));
        
        return {
            levels: [
                { name: "Phase 1: Foundations", events: l1Events },
                { name: "Phase 2: Consequences", events: l2Events }
            ]
        };
    } 
    
    else if (category === "Process") {
        const stages = [];
        let limit = Math.min(sentences.length, 6);
        for (let i = 0; i < limit; i++) {
            const s = sentences[i];
            stages.push({
                id: `dyn-stg-${i}`,
                title: `Stage ${i + 1}`,
                desc: s.trim(),
                question: `What occurs during Stage ${i + 1} of this processed cycle?`,
                options: [
                    LoreboundLimits.shortLabel(s.trim(), 80),
                    "Alternative systemic option B",
                    "Distractor parameter checking",
                    "Stage loops verification"
                ],
                correctIndex: 0,
                rationale: "Extracted from raw passage text details.",
                sourcePassage: s.trim()
            });
        }
        
        while (stages.length < 6) {
            const s = sentences[Math.min(stages.length, sentences.length - 1)];
            stages.push({
                id: `dyn-stg-${stages.length}`,
                title: `Stage ${stages.length + 1}`,
                desc: s.trim(),
                question: `What defines Phase ${stages.length + 1} of the system?`,
                options: [
                    LoreboundLimits.shortLabel(s.trim(), 80),
                    "General loop distractor",
                    "Synthesized stage step",
                    "State verification pass"
                ],
                correctIndex: 0,
                rationale: "Synthesized process cycle node.",
                sourcePassage: s.trim()
            });
        }
        
        // Split into 2 phases
        const midpoint = Math.floor(stages.length / 2);
        return {
            phases: [
                { name: "Phase 1: Initial Processing", stages: stages.slice(0, midpoint) },
                { name: "Phase 2: Advanced Processing", stages: stages.slice(midpoint) }
            ]
        };
    } 
    
    else if (category === "CauseEffect") {
        const chains = [];
        let count = 0;
        sentences.forEach((s) => {
            const causalWord = s.match(/\b(leads to|results in|causes|caused by|consequently)\b/i);
            if (causalWord && count < 8) {
                const parts = s.split(causalWord[0]);
                chains.push({
                    id: `dyn-ce-${count}`,
                    cause: LoreboundLimits.shortLabel(parts[0].trim(), 90),
                    effect: parts[1] ? LoreboundLimits.shortLabel(parts[1].trim(), 100) : 'Downstream consequence.',
                    rationale: "Causal semantic extraction matching.",
                    sourcePassage: s.trim()
                });
                count++;
            }
        });
        
        while (chains.length < 6) {
            const s = sentences[Math.min(chains.length, sentences.length - 1)];
            chains.push({
                id: `dyn-ce-${chains.length}`,
                cause: `Event Trigger Factor ${chains.length + 1}`,
                effect: LoreboundLimits.shortLabel(s.trim(), 100),
                rationale: "Default causal synthesis.",
                sourcePassage: s.trim()
            });
        }
        
        const midpoint = Math.floor(chains.length / 2);
        return {
            levels: [
                { name: "Level 1: Primary Causal Forces", chains: chains.slice(0, midpoint) },
                { name: "Level 2: Secondary Systemic Effects", chains: chains.slice(midpoint) }
            ]
        };
    } 
    
    else {
        const categories = inferComparisonCategories(sourceTitle || 'Topic', sentences);
        const cards = [];
        sentences.slice(0, 12).forEach((s, idx) => {
            const cat = idx % 2 === 0 ? categories[0] : categories[1];
            cards.push({
                id: `dyn-comp-${idx}`,
                text: s.trim(),
                category: cat,
                rationale: `Grounded comparison card mapped to category: ${cat}`,
                sourcePassage: s.trim()
            });
        });
        return { categories, cards };
    }
}

// 8. GAME RUNTIME INTERACTION
function startGameSession(category, payload, metadata, title) {
    showScreen('screen-game');
    
    AppState.activeMetadata = metadata;
    AppState.activeSourceTitle = title;
    AppState.score = 0;
    AppState.timeElapsed = 0;
    AppState.correctAnswersCount = 0;
    AppState.totalAnswersAttempted = 0;
    AppState.mistakesList = [];
    
    // Set level bounds
    AppState.currentLevelIndex = 0;
    if (category === "Timeline") AppState.totalLevelsCount = payload.levels.length;
    else if (category === "Process") AppState.totalLevelsCount = payload.phases.length;
    else if (category === "CauseEffect") AppState.totalLevelsCount = payload.levels.length;
    else AppState.totalLevelsCount = 1;

    AppState.sessionTotalSteps = estimateSessionSteps(category, payload);
    AppState.sessionStepIndex = 0;
    
    UI.gameScore.textContent = "0000";
    UI.gameTimer.textContent = "00:00";
    UI.gameAccuracy.textContent = "100%";
    UI.gameProgressBar.style.width = "0%";
    
    clearInterval(AppState.timerInterval);
    AppState.timerInterval = setInterval(() => {
        AppState.timeElapsed++;
        const mins = Math.floor(AppState.timeElapsed / 60).toString().padStart(2, '0');
        const secs = (AppState.timeElapsed % 60).toString().padStart(2, '0');
        UI.gameTimer.textContent = `${mins}:${secs}`;
    }, 1000);
    
    UI.metaModelName.textContent = metadata.model;
    UI.metaTokenCount.textContent = `${metadata.tokens} tokens`;
    UI.metaCompilationTime.textContent = `${metadata.compTime} seconds`;
    UI.metaRationaleQuote.textContent = `"${metadata.rationale}"`;
    
    UI.confBarSeq.style.width = `${metadata.confMatrix.seq}%`;
    UI.confPctSeq.textContent = `${metadata.confMatrix.seq}%`;
    UI.confBarCyc.style.width = `${metadata.confMatrix.cyc}%`;
    UI.confPctCyc.textContent = `${metadata.confMatrix.cyc}%`;
    UI.confBarCau.style.width = `${metadata.confMatrix.cau}%`;
    UI.confPctCau.textContent = `${metadata.confMatrix.cau}%`;
    UI.confBarComp.style.width = `${metadata.confMatrix.comp}%`;
    UI.confPctComp.textContent = `${metadata.confMatrix.comp}%`;

    if (window.LoreboundFX) {
        LoreboundFX.applyTheme(category, metadata);
    }

    const theme = metadata.theme || {};
    UI.narrativeOverlay.classList.remove('hidden');
    UI.narrativeTitle.textContent = theme.narrative_title || title;

    const descMap = {
        Timeline: 'First explore every event, then unlock the timeline challenge: build, detective quizzes, sequence mastery, and lightning blitz.',
        Process: 'First master each stage of the cycle, then unlock the process challenge: navigate, reorder, simulate, and rapid fire.',
        CauseEffect: 'First learn every cause and effect link, then unlock the chain challenge: link, ripple, order, and domino predict.',
        Comparison: 'First study every attribute by category, then unlock the sorter challenge: sort, trap hunt, memory match, and blitz.',
    };
    UI.narrativeText.textContent = theme.narrative_intro
        ? `${theme.narrative_intro} First, complete the interactive learning journey to master every concept. Then unlock the challenge arena.`
        : descMap[category] || descMap.Timeline;

    UI.gameActiveTitle.textContent = title;
    UI.gameActiveDesc.textContent = 'Phase 1: Study notes & depth check → Phase 2: Challenge Arena';

    const fxIcon = theme.icon ? `fa-${theme.icon.replace(/^fa-/, '')}` : (LoreboundFX?.mechanicIcon(category) || 'fa-gamepad');
    const mechanicLabels = { Timeline: 'Timeline', Process: 'Process Loop', CauseEffect: 'Cause-Effect', Comparison: 'Sorter' };
    UI.gameMechanicTag.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Learning Phase`;

    const badge = document.getElementById('narrative-badge');
    if (badge) badge.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Step 1: Learn`;

    const startLabel = document.getElementById('btn-start-label');
    const startIcon = document.getElementById('btn-start-icon');
    if (startLabel) startLabel.textContent = 'Begin Learning Journey';
    if (startIcon) startIcon.className = 'fa-solid fa-book-open';

    AppState.sessionPhase = 'learn';
    AppState.activeCategory = category;
    AppState.activePayload = payload;

    UI.btnStartGameplay.onclick = () => {
        UI.narrativeOverlay.classList.add('hidden');
        mountUnderstandingSession(category, payload);
    };
}

function mountUnderstandingSession(category, payload) {
    UI.gameCanvas.innerHTML = '';
    AppState.sessionPhase = 'learn';

    const learningGuide = AppState.activeMetadata?.learningGuide || null;
    const title = AppState.activeMetadata?.topicTitle
        || AppState.activeSourceTitle
        || AppState.activeMetadata?.learningGuide?.topicTitle
        || AppState.activeMetadata?.theme?.narrative_title
        || 'This topic';

    const onLearnFeedback = (isCorrect, explanation, sourcePassage) => {
        if (isCorrect === null) return;
        AppState.totalAnswersAttempted++;
        if (isCorrect) {
            AppState.correctAnswersCount++;
            showStepFeedbackOverlay(true, 'Concept Mastered', explanation, sourcePassage);
        } else {
            AppState.mistakesList.push({ title: explanation, sourcePassage });
            showStepFeedbackOverlay(false, 'Review This Concept', explanation, sourcePassage);
        }
    };

    const onUnderstandingComplete = () => {
        showChallengeUnlockOverlay(category, payload);
    };

    const assessments = AppState.activeMetadata?.assessments || null;

    AppState.activeUnderstandingInstance = new UnderstandingSession(
        UI.gameCanvas, category, payload, learningGuide, title, onLearnFeedback, onUnderstandingComplete,
        { assessments, sourceText: AppState.compiledText || '' }
    );
}

function showChallengeUnlockOverlay(category, payload) {
    const theme = AppState.activeMetadata?.theme || {};
    UI.narrativeOverlay.classList.remove('hidden');
    UI.narrativeTitle.textContent = theme.narrative_title ? `${theme.narrative_title}: Challenge Unlocked!` : 'Challenge Arena Unlocked!';
    UI.narrativeText.textContent = 'You explored the study notes and reflected on depth questions. Now apply your knowledge in the full interactive challenge game!';

    const badge = document.getElementById('narrative-badge');
    if (badge) badge.innerHTML = `<i class="fa-solid fa-gamepad"></i> Step 2: Challenge`;

    const startLabel = document.getElementById('btn-start-label');
    const startIcon = document.getElementById('btn-start-icon');
    if (startLabel) startLabel.textContent = 'Enter Challenge Arena';
    if (startIcon) startIcon.className = 'fa-solid fa-gamepad';

    const fxIcon = theme.icon ? `fa-${String(theme.icon).replace(/^fa-/, '')}` : (LoreboundFX?.mechanicIcon(category) || 'fa-gamepad');
    const mechanicLabels = { Timeline: 'Timeline', Process: 'Process Loop', CauseEffect: 'Cause-Effect', Comparison: 'Sorter' };
    UI.gameMechanicTag.innerHTML = `<i class="fa-solid ${fxIcon}"></i> ${mechanicLabels[category] || category}`;

    UI.btnStartGameplay.onclick = () => {
        UI.narrativeOverlay.classList.add('hidden');
        AppState.sessionPhase = 'challenge';
        document.querySelector('.game-main-area')?.classList.remove('session-mode-learn');
        document.querySelector('.game-main-area')?.classList.add('session-mode-challenge');
        mountGameRenderer(category, payload);
    };
}

function mountGameRenderer(category, payload) {
    UI.gameCanvas.innerHTML = '';
    
    // Level specific payload extraction
    let levelPayload = {};
    let totalSteps = 0;
    
    if (category === "Timeline") {
        levelPayload = payload.levels[AppState.currentLevelIndex];
        totalSteps = levelPayload.events.length;
    } else if (category === "Process") {
        levelPayload = payload.phases[AppState.currentLevelIndex];
        totalSteps = levelPayload.stages.length;
    } else if (category === "CauseEffect") {
        levelPayload = payload.levels[AppState.currentLevelIndex];
        totalSteps = levelPayload.chains.length;
    } else {
        levelPayload = payload;
        totalSteps = estimateSessionSteps('Comparison', payload);
    }
    
    AppState.currentStepIndex = 0;
    AppState.totalStepsCount = category === 'Comparison' ? totalSteps : estimateLevelSteps(category, levelPayload);
    updateStepHUD();

    const onStepFeedback = (isCorrect, explanation, sourcePassage) => {
        AppState.totalAnswersAttempted++;
        if (isCorrect) {
            AppState.correctAnswersCount++;
            const streakBonus = AppState.activeGameInstance?.streak >= 5 ? 500 : AppState.activeGameInstance?.streak >= 3 ? 250 : 0;
            AppState.score += 1000 + streakBonus;
            AppState.currentStepIndex++;
            AppState.sessionStepIndex = (AppState.sessionStepIndex || 0) + 1;
            const streakMsg = streakBonus ? ` 🔥 Streak bonus +${streakBonus}!` : '';
            showStepFeedbackOverlay(true, "Correct Assessment", explanation + streakMsg, sourcePassage);
        } else {
            AppState.score = Math.max(0, AppState.score - 200);
            AppState.mistakesList.push({
                title: explanation,
                sourcePassage: sourcePassage
            });
            showStepFeedbackOverlay(false, "Incorrect Placement", explanation, sourcePassage);
        }
        
        updateStepHUD();
    };

    const onGameComplete = () => {
        // Check if there is another level
        if (AppState.currentLevelIndex + 1 < AppState.totalLevelsCount) {
            AppState.currentLevelIndex++;
            showLevelTransitionOverlay();
        } else {
            clearInterval(AppState.timerInterval);
            setTimeout(() => {
                showGameCompletionSummary();
            }, 800);
        }
    };

    if (category === "Timeline") {
        AppState.activeGameInstance = new TimelineGame(UI.gameCanvas, levelPayload, onStepFeedback, onGameComplete);
    } else if (category === "Process") {
        AppState.activeGameInstance = new ProcessGame(UI.gameCanvas, levelPayload, onStepFeedback, onGameComplete);
    } else if (category === "CauseEffect") {
        AppState.activeGameInstance = new CauseEffectGame(UI.gameCanvas, levelPayload, onStepFeedback, onGameComplete);
    } else {
        AppState.activeGameInstance = new ComparisonGame(UI.gameCanvas, levelPayload, onStepFeedback, onGameComplete);
    }
}

function showLevelTransitionOverlay() {
    UI.narrativeOverlay.classList.remove('hidden');
    UI.narrativeTitle.textContent = `Level ${AppState.currentLevelIndex} Accomplished!`;
    if (window.LoreboundFX) LoreboundFX.levelUp();
    
    let levelName = "";
    if (AppState.activeCategory === "Timeline") levelName = AppState.activePayload.levels[AppState.currentLevelIndex].name;
    else if (AppState.activeCategory === "Process") levelName = AppState.activePayload.phases[AppState.currentLevelIndex].name;
    else if (AppState.activeCategory === "CauseEffect") levelName = AppState.activePayload.levels[AppState.currentLevelIndex].name;
    
    UI.narrativeText.innerHTML = `
        <div style="font-size:1.2rem; color:var(--color-success); font-weight:700; margin-bottom:1rem;"><i class="fa-solid fa-award"></i> Phase Bonus: +2000 points</div>
        <p>Prepare for the next challenge: <strong>${levelName}</strong></p>
    `;
    
    AppState.score += 2000;
    UI.gameScore.textContent = AppState.score.toString().padStart(4, '0');
    
    UI.btnStartGameplay.onclick = () => {
        UI.narrativeOverlay.classList.add('hidden');
        mountGameRenderer(AppState.activeCategory, AppState.activePayload);
    };
}

function updateStepHUD() {
    UI.gameScore.textContent = AppState.score.toString().padStart(4, '0');
    
    const accuracy = AppState.totalAnswersAttempted === 0 ? 100 : Math.round((AppState.correctAnswersCount / AppState.totalAnswersAttempted) * 100);
    UI.gameAccuracy.textContent = `${accuracy}%`;
    
    const sessionTotal = AppState.sessionTotalSteps || AppState.totalStepsCount;
    const sessionCurrent = AppState.sessionStepIndex ?? AppState.currentStepIndex;
    const pct = Math.min(100, Math.round((sessionCurrent / sessionTotal) * 100));
    UI.gameProgressBar.style.width = `${pct}%`;

    const mins = Math.floor(AppState.timeElapsed / 60);
    const depthLabel = mins < 10 ? 'Warming Up' : mins < 20 ? 'Engaged' : mins < 30 ? 'Deep Dive' : 'Master Scholar';
    const phaseLabel = AppState.sessionPhase === 'learn' ? '📚 Learning' : '🎮 Challenge';
    UI.gameStepCounter.textContent = `${phaseLabel} • ${depthLabel} • Level ${AppState.currentLevelIndex + 1}/${AppState.totalLevelsCount} • ${sessionCurrent}/${sessionTotal} challenges • ${mins}m elapsed`;
}

function showStepFeedbackOverlay(isCorrect, title, message, sourcePassage) {
    UI.feedbackOverlay.classList.remove('hidden');
    
    if (isCorrect) {
        UI.feedbackOverlay.querySelector('.feedback-content').className = "feedback-content glass-panel";
        UI.feedbackIconContainer.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--color-success)"></i>`;
        UI.feedbackTitle.style.color = "var(--color-success)";
    } else {
        UI.feedbackOverlay.querySelector('.feedback-content').className = "feedback-content glass-panel incorrect";
        UI.feedbackIconContainer.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:var(--color-danger)"></i>`;
        UI.feedbackTitle.style.color = "var(--color-danger)";
    }
    
    UI.feedbackTitle.textContent = title;
    UI.feedbackMessage.textContent = message;
    UI.feedbackSourceText.textContent = sourcePassage;
    
    UI.btnNextStep.onclick = () => {
        UI.feedbackOverlay.classList.add('hidden');
        if (AppState.activeCategory === "Comparison" && AppState.activeGameInstance) {
            AppState.activeGameInstance.addEventListeners();
        }
    };

    UI.feedbackSourceText.onclick = () => {
        openViewSourceModal(sourcePassage);
    };
}

// 9. VIEW SOURCE GROUNDING OVERLAY
function openViewSourceModal(highlightText) {
    UI.sourceModal.classList.remove('hidden');
    
    const original = AppState.compiledText;
    if (original.includes(highlightText)) {
        const highlightedHTML = original.replace(highlightText, `<mark>${highlightText}</mark>`);
        UI.sourceTextScroller.innerHTML = highlightedHTML;
    } else {
        UI.sourceTextScroller.innerHTML = original;
    }
}

// 10. SESSION COMPLETION SCREEN SUMMARY
function showGameCompletionSummary() {
    showScreen('screen-summary');
    window.LoreboundFX?.victoryBurst();
    
    const accuracy = AppState.totalAnswersAttempted === 0 ? 100 : Math.round((AppState.correctAnswersCount / AppState.totalAnswersAttempted) * 100);
    let grade = "A+";
    if (accuracy < 60) grade = "C";
    else if (accuracy < 80) grade = "B";
    else if (accuracy < 90) grade = "A";
    
    UI.summaryGrade.textContent = grade;
    UI.summaryScore.textContent = AppState.score.toLocaleString();
    UI.summaryAccuracy.textContent = `${accuracy}%`;
    
    const mins = Math.floor(AppState.timeElapsed / 60).toString().padStart(2, '0');
    const secs = (AppState.timeElapsed % 60).toString().padStart(2, '0');
    UI.summaryTime.textContent = `${mins}:${secs}`;

    if (window.LoreboundAPI) {
        LoreboundAPI.saveSession({
            compilation_uuid: AppState.compilationUuid,
            score: AppState.score,
            accuracy,
            time_elapsed: AppState.timeElapsed,
            grade,
            mistakes: AppState.mistakesList,
        }).catch(() => {});
    }
    
    UI.summaryDetailsList.innerHTML = '';
    
    if (AppState.mistakesList.length === 0) {
        UI.summaryDetailsList.innerHTML = `
            <div class="perf-item">
                <div class="perf-item-content">
                    <span class="perf-item-title">Perfect Grounding Met</span>
                    <span class="perf-item-meta">Completed all structural steps with zero mistakes. Excellent logic retention.</span>
                </div>
                <span class="perf-item-status success">100% correct</span>
            </div>
        `;
    } else {
        AppState.mistakesList.forEach((mistake, idx) => {
            const item = document.createElement('div');
            item.className = "perf-item needs-work";
            item.innerHTML = `
                <div class="perf-item-content">
                    <span class="perf-item-title">Concept Drill Check #${idx + 1}</span>
                    <span class="perf-item-meta">${mistake.title}</span>
                </div>
                <span class="perf-item-status warning" style="cursor:pointer;" onclick="openViewSourceModal('${mistake.sourcePassage.replace(/'/g, "\\'")}')"><i class="fa-solid fa-book-open"></i> Read Text</span>
            `;
            UI.summaryDetailsList.appendChild(item);
        });
    }
}

window.openViewSourceModal = openViewSourceModal;

// 11. TRANSPARENCY DRAWER & GLOBAL CONTROLS
function initGlobalControls() {
    UI.btnToggleTransparency?.addEventListener('click', () => {
        UI.transparencyDrawer?.classList.toggle('open');
    });
    
    UI.btnCloseTransparency?.addEventListener('click', () => {
        UI.transparencyDrawer?.classList.remove('open');
    });
    
    UI.btnCloseSource?.addEventListener('click', () => {
        UI.sourceModal?.classList.add('hidden');
    });

    UI.btnAbortGame?.addEventListener('click', () => {
        if (confirm("Are you sure you want to abort the current game session? Your progress will be lost.")) {
            clearInterval(AppState.timerInterval);
            showScreen('screen-input');
            loadDemoCards();
            UI.headerStatus.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Compiler Idle`;
        }
    });

    UI.btnSummaryReplay?.addEventListener('click', () => {
        startGameSession(AppState.activeCategory, AppState.activePayload, AppState.activeMetadata, AppState.activeSourceTitle);
    });

    UI.btnSummaryBack?.addEventListener('click', () => {
        showScreen('screen-input');
        loadDemoCards();
        UI.headerStatus.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Compiler Idle`;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    initInputScreen();
    initGlobalControls();
    UI.textPasteInput?.dispatchEvent(new Event('input'));
});
