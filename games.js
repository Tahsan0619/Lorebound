/* ==========================================================================
   LOREBOUND GAME MECHANIC RENDERERS (games.js)
   Fully Interactive Client-Side Game Templates:
   1. TimelineBuilder (Sequential)
   2. ProcessLoop (Cyclical)
   3. CauseEffectChain (Causal)
   4. ComparisonSorter (Comparative)
   ========================================================================== */

// Helper: Shuffles an array
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// --------------------------------------------------------------------------
// 1. TIMELINE BUILDER
// --------------------------------------------------------------------------
class TimelineGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.events = payload.events; // Array of { id, title, date, desc, order, rationale, sourcePassage }
        this.onStepFeedback = onStepFeedback; // Callback for correct/incorrect step
        this.onGameComplete = onGameComplete; // Callback when finished
        
        this.slots = []; // Array of slot data
        this.deck = [];  // Array of currently shuffled events
        this.placedEvents = {}; // Map: slotIndex -> eventObject
        
        this.selectedCardId = null; // For click-to-place accessibility on mobile
        
        this.init();
    }

    init() {
        this.slots = this.events.map((e, index) => ({
            index: index,
            expectedOrder: e.order,
            label: `Slot ${index + 1}`
        }));
        
        this.deck = shuffleArray(this.events);
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="timeline-game-container">
                <p class="timeline-instructions"><i class="fa-solid fa-circle-info"></i> Drag events into the slots in chronological order, or click a card then a slot to place it.</p>
                <div class="timeline-track">
                    ${this.slots.map(slot => {
                        const placed = this.placedEvents[slot.index];
                        const isFilled = !!placed;
                        return `
                            <div class="timeline-slot ${isFilled ? 'filled' : ''}" data-slot-index="${slot.index}">
                                <span class="slot-marker">${slot.label}</span>
                                ${isFilled ? `
                                    <div class="placed-card">
                                        <span class="event-date-hint">${placed.date}</span>
                                        <div class="event-title">${placed.title}</div>
                                        <button class="btn-remove-placed" data-remove-slot="${slot.index}"><i class="fa-solid fa-trash-can"></i></button>
                                    </div>
                                ` : `
                                    <div class="slot-placeholder"><i class="fa-solid fa-arrow-down-to-bracket"></i> Drop Here</div>
                                `}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="timeline-deck" id="timeline-event-deck">
                    ${this.deck.map(evt => {
                        // Don't show in deck if already placed
                        const isPlaced = Object.values(this.placedEvents).some(pe => pe.id === evt.id);
                        if (isPlaced) return '';
                        return `
                            <div class="event-card ${this.selectedCardId === evt.id ? 'active-drag' : ''}" 
                                 draggable="true" 
                                 data-event-id="${evt.id}">
                                <span class="event-date-hint"><i class="fa-solid fa-calendar-days"></i> ${evt.date}</span>
                                <div class="event-title">${evt.title}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        const cards = this.container.querySelectorAll('.event-card');
        const slots = this.container.querySelectorAll('.timeline-slot');
        
        // Drag Events
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', card.dataset.eventId);
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            // Click to select (mobile support)
            card.addEventListener('click', (e) => {
                const eventId = card.dataset.eventId;
                if (this.selectedCardId === eventId) {
                    this.selectedCardId = null;
                } else {
                    this.selectedCardId = eventId;
                }
                this.render();
            });
        });

        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-hover');
            });

            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-hover');
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-hover');
                const eventId = e.dataTransfer.getData('text/plain');
                this.handlePlacement(eventId, slot.dataset.slotIndex);
            });

            // Click to drop (mobile support)
            slot.addEventListener('click', () => {
                if (this.selectedCardId) {
                    this.handlePlacement(this.selectedCardId, slot.dataset.slotIndex);
                    this.selectedCardId = null;
                }
            });
        });

        // Removal buttons
        const removeBtns = this.container.querySelectorAll('.btn-remove-placed');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const slotIdx = btn.dataset.removeSlot;
                delete this.placedEvents[slotIdx];
                this.render();
            });
        });
    }

    handlePlacement(eventId, slotIndex) {
        const eventObj = this.events.find(e => e.id === eventId);
        if (!eventObj) return;

        // Check if correct
        const slotIdxInt = parseInt(slotIndex);
        const slotObj = this.slots[slotIdxInt];
        
        // The correct order is expected to match the slot index
        if (eventObj.order === slotIdxInt) {
            // Correct placement!
            this.placedEvents[slotIndex] = eventObj;
            this.render();

            const isCorrectFeedback = true;
            const explanation = `Correct! ${eventObj.title} occurred in ${eventObj.date}. ${eventObj.desc}`;
            this.onStepFeedback(isCorrectFeedback, explanation, eventObj.sourcePassage);

            // Check if game complete
            const placedCount = Object.keys(this.placedEvents).length;
            if (placedCount === this.events.length) {
                setTimeout(() => {
                    this.onGameComplete(true);
                }, 800);
            }
        } else {
            // Incorrect placement
            const isCorrectFeedback = false;
            const explanation = `Incorrect. ${eventObj.title} occurred in ${eventObj.date}. It does not fit chronologically into Slot ${slotIdxInt + 1}. Review the chronology in the text.`;
            this.onStepFeedback(isCorrectFeedback, explanation, eventObj.sourcePassage);
        }
    }
}

