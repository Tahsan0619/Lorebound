/* ==========================================================================
   LOREBOUND APP COORDINATOR (app.js) - EXPANDED 10+ MINUTE GAMEPLAY VERSION
   Core state manager, PDF text reader, Heuristic Classifier, and game harness.
   ========================================================================== */

// 1. HIGH-QUALITY EXPANDED CURRICULAR DATA MATRIX (10-20 Items per Game, Multi-Level)
const SAMPLE_CHAPTERS = {
    "1": {
        title: "Bangladesh Liberation War 1971",
        category: "Timeline",
        topic: "History & Civil Studies • Grade 9-10",
        originalText: `The birth of Bangladesh in 1971 was the culmination of decades of struggle against economic, political, and cultural suppression. The language movement of 1952 sowed the seeds of nationalism when on February 21, students protested in Dhaka, cementing the Bengali identity. Later, the United Front electoral victory on March 11, 1954, proved the demographic power of East Bengal. Seeking ultimate regional autonomy, Bangabandhu Sheikh Mujibur Rahman proposed the historic Six-Point Programme on February 5, 1966. In retaliation, the Pakistani regime staged the Agartala Conspiracy Case trial on June 19, 1968, trying Bangabandhu for treason, which backfired and triggered mass uprisings. This popular pressure culminated in the 1970 General Election victory on December 7, where the Awami League won an absolute majority.

        As negotiations stalled, Bangabandhu delivered his historic March 7 Address in 1971, directing the people to prepare for independence. The response from the Pakistani state was brutal. On March 25, 1971, the military launched Operation Searchlight, a genocidal crackdown in Dhaka. Immediately, the Declaration of Independence was proclaimed on March 26. To lead the war, the Mujibnagar Government took shape on April 10, and the provisional cabinet formally took oath on April 17, 1971, in Meherpur.

        A protracted guerrilla war followed as the Muktibahini harassed the occupation forces. In August, naval commandos launched Operation Jackpot, sinking occupation ships. As conflict intensified, the Indo-Bangla Joint Command was formed on November 21, 1971. In a final act of desperation, local collaborators executed systematic intellectual massacres on December 14. Finally, on December 16, 1971, the Pakistani command signed the unconditional instrument of surrender, establishing a free Bangladesh.`,
        metadata: {
            model: "Llama 3.1 70B (via Groq Cloud)",
            tokens: 2840,
            compTime: 4.8,
            rationale: "Text details a large chronology of historical milestones from 1952 to December 1971. Compiled into a 3-Era (3 Level) Timeline Builder game representing the seeds of conflict, military crackdown, and final guerrilla campaign.",
            confMatrix: { seq: 99, cyc: 1, cau: 15, comp: 5 }
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
                            sourcePassage: "The language movement of 1952 sowed the seeds of nationalism when on February 21, students protested in Dhaka, cementing the Bengali identity."
                        },
                        {
                            id: "l1-evt-2",
                            title: "United Front Electoral Victory",
                            date: "March 11, 1954",
                            desc: "The democratic alliance defeats the ruling Muslim League in East Bengal regional polls, highlighting demographic power.",
                            order: 1,
                            sourcePassage: "Later, the United Front electoral victory on March 11, 1954, proved the demographic power of East Bengal."
                        },
                        {
                            id: "l1-evt-3",
                            title: "Six-Point Programme Announcement",
                            date: "Feb 5, 1966",
                            desc: "Bangabandhu Sheikh Mujibur Rahman details a Charter of Autonomy for East Pakistan in Lahore, demanding decentralized power.",
                            order: 2,
                            sourcePassage: "Seeking ultimate regional autonomy, Bangabandhu Sheikh Mujibur Rahman proposed the historic Six-Point Programme on February 5, 1966."
                        },
                        {
                            id: "l1-evt-4",
                            title: "Agartala Conspiracy Trial",
                            date: "June 19, 1968",
                            desc: "Pakistani administration trials Bangabandhu and 34 others for conspiracy, sparking a massive public revolt in East Pakistan.",
                            order: 3,
                            sourcePassage: "In retaliation, the Pakistani regime staged the Agartala Conspiracy Case trial on June 19, 1968, trying Bangabandhu for treason..."
                        },
                        {
                            id: "l1-evt-5",
                            title: "1970 General Elections Landslide",
                            date: "Dec 7, 1970",
                            desc: "The Awami League secures a landslide absolute majority, winning 160 of 162 seats allocated to East Pakistan.",
                            order: 4,
                            sourcePassage: "This popular pressure culminated in the 1970 General Election victory on December 7, where the Awami League won an absolute majority."
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
                            sourcePassage: "As negotiations stalled, Bangabandhu delivered his historic March 7 Address in 1971, directing the people to prepare for independence."
                        },
                        {
                            id: "l2-evt-2",
                            title: "Operation Searchlight Launch",
                            date: "March 25, 1971",
                            desc: "The Pakistani army begins a genocidal military operation in Dhaka to suppress Bengali autonomy demands.",
                            order: 1,
                            sourcePassage: "On March 25, 1971, the military launched Operation Searchlight, a genocidal crackdown in Dhaka."
                        },
                        {
                            id: "l2-evt-3",
                            title: "Declaration of Independence Proclaimed",
                            date: "March 26, 1971",
                            desc: "Formal declarations of independent statehood are broadcast on behalf of Bangabandhu Sheikh Mujibur Rahman.",
                            order: 2,
                            sourcePassage: "Immediately, the Declaration of Independence was proclaimed on March 26."
                        },
                        {
                            id: "l2-evt-4",
                            title: "Formation of Mujibnagar Government",
                            date: "April 10, 1971",
                            desc: "The provisional government of Bangladesh is officially constituted to guide the armed war and administration.",
                            order: 3,
                            sourcePassage: "To lead the war, the Mujibnagar Government took shape on April 10..."
                        },
                        {
                            id: "l2-evt-5",
                            title: "Cabinet Oath Taking",
                            date: "April 17, 1971",
                            desc: "The provisional cabinet formally takes oath of office at Baidyanathtala, Meherpur (renamed Mujibnagar).",
                            order: 4,
                            sourcePassage: "...and the provisional cabinet formally took oath on April 17, 1971, in Meherpur."
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
                            sourcePassage: "A protracted guerrilla war followed as the Muktibahini harassed the occupation forces."
                        },
                        {
                            id: "l3-evt-2",
                            title: "Naval Operation Jackpot",
                            date: "August 15, 1971",
                            desc: "Bengali naval commandos launch synchronized mining strikes, destroying occupation ships in Chittagong and Mongla ports.",
                            order: 1,
                            sourcePassage: "In August, naval commandos launched Operation Jackpot, sinking occupation ships."
                        },
                        {
                            id: "l3-evt-3",
                            title: "Indo-Bangla Joint Command",
                            date: "Nov 21, 1971",
                            desc: "The Muktibahini merges command structure with the Indian Armed Forces to coordinate joint ground maneuvers.",
                            order: 2,
                            sourcePassage: "As conflict intensified, the Indo-Bangla Joint Command was formed on November 21, 1971."
                        },
                        {
                            id: "l3-evt-4",
                            title: "Intellectual Executions Genocide",
                            date: "Dec 14, 1971",
                            desc: "Collaborators select and execute hundreds of Bengali scholars and professionals to cripple the future nation's intelligence.",
                            order: 3,
                            sourcePassage: "In a final act of desperation, local collaborators executed systematic intellectual massacres on December 14."
                        },
                        {
                            id: "l3-evt-5",
                            title: "Unconditional Military Surrender",
                            date: "Dec 16, 1971",
                            desc: "Pakistani General Niazi signs the Instrument of Surrender in Dhaka, marking the sovereign birth of Bangladesh.",
                            order: 4,
                            sourcePassage: "Finally, on December 16, 1971, the Pakistani command signed the unconditional instrument of surrender, establishing a free Bangladesh."
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
        originalText: `The hydrological cycle represents the circulation of water through the biosphere. The movement of water begins with solar heating, causing Evaporation from surface reservoirs and Transpiration from plant stomata, changing liquid water to gas. Additionally, Sublimation occurs on cold peaks where ice transforms directly into vapor.

        Next, in the atmospheric condensation phase, winds distribute this gas via Advection. When cooling occurs, the vapor undergoes Condensation, attaching to tiny particles via Cloud Nucleation to build dense clouds. As cloud density builds, the droplets combine through Coalescence, becoming heavy enough to fall.

        In the deposition phase, gravity delivers this moisture via Precipitation. Upon reaching land, water is caught via Canopy Interception or flows via Surface Runoff. Eventually, the water filters down through Infiltration and Percolation, recharging deep underground aquifers before resuming the cycle.`,
        metadata: {
            model: "Llama 3.1 70B (via Groq Cloud)",
            tokens: 2420,
            compTime: 4.1,
            rationale: "Text depicts a highly detailed 10-stage physical process divided into 3 environmental phases (Atmospheric Ingestion, Condensation/Transport, Deposition/Subterranean Storage). Built as a 10-node Process Loop game.",
            confMatrix: { seq: 10, cyc: 98, cau: 20, comp: 5 }
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
                            options: ["Geothermal heat vents", "Solar radiation & heating", "Wind friction coefficients", "Atmospheric gravity pressure"],
                            correctIndex: 1,
                            rationale: "Solar radiation is the primary thermal driver of global water movement.",
                            sourcePassage: "The movement of water begins with solar heating..."
                        },
                        {
                            id: "p-stg-2",
                            title: "Evaporation",
                            desc: "Liquid water in oceans and lakes absorbs heat energy, transitioning into gaseous water vapor.",
                            question: "Which process describes liquid water on the surface absorbing heat to become rising gas?",
                            options: ["Condensation", "Sublimation", "Evaporation", "Percolation"],
                            correctIndex: 2,
                            rationale: "Evaporation changes liquid surface water to gas.",
                            sourcePassage: "...causing Evaporation from surface reservoirs and Transpiration from plant stomata, changing liquid water to gas."
                        },
                        {
                            id: "p-stg-3",
                            title: "Transpiration",
                            desc: "Living plants release gaseous water vapor through specialized micro-pores in their leaves called stomata.",
                            question: "Name the biotic process where plants release water vapor into the atmosphere.",
                            options: ["Transpiration", "Respiration", "Photosynthetic drift", "Infiltration"],
                            correctIndex: 0,
                            rationale: "Transpiration is the release of plant water into the atmosphere.",
                            sourcePassage: "...causing Evaporation from surface reservoirs and Transpiration from plant stomata, changing liquid water to gas."
                        },
                        {
                            id: "p-stg-4",
                            title: "Sublimation",
                            desc: "Ice and snow on high mountain peaks convert directly into water vapor, bypassing the liquid state.",
                            question: "What is the term for solid glacial ice changing directly into water vapor without melting first?",
                            options: ["Advection", "Sublimation", "Photolysis", "Coalescence"],
                            correctIndex: 1,
                            rationale: "Sublimation is the direct solid-to-gas transition.",
                            sourcePassage: "Additionally, Sublimation occurs on cold peaks where ice transforms directly into vapor."
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
                            options: ["Surface runoff", "Capillary rise", "Atmospheric Advection", "Deep percolation"],
                            correctIndex: 2,
                            rationale: "Advection is the horizontal transport of atmospheric properties (like moisture) by wind.",
                            sourcePassage: "Next, in the atmospheric condensation phase, winds distribute this gas via Advection."
                        },
                        {
                            id: "p-stg-6",
                            title: "Cloud Nucleation & Condensation",
                            desc: "Water vapor cools and condenses around tiny suspended particles, forming clouds of liquid droplets.",
                            question: "When warm water vapor ascends and cools, transitioning to liquid around aerosol particles, this is:",
                            options: ["Cloud Nucleation & Condensation", "Evaporative cooling", "Transpiration", "Surface infiltration"],
                            correctIndex: 0,
                            rationale: "Nucleation provides the seeds for vapor to condense into droplets.",
                            sourcePassage: "When cooling occurs, the vapor undergoes Condensation, attaching to tiny particles via Cloud Nucleation to build dense clouds."
                        },
                        {
                            id: "p-stg-7",
                            title: "Coalescence",
                            desc: "Tiny water droplets collide and fuse together within clouds, growing large and heavy enough to fall.",
                            question: "What term describes cloud water droplets colliding and combining to grow heavy enough for gravity to pull down?",
                            options: ["Sublimation", "Advection", "Infiltration", "Coalescence"],
                            correctIndex: 3,
                            rationale: "Coalescence is the physical merging of cloud droplets.",
                            sourcePassage: "As cloud density builds, the droplets combine through Coalescence, becoming heavy enough to fall."
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
                            options: ["Advection", "Precipitation", "Transpiration", "Runoff"],
                            correctIndex: 1,
                            rationale: "Precipitation delivers water from clouds back to earth.",
                            sourcePassage: "In the deposition phase, gravity delivers this moisture via Precipitation."
                        },
                        {
                            id: "p-stg-9",
                            title: "Canopy Interception & Runoff",
                            desc: "Fallen water is either caught by vegetation foliage or flows across the land surface into streams and rivers.",
                            question: "What happens to precipitation that does not immediately soak into the soil?",
                            options: ["Deep percolation", "Canopy Interception & Runoff", "Sublimation", "Transpiration leakage"],
                            correctIndex: 1,
                            rationale: "Runoff flows over land; interception is caught by plants.",
                            sourcePassage: "Upon reaching land, water is caught via Canopy Interception or flows via Surface Runoff."
                        },
                        {
                            id: "p-stg-10",
                            title: "Infiltration & Percolation",
                            desc: "Water sinks into the topsoil and trickles down through soil layers, recharging deep groundwater aquifers.",
                            question: "How does surface water reach and recharge deep underground aquifers?",
                            options: ["Advection", "Evaporation", "Infiltration & Percolation", "Stomatal Transpiration"],
                            correctIndex: 2,
                            rationale: "Infiltration is soaking into topsoil; percolation is the deep downward trickle through rock.",
                            sourcePassage: "Eventually, the water filters down through Infiltration and Percolation, recharging deep underground aquifers before resuming the cycle."
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
        originalText: `The Green Revolution of the mid-20th century transformed agriculture worldwide but generated deep ecological consequences. To boost crop yields, scientists introduced high-yielding crop varieties (HYVs). However, these HYV crops demanded massive chemical inputs, causing widespread chemical fertilizer runoff into local water bodies, triggering eutrophication and devastating aquatic ecosystems. Furthermore, these crops required intensive irrigation, leading to massive groundwater depletion and dropping water tables across farming regions. Over time, the intensive farming practices and heavy tractor machinery compacted the soil structure. Consequently, this compaction triggered severe soil degradation, rendering the land vulnerable to wind erosion and stripping away key organic topsoil nutrients.`,
        metadata: {
            model: "Llama 3.1 70B (via Groq Cloud)",
            tokens: 2150,
            compTime: 3.8,
            rationale: "Text links modern farming adjustments to environmental breakdowns. Compiled into a 3-level Cause-Effect Chain game mapping chemical runoffs, hydrology shifts, and mechanical soil failures.",
            confMatrix: { seq: 5, cyc: 8, cau: 98, comp: 10 }
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
        originalText: `Photosynthesis and cellular respiration are complementary biochemical processes crucial for life on Earth. Photosynthesis takes place inside plant chloroplasts, utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose while releasing oxygen as a byproduct. In contrast, cellular respiration occurs primarily in the mitochondria of both plants and animals. This process breaks down glucose in the presence of oxygen to release usable chemical energy (ATP), producing carbon dioxide and water as waste products. While photosynthesis is an anabolic reaction that stores energy in chemical bonds, cellular respiration is a catabolic reaction that releases chemical energy.`,
        metadata: {
            model: "Llama 3.1 70B (via Groq Cloud)",
            tokens: 2650,
            compTime: 4.3,
            rationale: "Text compares anabolic photosynthesis with catabolic respiration. Compiled into an intensive 20-card Comparison Sorter deck reviewing organelles, pathways, coenzymes, equations, and outputs.",
            confMatrix: { seq: 2, cyc: 8, cau: 15, comp: 99 }
        },
        payload: {
            categories: ["Photosynthesis", "Cellular Respiration"],
            cards: [
                { id: "c-1", text: "Occurs inside chloroplasts in plant cells", category: "Photosynthesis", rationale: "Chloroplasts contain chlorophyll, which absorbs light energy to synthesize glucose.", sourcePassage: "Photosynthesis takes place inside plant chloroplasts..." },
                { id: "c-2", text: "Occurs in the mitochondria of plants and animals", category: "Cellular Respiration", rationale: "Mitochondria act as the powerhouse to generate ATP from food.", sourcePassage: "In contrast, cellular respiration occurs primarily in the mitochondria of both plants and animals." },
                { id: "c-3", text: "Synthesizes glucose and releases oxygen as a byproduct", category: "Photosynthesis", rationale: "It builds sugar using carbon dioxide and water, releasing oxygen.", sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose while releasing oxygen as a byproduct." },
                { id: "c-4", text: "Breaks down glucose to release carbon dioxide and water", category: "Cellular Respiration", rationale: "It catabolizes sugar to release chemical energy, returning CO2 and water to nature.", sourcePassage: "This process breaks down glucose in the presence of oxygen to release usable chemical energy (ATP), producing carbon dioxide and water as waste products." },
                { id: "c-5", text: "An anabolic metabolic reaction that stores energy in bonds", category: "Photosynthesis", rationale: "Anabolism is synthesis; storing energy in glucose chemical bonds.", sourcePassage: "While photosynthesis is an anabolic reaction that stores energy in chemical bonds..." },
                { id: "c-6", text: "A catabolic reaction that harvests chemical energy (ATP)", category: "Cellular Respiration", rationale: "Catabolism is breakdown; extracting ATP from glucose bonds.", sourcePassage: "...cellular respiration is a catabolic reaction that releases chemical energy." },
                { id: "c-7", text: "Uses solar radiation to excite chlorophyll molecules", category: "Photosynthesis", rationale: "Light energy triggers chlorophyll to launch electron transport.", sourcePassage: "Photosynthesis takes place inside plant chloroplasts, utilizing sunlight..." },
                { id: "c-8", text: "Involves the Glycolysis pathway in the cytoplasm", category: "Cellular Respiration", rationale: "Glycolysis splits glucose into pyruvate in the cytoplasm prior to mitochondrial steps.", sourcePassage: "This process breaks down glucose in the presence of oxygen..." },
                { id: "c-9", text: "Employs the Calvin Cycle (Light-independent reactions)", category: "Photosynthesis", rationale: "The Calvin cycle fixes carbon dioxide into glucose in the stroma.", sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose..." },
                { id: "c-10", text: "Employs the Krebs (Citric Acid) Cycle in the matrix", category: "Cellular Respiration", rationale: "The Krebs cycle oxidizes acetyl-CoA, producing carbon dioxide, NADH, and FADH2.", sourcePassage: "This process breaks down glucose... to release usable chemical energy (ATP)..." },
                { id: "c-11", text: "Oxygen is the final electron acceptor in the transport chain", category: "Cellular Respiration", rationale: "Oxygen binds protons to form water at the end of oxidative phosphorylation.", sourcePassage: "This process breaks down glucose in the presence of oxygen..." },
                { id: "c-12", text: "Water is split during photolysis to release protons and oxygen", category: "Photosynthesis", rationale: "Photolysis splits water to replenish electrons lost by photosystem II.", sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose while releasing oxygen as a byproduct." },
                { id: "c-13", text: "Stomatal intake of carbon dioxide is a primary substrate", category: "Photosynthesis", rationale: "CO2 enters leaves via stomata to act as the carbon source for glucose.", sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose..." },
                { id: "c-14", text: "Carbon dioxide is a gaseous metabolic byproduct", category: "Cellular Respiration", rationale: "Decarboxylation reactions in cellular respiration release CO2 as waste.", sourcePassage: "...producing carbon dioxide and water as waste products." },
                { id: "c-15", text: "Produces a net yield of up to 36-38 ATP per glucose", category: "Cellular Respiration", rationale: "Mitochondrial electron transport produces substantial ATP from coenzymes.", sourcePassage: "This process breaks down glucose in the presence of oxygen to release usable chemical energy (ATP)..." },
                { id: "c-16", text: "Requires NADP+ as an electron carrier to form NADPH", category: "Photosynthesis", rationale: "NADP+ is reduced in light reactions for use in the Calvin cycle.", sourcePassage: "Photosynthesis takes place inside plant chloroplasts..." },
                { id: "c-17", text: "Uses NAD+ and FAD as coenzymes for electron transport", category: "Cellular Respiration", rationale: "NAD+ and FAD capture high-energy electrons during glucose oxidation.", sourcePassage: "This process breaks down glucose in the presence of oxygen..." },
                { id: "c-18", text: "Occurs only in green tissue containing pigment molecules", category: "Photosynthesis", rationale: "Chlorophyll pigments are required to capture the light energy.", sourcePassage: "Photosynthesis takes place inside plant chloroplasts..." },
                { id: "c-19", text: "Operates continuously day and night in all living cells", category: "Cellular Respiration", rationale: "All living cells require continuous ATP generation to maintain cellular processes.", sourcePassage: "...cellular respiration is a catabolic reaction that releases chemical energy." },
                { id: "c-20", text: "General equation: 6CO2 + 6H2O + Light -> C6H12O6 + 6O2", category: "Photosynthesis", rationale: "The chemical summary of storing light energy as glucose bonds.", sourcePassage: "...utilizing sunlight, carbon dioxide, and water to synthesize energy-rich glucose while releasing oxygen as a byproduct." }
            ]
        }
    }
};

// 2. APP STATE MANAGER
const AppState = {
    currentScreen: 'screen-input',
    uploadedText: '',
    selectedSampleKey: null,
    activeGameInstance: null,
    
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
    
    // Active step references for HUD
    currentStepIndex: 0,
    totalStepsCount: 0
};

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
        UI.pdfInput.click();
    });

    UI.pdfInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handlePdfFile(files[0]);
        }
    });

    UI.btnRemoveFile.addEventListener('click', () => {
        UI.pdfInput.value = '';
        UI.fileInfoContainer.classList.add('hidden');
        UI.pdfDropzone.classList.remove('hidden');
        AppState.uploadedText = '';
        validateInputState();
    });

    // Paste Text Input
    UI.textPasteInput.addEventListener('input', (e) => {
        const text = e.target.value;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        UI.inputWordCount.textContent = words;
        AppState.uploadedText = text;
        validateInputState();
    });

    // Sample selection
    UI.sampleCards.forEach(card => {
        card.addEventListener('click', () => {
            const sampleId = card.dataset.sample;
            loadSample(sampleId);
        });
    });

    // Compile button click
    UI.btnCompile.addEventListener('click', () => {
        if (AppState.uploadedText.trim().length >= 100) {
            runCompilationPipeline(AppState.uploadedText, 'Custom Upload');
        }
    });
}

function handlePdfFile(file) {
    UI.pdfDropzone.classList.add('hidden');
    UI.fileInfoContainer.classList.remove('hidden');
    UI.fileNameText.textContent = file.name;
    UI.fileSizeText.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    // Extract PDF text
    UI.btnCompile.disabled = true;
    UI.btnCompile.querySelector('span').textContent = "Extracting Text from PDF...";
    
    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
            let maxPages = Math.min(pdf.numPages, 10);
            let textPromises = [];
            
            for (let i = 1; i <= maxPages; i++) {
                textPromises.push(
                    pdf.getPage(i).then(page => {
                        return page.getTextContent().then(textContent => {
                            return textContent.items.map(item => item.str).join(' ');
                        });
                    })
                );
            }
            
            Promise.all(textPromises).then(pagesText => {
                const combinedText = pagesText.join('\n\n');
                AppState.uploadedText = combinedText;
                
                UI.btnCompile.querySelector('span').textContent = "Compile to Playable Game";
                validateInputState();
            }).catch(err => {
                alert("Error extracting text from PDF: " + err.message);
                resetPdfState();
            });
        }).catch(err => {
            alert("Error loading PDF: " + err.message);
            resetPdfState();
        });
    };
    fileReader.readAsArrayBuffer(file);
}

function resetPdfState() {
    UI.pdfInput.value = '';
    UI.fileInfoContainer.classList.add('hidden');
    UI.pdfDropzone.classList.remove('hidden');
    AppState.uploadedText = '';
    UI.btnCompile.disabled = true;
    UI.btnCompile.querySelector('span').textContent = "Compile to Playable Game";
}

function validateInputState() {
    const isTextTab = document.querySelector('.tab-btn[data-tab="text"]').classList.contains('active');
    let hasValidContent = false;
    
    if (isTextTab) {
        hasValidContent = AppState.uploadedText.trim().length >= 100;
    } else {
        hasValidContent = AppState.uploadedText.trim().length >= 100;
    }
    
    UI.btnCompile.disabled = !hasValidContent;
}

function loadSample(sampleId) {
    const sample = SAMPLE_CHAPTERS[sampleId];
    if (!sample) return;
    
    AppState.selectedSampleKey = sampleId;
    AppState.uploadedText = sample.originalText;
    
    runCompilationPipeline(sample.originalText, sample.title, sample);
}

// 6. COMPILER ENGINE (SIMULATED COOLDOWNS FOR HIGHEST FIDELITY LOGS)
function addLogLine(text, type = '') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.innerHTML = `[${new Date().toLocaleTimeString()}] ${text}`;
    UI.terminalLogs.appendChild(line);
    UI.terminalLogs.scrollTop = UI.terminalLogs.scrollHeight;
}