// --------------------------------------------------------------------------
// 2. PROCESS LOOP
// --------------------------------------------------------------------------
class ProcessGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.stages = payload.stages; // Array of { id, title, desc, question, options: [], correctIndex, rationale, sourcePassage }
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;
        
        this.currentActiveStage = 0; // Stage index that needs to be guessed/unlocked
        
        this.init();
    }

    init() {
        this.render();
    }

    render() {
        const currentStageObj = this.stages[this.currentActiveStage];
        
        this.container.innerHTML = `
            <div class="process-game-container">
                <div class="process-loop-visualizer">
                    ${this.stages.map((stage, idx) => {
                        let statusClass = '';
                        if (idx < this.currentActiveStage) statusClass = 'completed';
                        else if (idx === this.currentActiveStage) statusClass = 'active';
                        
                        // Calculate positions on circle
                        const angle = (idx / this.stages.length) * 2 * Math.PI - (Math.PI / 2);
                        const radius = 120; // Radius of loop visualizer
                        const x = Math.round(160 + radius * Math.cos(angle) - 22);
                        const y = Math.round(160 + radius * Math.sin(angle) - 22);
                        
                        return `
                            <div class="process-node ${statusClass}" style="left: ${x}px; top: ${y}px;">
                                ${idx < this.currentActiveStage ? '<i class="fa-solid fa-check"></i>' : idx + 1}
                            </div>
                        `;
                    }).join('')}
                    
                    <!-- Center status panel -->
                    <div class="process-center-card">
                        <span class="title">Active Stage</span>
                        <span class="body" id="process-center-body">${this.currentActiveStage < this.stages.length ? `Predict Stage ${this.currentActiveStage + 1}` : 'Process Complete'}</span>
                    </div>
                </div>

                <div class="process-mcq-panel glass-panel" style="width:100%; padding: 1.25rem;">
                    <h3 style="font-size:0.95rem; font-weight:600; margin-bottom:0.75rem;"><i class="fa-solid fa-circle-question"></i> System Challenge:</h3>
                    <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5; margin-bottom:1.25rem;">${currentStageObj.question}</p>
                    
                    <div class="process-options-deck">
                        ${currentStageObj.options.map((opt, oIdx) => `
                            <div class="process-option-card" data-option-index="${oIdx}">
                                <span><span class="option-marker">${String.fromCharCode(65 + oIdx)}.</span> ${opt}</span>
                                <i class="fa-solid fa-angle-right"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        const optionCards = this.container.querySelectorAll('.process-option-card');
        optionCards.forEach(card => {
            card.addEventListener('click', () => {
                const selectedIdx = parseInt(card.dataset.optionIndex);
                this.handleChoice(selectedIdx);
            });
        });
    }

    handleChoice(selectedIndex) {
        const currentStageObj = this.stages[this.currentActiveStage];
        
        if (selectedIndex === currentStageObj.correctIndex) {
            // Correct choice
            const explanation = `Correct! ${currentStageObj.title} is indeed the next step. ${currentStageObj.desc}`;
            this.onStepFeedback(true, explanation, currentStageObj.sourcePassage);
            
            // Progress cycle
            this.currentActiveStage++;
            
            if (this.currentActiveStage >= this.stages.length) {
                setTimeout(() => {
                    this.onGameComplete(true);
                }, 800);
            } else {
                this.render();
            }
        } else {
            // Incorrect choice
            const explanation = `Incorrect. You chose: "${currentStageObj.options[selectedIndex]}". Review the process sequence. ${currentStageObj.rationale}`;
            this.onStepFeedback(false, explanation, currentStageObj.sourcePassage);
        }
    }
}