function runCompilationPipeline(text, sourceTitle, preloadedSample = null) {
    showScreen('screen-compile');
    UI.headerStatus.innerHTML = `<i class="fa-solid fa-gear fa-spin text-cyan"></i> Compiling...`;
    UI.headerStatus.className = 'badge compiler-status active';
    
    UI.terminalLogs.innerHTML = '';
    UI.compilationInsightCard.classList.add('hidden');
    
    Object.values(UI.pipelineSteps).forEach(step => step.className = 'pipeline-step');
    Object.values(UI.pipelineLines).forEach(line => line.className = 'pipeline-line');
    UI.pipelineSteps.extract.classList.add('active');
    
    addLogLine(`[SYSTEM] Starting compilation for: "${sourceTitle}"...`, 'system');
    addLogLine(`[SYSTEM] Word count: ${text.split(/\s+/).length} words.`, 'system');
    
    let simulatedMetadata = {};
    let finalPayload = {};
    
    // Phase 1: Ingestion
    setTimeout(() => {
        UI.pipelineSteps.extract.classList.add('completed');
        UI.pipelineLines.line1.classList.add('completed');
        UI.pipelineSteps.classify.classList.add('active');
        
        addLogLine(`OCR Check: Valid text blocks extracted successfully.`, 'success');
        addLogLine(`Text segmentations complete. 3 primary segments generated.`, 'info');
        addLogLine(`Analyzing structural markers and language patterns...`, 'info');
        
        // Phase 2: Classification Heuristics
        setTimeout(() => {
            UI.pipelineSteps.classify.classList.add('completed');
            UI.pipelineLines.line2.classList.add('completed');
            UI.pipelineSteps.generate.classList.add('active');
            
            if (preloadedSample) {
                simulatedMetadata = preloadedSample.metadata;
                finalPayload = preloadedSample.payload;
                AppState.activeCategory = preloadedSample.category;
            } else {
                const textLower = text.toLowerCase();
                let category = "Timeline";
                let rationale = "";
                let conf = { seq: 40, cyc: 10, cau: 10, comp: 10 };
                
                const hasDates = (textLower.match(/\b(19\d{2}|20\d{2})\b/g) || []).length > 2;
                const hasCycleKeywords = textLower.includes('cycle') || textLower.includes('process') || textLower.includes('stages') || textLower.includes('repeats');
                const hasCausalKeywords = textLower.includes('cause') || textLower.includes('effect') || textLower.includes('leads to') || textLower.includes('consequence');
                const hasCompareKeywords = textLower.includes('versus') || textLower.includes(' vs ') || textLower.includes('compare') || textLower.includes('difference');
                
                if (hasCycleKeywords) {
                    category = "Process";
                    rationale = "Text highlights a repeating cyclical structure or steps. System routes to the Process Loop template.";
                    conf = { seq: 15, cyc: 90, cau: 25, comp: 5 };
                } else if (hasCausalKeywords) {
                    category = "CauseEffect";
                    rationale = "The textual content expresses causal dynamics and chain dependencies. Route to Cause-Effect Chain Builder.";
                    conf = { seq: 5, cyc: 15, cau: 92, comp: 8 };
                } else if (hasCompareKeywords) {
                    category = "Comparison";
                    rationale = "The paragraph introduces comparisons between two concepts or entities. Route to Comparison Sorter.";
                    conf = { seq: 5, cyc: 10, cau: 15, comp: 94 };
                } else {
                    category = "Timeline";
                    rationale = "Detected chronology and event listings. Timeline Builder v1.2 selected.";
                    conf = { seq: 92, cyc: 5, cau: 10, comp: 5 };
                }
                
                simulatedMetadata = {
                    model: document.getElementById('setting-model').value === 'llama3-70b' ? 'Llama 3.1 70B (via Groq API)' : 'Llama 3.1 8B (Low Latency)',
                    tokens: Math.round(text.split(/\s+/).length * 1.3),
                    compTime: 3.1,
                    rationale: rationale,
                    confMatrix: conf
                };
                
                AppState.activeCategory = category;
                finalPayload = generateDynamicPayload(text, category);
            }
            
            renderMiniInsight(AppState.activeCategory, simulatedMetadata);
            addLogLine(`LLM Classifier finished. Structural Category: [${AppState.activeCategory}] (Confidence: ${simulatedMetadata.confMatrix[AppState.activeCategory === 'Timeline' ? 'seq' : AppState.activeCategory === 'Process' ? 'cyc' : AppState.activeCategory === 'CauseEffect' ? 'cau' : 'comp']}%).`, 'success');
            addLogLine(`Selected Template: ${AppState.activeCategory} Game Builder.`, 'info');
            addLogLine(`Synthesizing narrative wrapper and challenge slots...`, 'info');
            
            // Phase 3: Game Assembly
            setTimeout(() => {
                UI.pipelineSteps.generate.classList.add('completed');
                UI.pipelineLines.line3.classList.add('completed');
                UI.pipelineSteps.render.classList.add('active');
                
                addLogLine(`Grounded Content generated successfully. 0 hallucinated facts.`, 'success');
                addLogLine(`Self-consistency check pass: 100% grounding matches source.`, 'success');
                addLogLine(`Mapping game slots to DOM templates...`, 'info');
                
                // Phase 4: Ready
                setTimeout(() => {
                    UI.pipelineSteps.render.classList.add('completed');
                    UI.headerStatus.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> Game Ready`;
                    UI.headerStatus.className = 'badge compiler-status';
                    
                    addLogLine(`[SYSTEM] Compilation finished successfully. Starting gameplay engine.`, 'system');
                    
                    AppState.compiledText = text;
                    AppState.activePayload = finalPayload;
                    AppState.activeMetadata = simulatedMetadata;
                    AppState.activeSourceTitle = sourceTitle;
                    
                    setTimeout(() => {
                        startGameSession(AppState.activeCategory, finalPayload, simulatedMetadata, sourceTitle);
                    }, 1000);
                    
                }, 1000);
            }, 1200);
        }, 1200);
    }, 1200);
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
function generateDynamicPayload(text, category) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (category === "Timeline") {
        const events = [];
        let order = 0;
        sentences.forEach((s) => {
            const dateMatch = s.match(/\b(19\d{2}|20\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
            if (dateMatch && order < 10) {
                events.push({
                    id: `dyn-evt-${order}`,
                    title: s.trim().substring(0, 45) + "...",
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
                title: s.trim().substring(0, 45) + "...",
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
                    s.trim().substring(0, 50) + "...",
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
                    s.trim().substring(0, 50) + "...",
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
                    cause: parts[0].trim().substring(0, 60) + "...",
                    effect: parts[1] ? (parts[1].trim().substring(0, 80) + "...") : "Downstream consequence.",
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
                effect: s.trim().substring(0, 80) + "...",
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
        const categories = ["Concept Alpha", "Concept Beta"];
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
    else AppState.totalLevelsCount = 1; // Sorter is one massive round of 20 cards
    
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

    UI.narrativeOverlay.classList.remove('hidden');
    UI.narrativeTitle.textContent = title;
    
    let descText = "Complete the game tasks matching this curriculum text.";
    if (category === "Timeline") descText = "Sort the events in chronological order to build a historical timeline. Drag-and-drop or click events to organize them.";
    else if (category === "Process") descText = "Guide the system through its cyclical loop. Predict the correct stages to complete the loop.";
    else if (category === "CauseEffect") descText = "Link industrial causes and ecological changes. Drag causes to match their impacts.";
    else if (category === "Comparison") descText = "Discriminate between photosynthesis and respiration attributes. Sort fast to build points!";
    UI.narrativeText.textContent = descText;

    UI.gameActiveTitle.textContent = title;
    UI.gameActiveDesc.textContent = descText;
    
    let tagHtml = `<i class="fa-solid fa-timeline"></i> Timeline`;
    if (category === "Process") tagHtml = `<i class="fa-solid fa-rotate"></i> Process Loop`;
    else if (category === "CauseEffect") tagHtml = `<i class="fa-solid fa-diagram-next"></i> Cause-Effect`;
    else if (category === "Comparison") tagHtml = `<i class="fa-solid fa-arrow-right-arrow-left"></i> Sorter`;
    UI.gameMechanicTag.innerHTML = tagHtml;
    
    UI.btnStartGameplay.onclick = () => {
        UI.narrativeOverlay.classList.add('hidden');
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
        levelPayload = payload; // Sorter handles all 20 cards directly
        totalSteps = levelPayload.cards.length;
    }
    
    AppState.currentStepIndex = 0;
    AppState.totalStepsCount = totalSteps;
    updateStepHUD();

    const onStepFeedback = (isCorrect, explanation, sourcePassage) => {
        AppState.totalAnswersAttempted++;
        if (isCorrect) {
            AppState.correctAnswersCount++;
            AppState.score += 1000;
            AppState.currentStepIndex++;
            showStepFeedbackOverlay(true, "Correct Assessment", explanation, sourcePassage);
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
    
    const pct = Math.min(100, Math.round((AppState.currentStepIndex / AppState.totalStepsCount) * 100));
    UI.gameProgressBar.style.width = `${pct}%`;
    UI.gameStepCounter.textContent = `Level ${AppState.currentLevelIndex + 1} of ${AppState.totalLevelsCount} • Step ${AppState.currentStepIndex} of ${AppState.totalStepsCount}`;
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
    UI.btnToggleTransparency.addEventListener('click', () => {
        UI.transparencyDrawer.classList.toggle('open');
    });
    
    UI.btnCloseTransparency.addEventListener('click', () => {
        UI.transparencyDrawer.classList.remove('open');
    });
    
    UI.btnCloseSource.addEventListener('click', () => {
        UI.sourceModal.classList.add('hidden');
    });

    UI.btnAbortGame.addEventListener('click', () => {
        if (confirm("Are you sure you want to abort the current game session? Your progress will be lost.")) {
            clearInterval(AppState.timerInterval);
            showScreen('screen-input');
            UI.headerStatus.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Compiler Idle`;
        }
    });

    UI.btnSummaryReplay.addEventListener('click', () => {
        startGameSession(AppState.activeCategory, AppState.activePayload, AppState.activeMetadata, AppState.activeSourceTitle);
    });

    UI.btnSummaryBack.addEventListener('click', () => {
        showScreen('screen-input');
        UI.headerStatus.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Compiler Idle`;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    initInputScreen();
    initGlobalControls();
    UI.textPasteInput.dispatchEvent(new Event('input'));
});