// --------------------------------------------------------------------------
// 3. CAUSE-EFFECT CHAIN BUILDER
// --------------------------------------------------------------------------
class CauseEffectGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.chains = payload.chains; // Array of { id, cause, effect, rationale, sourcePassage }
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;
        
        this.shuffledCauses = [];
        this.matchedEffects = {}; // Map: effectId -> causeObject
        this.selectedCauseId = null; // Accessibility selection
        
        this.init();
    }

    init() {
        this.shuffledCauses = shuffleArray(this.chains);
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="timeline-game-container">
                <p class="timeline-instructions"><i class="fa-solid fa-circle-info"></i> Drag a cause node from the left and drop it into its matching downstream ecological effect slot on the right.</p>
                <div class="cause-effect-container">
                    <!-- Left: Causes -->
                    <div class="cause-effect-column">
                        <div class="column-header"><i class="fa-solid fa-bolt"></i> Source Cause Trigger</div>
                        ${this.shuffledCauses.map(c => {
                            const isMatched = Object.values(this.matchedEffects).some(mc => mc.id === c.id);
                            if (isMatched) return `<div class="cause-card" style="opacity: 0.25; pointer-events:none;">Matched: ${c.cause}</div>`;
                            return `
                                <div class="cause-card ${this.selectedCauseId === c.id ? 'active-drag' : ''}" 
                                     draggable="true" 
                                     data-cause-id="${c.id}">
                                    ${c.cause}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <!-- Right: Effects -->
                    <div class="cause-effect-column">
                        <div class="column-header"><i class="fa-solid fa-compass"></i> Ecological Effect</div>
                        ${this.chains.map(item => {
                            const matchedCause = this.matchedEffects[item.id];
                            const isFilled = !!matchedCause;
                            return `
                                <div class="effect-slot ${isFilled ? 'filled' : ''}" data-effect-id="${item.id}">
                                    ${isFilled ? `
                                        <div class="effect-matched-item">
                                            <div style="font-size:0.7rem; color:var(--color-warning); text-transform:uppercase; margin-bottom:0.25rem;">Cause: ${matchedCause.cause}</div>
                                            <div class="effect-slot-label"><i class="fa-solid fa-arrow-right"></i> ${item.effect}</div>
                                            <button class="btn-disconnect-cause" data-disconnect-effect="${item.id}"><i class="fa-solid fa-trash-can"></i></button>
                                        </div>
                                    ` : `
                                        <div class="effect-slot-label">${item.effect}</div>
                                        <div class="slot-placeholder" style="margin-top:0.5rem; font-size:0.75rem;"><i class="fa-solid fa-arrow-down-to-bracket"></i> Drop Trigger Cause Here</div>
                                    `}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        const causeCards = this.container.querySelectorAll('.cause-card');
        const effectSlots = this.container.querySelectorAll('.effect-slot');
        
        causeCards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', card.dataset.causeId);
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
            
            // Click accessibility
            card.addEventListener('click', () => {
                const causeId = card.dataset.causeId;
                if (this.selectedCauseId === causeId) {
                    this.selectedCauseId = null;
                } else {
                    this.selectedCauseId = causeId;
                }
                this.render();
            });
        });

        effectSlots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-hover');
            });
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-hover');
            });
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-hover');
                const causeId = e.dataTransfer.getData('text/plain');
                this.handleLink(causeId, slot.dataset.effectId);
            });

            // Click accessibility
            slot.addEventListener('click', () => {
                if (this.selectedCauseId) {
                    this.handleLink(this.selectedCauseId, slot.dataset.effectId);
                    this.selectedCauseId = null;
                }
            });
        });

        // Removal buttons
        const disconnectBtns = this.container.querySelectorAll('.btn-disconnect-cause');
        disconnectBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const effId = btn.dataset.disconnectEffect;
                delete this.matchedEffects[effId];
                this.render();
            });
        });
    }

    handleLink(causeId, effectId) {
        const causeObj = this.chains.find(c => c.id === causeId);
        if (!causeObj) return;

        // Check if cause matches effect
        if (causeObj.id === effectId) {
            // Correct match
            this.matchedEffects[effectId] = causeObj;
            this.render();
            
            const explanation = `Correct! ${causeObj.cause} leads to: ${causeObj.effect}. ${causeObj.rationale}`;
            this.onStepFeedback(true, explanation, causeObj.sourcePassage);

            // Check if game complete
            const matchesCount = Object.keys(this.matchedEffects).length;
            if (matchesCount === this.chains.length) {
                setTimeout(() => {
                    this.onGameComplete(true);
                }, 800);
            }
        } else {
            // Incorrect match
            const targetEffectObj = this.chains.find(c => c.id === effectId);
            const explanation = `Incorrect. "${causeObj.cause}" does not cause "${targetEffectObj.effect}". Check the causal pathways documented in the textbook.`;
            this.onStepFeedback(false, explanation, causeObj.sourcePassage);
        }
    }
}

// --------------------------------------------------------------------------
// 4. COMPARISON SORTER
// --------------------------------------------------------------------------
class ComparisonGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.categories = payload.categories; // Array of 2 strings: e.g. ["Photosynthesis", "Respiration"]
        this.cards = payload.cards; // Array of { id, text, category, rationale, sourcePassage }
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;
        
        this.deck = [];
        this.currentCardIndex = 0;
        this.score = 0;
        
        this.init();
    }

    init() {
        this.deck = shuffleArray(this.cards);
        this.render();
    }

    render() {
        if (this.currentCardIndex >= this.deck.length) {
            return;
        }

        const currentCard = this.deck[this.currentCardIndex];
        const nextCard = this.deck[this.currentCardIndex + 1];
        
        this.container.innerHTML = `
            <div class="comparison-container">
                <p class="timeline-instructions"><i class="fa-solid fa-circle-info"></i> Sort the attribute card into the correct process bucket using the left/right options.</p>
                <div class="sorter-deck-area">
                    <!-- Top Active Card -->
                    <div class="sorter-card active" id="active-sorter-card">
                        <div class="sorter-card-content">
                            <h4>Attribute</h4>
                            <p>${currentCard.text}</p>
                        </div>
                    </div>

                    <!-- Visual Back Card (shadow) -->
                    ${nextCard ? `
                        <div class="sorter-card back">
                            <div class="sorter-card-content">
                                <h4>Attribute</h4>
                                <p>${nextCard.text}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Category Buckets Action Buttons -->
                <div class="sorter-buckets-row">
                    <button class="sorter-bucket-btn" id="btn-sort-left" data-category="${this.categories[0]}">
                        <i class="fa-solid fa-leaf bucket-icon"></i>
                        <span class="bucket-name">${this.categories[0]}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted);">[Swipe Left]</span>
                    </button>
                    <button class="sorter-bucket-btn" id="btn-sort-right" data-category="${this.categories[1]}">
                        <i class="fa-solid fa-fire bucket-icon"></i>
                        <span class="bucket-name">${this.categories[1]}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted);">[Swipe Right]</span>
                    </button>
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        const btnLeft = this.container.querySelector('#btn-sort-left');
        const btnRight = this.container.querySelector('#btn-sort-right');
        
        if (btnLeft && btnRight) {
            btnLeft.addEventListener('click', () => this.handleSort(this.categories[0], 'left'));
            btnRight.addEventListener('click', () => this.handleSort(this.categories[1], 'right'));
        }

        // Swipe keyboard support
        document.onkeydown = (e) => {
            if (this.currentCardIndex >= this.deck.length) return;
            if (e.key === 'ArrowLeft') {
                this.handleSort(this.categories[0], 'left');
            } else if (e.key === 'ArrowRight') {
                this.handleSort(this.categories[1], 'right');
            }
        };
    }

    handleSort(selectedCategory, swipeDirection) {
        const currentCard = this.deck[this.currentCardIndex];
        const cardEl = this.container.querySelector('#active-sorter-card');
        
        // Add swipe animation classes
        if (cardEl) {
            if (swipeDirection === 'left') cardEl.classList.add('swipe-left-anim');
            else cardEl.classList.add('swipe-right-anim');
        }

        // Clean up keyboard events
        document.onkeydown = null;

        setTimeout(() => {
            if (selectedCategory === currentCard.category) {
                // Correct Sort
                const explanation = `Correct! ${currentCard.text} belongs to ${currentCard.category}. ${currentCard.rationale}`;
                this.onStepFeedback(true, explanation, currentCard.sourcePassage);
                
                this.currentCardIndex++;
                if (this.currentCardIndex >= this.deck.length) {
                    this.onGameComplete(true);
                } else {
                    this.render();
                }
            } else {
                // Incorrect Sort
                const explanation = `Incorrect. "${currentCard.text}" belongs to ${currentCard.category}, not ${selectedCategory}. ${currentCard.rationale}`;
                this.onStepFeedback(false, explanation, currentCard.sourcePassage);
                
                // Do not increment card index yet, or allow them to retry or progress after reading feedback.
                // Normally we progress anyway but subtract points, so we increment.
                this.currentCardIndex++;
                if (this.currentCardIndex >= this.deck.length) {
                    this.onGameComplete(true);
                } else {
                    this.render();
                }
            }
        }, 400); // Sync animation
    }
}
