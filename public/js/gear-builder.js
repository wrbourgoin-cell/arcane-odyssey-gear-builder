const CONFIG = {
            MAX_LEVEL: 175,
            ATLANTEAN_STAT_ORDER: ['power', 'defense', 'size', 'dexterity', 'range', 'haste'],
            STAT_ORDER: ['power', 'defense', 'size', 'dexterity', 'range', 'haste', 'resistance', 'regeneration', 'pierce', 'warding', 'drawback', 'insanity'],
            NON_SCALING_STATS: new Set(['insanity', 'warding', 'drawback'])
        };

        const state = {
            playerLevel: 175,
            stats: { spirit: 0, magic: 0, strength: 0, weapons: 0 },
            tools: { slot1: null, slot2: null },
            gameData: [],
            currentBuild: { slots: [{}, {}, {}, {}, {}] },
            currentSlotIndex: null,
            tempItemConfig: null,
            tooltipEl: null
        };

        // Data Loading
        async function loadGameData() {
            try {
                const response = await fetch('data.json');
                if (!response.ok) throw new Error('Failed to load data');
                state.gameData = await response.json();
                console.log(`Loaded ${state.gameData.length} items`);
            } catch (error) {
                console.error('Error loading data:', error);
                // Fallback to embedded data
                state.gameData = [{"jewels":2,"level":150,"name":"Omen Armor","stats":{"power":-28,"defense":678},"type":"Chestpiece"},{"jewels":2,"level":150,"name":"Omen Cloak","stats":{"power":-21,"defense":508},"type":"Accessory"},{"jewels":2,"level":150,"name":"Omen Leggings","stats":{"power":-21,"defense":508},"type":"Leggings"},{"jewels":2,"level":170,"name":"Rear Admiral Amelia's Tarnished Cloak","stats":{"power":17,"defense":137,"haste":25},"type":"Accessory"},{"jewels":2,"level":170,"name":"Sunken Iron Armor","stats":{"defense":330,"size":38},"sunken":true,"type":"Chestpiece"},{"jewels":2,"level":170,"name":"Sunken Iron Boots","stats":{"defense":247,"size":28},"sunken":true,"type":"Leggings"},{"jewels":2,"level":170,"name":"Sunken Iron Helmet","stats":{"defense":247,"size":28},"sunken":true,"type":"Helmet"},{"jewels":2,"level":170,"name":"Sunken Warrior Armor","stats":{"defense":330,"dexterity":38},"sunken":true,"type":"Chestpiece"},{"jewels":2,"level":170,"name":"Sunken Warrior Helmet","stats":{"defense":247,"dexterity":28},"sunken":true,"type":"Helmet"},{"jewels":2,"level":170,"name":"Sunken Warrior Leggings","stats":{"defense":247,"dexterity":28},"sunken":true,"type":"Leggings"},{"jewels":2,"level":170,"name":"Apex Armor","stats":{"power":20,"defense":206},"type":"Chestpiece"},{"jewels":2,"level":170,"name":"Apex Cloak","stats":{"power":15,"defense":154},"type":"Accessory"},{"jewels":2,"level":170,"name":"Apex Leggings","stats":{"power":15,"defense":154},"type":"Leggings"},{"level":170,"name":"Ruby","stats":{"power":4},"type":"Jewel"},{"level":170,"name":"Sapphire","stats":{"dexterity":13},"type":"Jewel"},{"level":10,"name":"Strong","rarity":"Rare","stats":{"power":0.5},"type":"Enchant"},{"level":10,"name":"Hard","rarity":"Rare","stats":{"defense":4.5},"type":"Enchant"},{"level":10,"name":"Atlantean Essence","stats":{"power":1,"defense":9.07,"size":3,"dexterity":3,"range":3,"haste":3,"insanity":1},"type":"Modifier"},{"level":10,"name":"Frozen","stats":{"defense":4.429},"type":"Modifier"}];
            }
        }

        // Utility Functions
        const clampLevel = (value) => Math.max(1, Math.min(CONFIG.MAX_LEVEL, Math.floor(value || 1)));
        
        const escapeHtml = (str) => {
            if (typeof str !== 'string') return str;
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
            return str.replace(/[&<>"']/g, m => map[m]);
        };

        const getBaseType = (type) => {
            if (!type) return type;
            return type.replace(/^Spirit /, '').replace(/^Magic /, '').replace(/^Strength /, '');
        };

        const calculateBuildType = () => {
            const total = state.stats.spirit + state.stats.magic + state.stats.strength + state.stats.weapons;
            if (total === 0) return 'Savant';
            
            const percentages = {
                spirit: (state.stats.spirit / total) * 100,
                magic: (state.stats.magic / total) * 100,
                strength: (state.stats.strength / total) * 100,
                weapons: (state.stats.weapons / total) * 100
            };
            
            // Check for pure builds (60-100%)
            if (percentages.magic >= 60) return 'Mage';
            if (percentages.strength >= 60) return 'Berserker';
            if (percentages.spirit >= 60) return 'Oracle';
            if (percentages.weapons >= 60) return 'Warrior';
            
            // Check for hybrid builds (40-60%)
            if (percentages.magic >= 40 && percentages.magic < 60 && percentages.strength >= 40 && percentages.strength < 60) return 'Warlock';
            if (percentages.magic >= 40 && percentages.magic < 60 && percentages.weapons >= 40 && percentages.weapons < 60) return 'Conjurer';
            if (percentages.strength >= 40 && percentages.strength < 60 && percentages.weapons >= 40 && percentages.weapons < 60) return 'Warlord';
            if (percentages.spirit >= 40 && percentages.spirit < 60 && percentages.magic >= 40 && percentages.magic < 60) return 'Paladin';
            if (percentages.spirit >= 40 && percentages.spirit < 60 && percentages.strength >= 40 && percentages.strength < 60) return 'Juggernaut';
            if (percentages.spirit >= 40 && percentages.spirit < 60 && percentages.weapons >= 40 && percentages.weapons < 60) return 'Knight';
            
            // All other cases are Savant
            return 'Savant';
        };

        const buildBackgroundLayers = (item) => {
            const layers = [];
            
            const isSpiritItem = item.type && item.type.startsWith('Spirit ');
            const isMagicItem = item.type && item.type.startsWith('Magic ');
            const isStrengthItem = item.type && item.type.startsWith('Strength ');
            
            if (isSpiritItem) {
                layers.push(`url('../assets/Spirit_Item.webp')`);
            }
            else if (isMagicItem && item.magicName) { // Added check
                layers.push(`url('../assets/${item.magicName.replace(/ /g, '_')}.webp')`);
                layers.push(`url('../assets/Magic_Item.webp')`);
            }
            else if (isStrengthItem && item.fightingStyleName) { // Added check
                layers.push(`url('../assets/${item.fightingStyleName.replace(/ /g, '_')}.webp')`);
                layers.push(`url('../assets/Strength_Item.webp')`);
            }

            if (item.image) {
                layers.push(`url('${item.image}')`);
            }

            if (item.rarity) {
                layers.push(`url('../assets/${item.rarity}_Item.webp')`);
            } else {
                layers.push(`url('../assets/Empty_Item.webp')`);
            }
            
            return layers.join(', ');
        };

        const getSpiritMultiplier = () => {
            const total = CONFIG.MAX_LEVEL * 2;
            if (total === 0) return 0.3;
            const spiritPercent = state.stats.spirit / total;
            return 0.3 + (spiritPercent * 0.7); // Lerp from 0.3 to 1.0
        };

        const getEquippedMagics = () => {
            const magics = [];
            Object.values(state.tools).forEach(tool => {
                if (tool && tool.type === 'Magic') {
                    magics.push(tool);
                }
            });
            return magics;
        };

        const getEquippedFightingStyles = () => {
            const styles = [];
            Object.values(state.tools).forEach(tool => {
                if (tool && tool.type === 'Fighting Style') {
                    styles.push(tool);
                }
            });
            return styles;
        };

        const updateStatBuildDisplay = () => {
            const maxPoints = state.playerLevel * 2;
            const totalUsed = state.stats.spirit + state.stats.magic + state.stats.strength + state.stats.weapons;
            const remaining = maxPoints - totalUsed;
            
            document.getElementById('maxPoints').textContent = maxPoints;
            document.getElementById('remainingPoints').textContent = remaining;
            document.getElementById('buildName').textContent = calculateBuildType();
            
            // Update all max values
            document.querySelectorAll('.stat-number, .stat-range').forEach(input => {
                input.max = maxPoints;
            });
            
            updateToolsDisplay();
        };

        const getToolSlotsByBuild = (buildType) => {
            const slots = {
                'Mage': [{ type: 'Magic', label: 'Magic 1' }, { type: 'Magic', label: 'Magic 2' }],
                'Berserker': [{ type: 'Fighting Style', label: 'Fighting Style 1' }, { type: 'Fighting Style', label: 'Fighting Style 2' }],
                'Oracle': [],
                'Warrior': [],
                'Warlock': [{ type: 'Magic', label: 'Magic' }, { type: 'Fighting Style', label: 'Fighting Style' }],
                'Conjurer': [{ type: 'Magic', label: 'Magic' }],
                'Warlord': [{ type: 'Fighting Style', label: 'Fighting Style' }],
                'Paladin': [{ type: 'Magic', label: 'Magic' }],
                'Juggernaut': [{ type: 'Fighting Style', label: 'Fighting Style' }],
                'Knight': [],
                'Savant': [{ type: 'Magic', label: 'Magic' }, { type: 'Fighting Style', label: 'Fighting Style' }]
            };
            return slots[buildType] || [];
        };

        let previousToolSlotTypes = []

        const updateToolsDisplay = () => {
            const buildType = calculateBuildType();
            const toolSlots = getToolSlotsByBuild(buildType);
            const container = document.getElementById('toolsSlots');

            container.innerHTML = '';

            toolSlots.forEach((slotConfig, index) => {
                const slotId = `slot${index + 1}`;

                const previousType = previousToolSlotTypes[index];
                const currentType = slotConfig.type;

                if (previousType && previousType !== currentType) {
                    state.tools[slotId] = null;
                }

                const tool = state.tools[slotId];

                const slotEl = document.createElement('div');
                slotEl.className = `tool-slot ${tool ? 'filled' : ''}`;

                // Build background layers similar to slot-square
                const bgLayers = tool ? buildBackgroundLayers(tool) : `url('../assets/Empty_Item.webp')`;
                slotEl.style.backgroundImage = bgLayers;
                slotEl.classList.add('with-layers');

                slotEl.innerHTML = `
                    <div class="armor-overlay">
                        <div class="slot-item-name">${tool ? escapeHtml(tool.name) : 'Click to select'}</div>
                        <div class="slot-item-level">${escapeHtml(slotConfig.label.toUpperCase())}</div>
                    </div>
                `;

                slotEl.onclick = () => showToolSelection(slotConfig.type, slotId);

                if (tool) {
                    tooltip.attach(slotEl, formatToolStatsHtml(tool.stats));
                }

                container.appendChild(slotEl);

                previousToolSlotTypes[index] = currentType;
            });
        };


        const formatToolStatsHtml = (stats) => {
            if (!stats || !Object.keys(stats).length) return '';
            
            const lines = Object.entries(stats)
                .map(([stat, value]) => {
                    const displayValue = typeof value === 'number' ? value : value;
                    return `<div>${escapeHtml(stat)}: ${displayValue}</div>`;
                })
                .join('');
            
            return `<div>${lines}</div>`;
        };

        const showToolSelection = (toolType, slotId) => {
            const tools = state.gameData.filter(item => {
                const baseType = getBaseType(item.type);
                if (baseType !== toolType && item.type !== toolType) return false;

                if (item.min_level && item.min_level > state.playerLevel) return false;
                return true;
            });
            
            document.getElementById('overlayTitle').textContent = `Select ${toolType}`;
            
            const grid = document.getElementById('itemsGrid');
            const searchInput = document.querySelector('.picker-search');
            
            const renderItems = (filteredItems) => {
                grid.innerHTML = '';
                
                // Add remove option
                const removeCard = document.createElement('div');
                removeCard.className = 'item-card';
                removeCard.innerHTML = '<div class="item-card-inner"><div class="item-card-name">✖ Remove</div></div>';
                removeCard.onclick = () => {
                    state.tools[slotId] = null;
                    updateToolsDisplay();
                    closeOverlay();
                };
                grid.appendChild(removeCard);
                
                filteredItems.forEach(tool => {
                    const card = document.createElement('div');
                    card.className = 'item-card';
                    if (tool.image) card.style.backgroundImage = `url('${tool.image}')`;
                    
                    card.innerHTML = `
                        <div class="item-card-inner">
                            <div class="item-card-name">${escapeHtml(tool.name)}</div>
                        </div>
                    `;
                    
                    card.onclick = () => {
                        state.tools[slotId] = tool;
                        updateToolsDisplay();
                        closeOverlay();
                    };
                    
                    tooltip.attach(card, formatToolStatsHtml(tool.stats));
                    grid.appendChild(card);
                });
            };
            
            searchInput.value = '';
            searchInput.oninput = (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = tools.filter(tool => tool.name.toLowerCase().includes(query));
                renderItems(filtered);
            };
            
            renderItems(tools);
            document.getElementById('overlay').classList.add('active');
        };

        const getEffectiveLevel = (item) => {
            const maxLevel = item?.max_level || CONFIG.MAX_LEVEL;
            const clamped = Math.min(state.playerLevel, maxLevel);
            return Math.max(10, Math.floor(clamped / 10) * 10);
        };

        const getScaledStats = (item, contextSlotStats = null) => {
            if (!item?.stats) return {};
            const itemLevel = item.level || 10;
            const scaleFactor = getEffectiveLevel(item) / Math.max(1, itemLevel);
            const scaled = {};
            
            // Check if this is a Spirit item
            const isSpiritItem = item.type && item.type.startsWith('Spirit ');
            const spiritMultiplier = isSpiritItem ? getSpiritMultiplier() : 1;
            
            // Special handling for Atlantean Essence - show only the stat that will be applied
            if (item.name === 'Atlantean Essence' && contextSlotStats) {
                const chosenStat = CONFIG.ATLANTEAN_STAT_ORDER.find(s => !contextSlotStats[s] || contextSlotStats[s] === 0) || 'power';
                
                for (const [stat, value] of Object.entries(item.stats)) {
                    if (stat === chosenStat || stat === 'insanity') {
                        scaled[stat] = CONFIG.NON_SCALING_STATS.has(stat) ? value : value * scaleFactor;
                    }
                }
            } else {
                for (const [stat, value] of Object.entries(item.stats)) {
                    const baseValue = CONFIG.NON_SCALING_STATS.has(stat) ? value : value * scaleFactor;
                    scaled[stat] = baseValue * spiritMultiplier;
                }
            }
            return scaled;
        };

        const formatStatsHtml = (stats, asBlock = false) => {
            if (!stats || !Object.keys(stats).length) return '';

            const lines = CONFIG.STAT_ORDER
                .filter(stat => stats[stat] !== undefined)
                .map(stat =>
                    `<div>${escapeHtml(stat)}: ${Math.floor(stats[stat])}</div>`
                )
                .join('');

            return asBlock
                ? `<div style="background:transparent">${lines}</div>`
                : `<div>${lines}</div>`;
        };


        const calculateSlotStats = (slotConfig) => {
            if (!slotConfig?.item) return {};

            const stats = { ...getScaledStats(slotConfig.item) };

            if (slotConfig.enchant) {
                for (const [s, v] of Object.entries(getScaledStats(slotConfig.enchant))) {
                    stats[s] = (stats[s] || 0) + v;
                }
            }

            (slotConfig.jewels || []).forEach(j => {
                if (!j) return;
                for (const [s, v] of Object.entries(getScaledStats(j))) {
                    stats[s] = (stats[s] || 0) + v;
                }
            });

            if (slotConfig.modifier) {
                const modStats = getScaledStats(slotConfig.modifier, stats);

                if (slotConfig.modifier.name === 'Atlantean Essence') {
                    const chosen = CONFIG.ATLANTEAN_STAT_ORDER.find(s => !stats[s] || stats[s] === 0) || 'power';
                    if (modStats[chosen]) stats[chosen] = (stats[chosen] || 0) + modStats[chosen];
                    if (modStats.insanity) stats.insanity = (stats.insanity || 0) + modStats.insanity;
                } else {
                    for (const [s, v] of Object.entries(modStats)) {
                        stats[s] = (stats[s] || 0) + v;
                    }
                }
            }

            return stats;
        };


        // Tooltip System
        const tooltip = {
            create() {
                state.tooltipEl = document.createElement('div');
                state.tooltipEl.className = 'stat-tooltip';
                state.tooltipEl.style.display = 'none';
                document.body.appendChild(state.tooltipEl);
            },
            show(html, x, y) {
                if (!state.tooltipEl) this.create();
                state.tooltipEl.innerHTML = html || '';
                state.tooltipEl.style.left = `${x + 12}px`;
                state.tooltipEl.style.top = `${y + 12}px`;
                state.tooltipEl.style.display = 'block';
            },
            move(x, y) {
                if (!state.tooltipEl || state.tooltipEl.style.display === 'none') return;
                state.tooltipEl.style.left = `${x + 12}px`;
                state.tooltipEl.style.top = `${y + 12}px`;
            },
            hide() {
                if (state.tooltipEl) state.tooltipEl.style.display = 'none';
            },
            attach(element, statsHtml) {
                if (!element || !statsHtml) return;
                element.addEventListener('mouseenter', (e) => this.show(statsHtml, e.pageX, e.pageY));
                element.addEventListener('mousemove', (e) => this.move(e.pageX, e.pageY));
                element.addEventListener('mouseleave', () => this.hide());
            }
        };

        // Stats Calculation
        const calculateEfficiency = (statName, value) => {
            const isNegative = value < 0
            if (value === 0) return 0;

            const pierceFormula = (value) => {
                if (isNegative === true) {
                    value = -value
                }
                const logTerm = Math.log(0.1 * value + 4);
                const numerator = 1.44 * Math.pow(logTerm, 3) + 0.15 * value;
                const denominator = 0.1 + 0.15 * Math.sqrt(state.playerLevel);

                const piercePercent = 1.35 * ((numerator / denominator) - 0.79);
                if (isNegative === true) {
                    return -((piercePercent * 0.75) / 100);
                }
                return (piercePercent * 0.75) / 100;
            };


            const regenFormula = (value) => {
                if (isNegative === true) {
                    value = -value
                }
                const base = value * 0.0025;
                const diminishing = 1 - Math.exp(-value / 200);
                if (isNegative === true) {
                    return -(base * diminishing);
                }
                return base * diminishing;
            };
            
            const secondaryFormula = (value, coeff) => {
                if (isNegative === true) {
                    value = -value
                }
                const logTerm = Math.log(0.1 * value + 4);
                const numerator = 1.44 * Math.pow(logTerm, 3) + 0.15 * value;
                const denominator = 0.1 + 0.15 * Math.sqrt(state.playerLevel);
                if (isNegative === true) {
                    return -((1.35 * ((numerator / denominator) - 0.79) * coeff) / 100);
                }
                return (1.35 * ((numerator / denominator) - 0.79) * coeff) / 100;
            };

            const formulas = {
                power: () => value / state.playerLevel,
                defense: () => value / (100 + 9 * (state.playerLevel - 1)),
                haste: () => secondaryFormula(value, 2),
                dexterity: () => secondaryFormula(value, 0.525),
                size: () => secondaryFormula(value, 0.6),
                resistance: () => secondaryFormula(value, 0.525),
                range: () => secondaryFormula(value, 0.7),
                regeneration: () => regenFormula(value),
                pierce: () => pierceFormula(value)
            };

            return formulas[statName]?.() || 0;
        };

        const calculateTotalStats = () => {
            const totals = {};
            
            state.currentBuild.slots.forEach(slotConfig => {
                if (!slotConfig.item) return;

                const slotStats = { ...getScaledStats(slotConfig.item) };

                // Add enchant stats
                if (slotConfig.enchant) {
                    Object.entries(getScaledStats(slotConfig.enchant)).forEach(([stat, value]) => {
                        slotStats[stat] = (slotStats[stat] || 0) + value;
                    });
                }

                // Add jewel stats
                (slotConfig.jewels || []).forEach(jewel => {
                    if (!jewel) return;
                    Object.entries(getScaledStats(jewel)).forEach(([stat, value]) => {
                        slotStats[stat] = (slotStats[stat] || 0) + value;
                    });
                });

                // Apply modifier
                if (slotConfig.modifier) {
                    const modStats = getScaledStats(slotConfig.modifier);
                    
                    if (slotConfig.modifier.name === 'Atlantean Essence') {
                        const chosenStat = CONFIG.ATLANTEAN_STAT_ORDER.find(s => !slotStats[s] || slotStats[s] === 0) || 'power';
                        if (modStats[chosenStat]) slotStats[chosenStat] = (slotStats[chosenStat] || 0) + modStats[chosenStat];
                        if (modStats.insanity) slotStats.insanity = (slotStats.insanity || 0) + modStats.insanity;
                    } else {
                        Object.entries(modStats).forEach(([stat, value]) => {
                            slotStats[stat] = (slotStats[stat] || 0) + value;
                        });
                    }

                    // Apply stat multipliers
                    if (slotConfig.modifier.stat_multipliers) {
                        Object.entries(slotConfig.modifier.stat_multipliers).forEach(([stat, mult]) => {
                            if (slotStats[stat]) slotStats[stat] *= mult;
                        });
                    }
                }

                // Add to totals
                Object.entries(slotStats).forEach(([stat, value]) => {
                    totals[stat] = (totals[stat] || 0) + value;
                });
            });

            return totals;
        };

        const getTotalJewelSlots = (slotConfig) => {
    let total = (slotConfig.item?.jewels || 0);

    if (slotConfig.modifier) total += slotConfig.modifier.jewels || 0;
    if (slotConfig.enchant) total += slotConfig.enchant.jewels || 0;

    return total;
};


        // UI Updates
        const updateStatsDisplay = () => {
            const totals = calculateTotalStats();
            const display = document.getElementById('statsDisplay');
            
            display.innerHTML = CONFIG.STAT_ORDER.map(stat => {
                const value = totals[stat] || 0;
                const efficiency = calculateEfficiency(stat, value);
                const percent = efficiency !== 0 ? `(${(efficiency * 100).toFixed(1)}%)` : '-';
                
                return `
                    <div class="stat-row" data-stat="${stat}">
                        <span class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}:</span>
                        <span class="stat-value">${Math.floor(value)}</span>
                        <span class="stat-percent">${percent}</span>
                    </div>
                `;
            }).join('');
        };

        const updateSlotDisplay = (slotIndex) => {
            const slot = document.querySelector(`.slot[data-slot-id="${slotIndex}"]`);
            const config = state.currentBuild.slots[slotIndex] || {};
            const content = slot.querySelector('.slot-content');

            if (!config.item) {
                content.innerHTML = `
                    <div class="slot-square placeholder" style="background-image: url('../assets/Empty_Item.webp')">
                        <div class="armor-overlay">
                            <div class="slot-item-name">Click to Select</div>
                        </div>
                    </div>
                `;
                content.classList.add('empty');
                content.querySelector('.slot-square').onclick = () => showItemSelection(slot.dataset.slotType, slotIndex);
                return;
            }

            content.classList.remove('empty');
            const bgLayers = buildBackgroundLayers(config.item);
            const imgStyle = bgLayers ? `style="background-image: ${bgLayers}" class="with-layers"` : '';
            const baseType = getBaseType(config.item.type);
            const showLevel = ['Chestpiece', 'Leggings', 'Accessory', 'Helmet', 'Amulet'].includes(baseType);                        
            // Calculate current slot stats for Atlantean Essence tooltip
            const slotStats = { ...getScaledStats(config.item) };
            if (config.enchant) {
                Object.entries(getScaledStats(config.enchant)).forEach(([stat, value]) => {
                    slotStats[stat] = (slotStats[stat] || 0) + value;
                });
            }
            (config.jewels || []).forEach(jewel => {
                if (!jewel) return;
                Object.entries(getScaledStats(jewel)).forEach(([stat, value]) => {
                    slotStats[stat] = (slotStats[stat] || 0) + value;
                });
            });
            
            let html = `
                <div class="slot-square filled" ${imgStyle}>
                    <div class="armor-overlay">
                        <div class="slot-item-name">${escapeHtml(config.item.name)}</div>
                        ${showLevel ? `<div class="slot-item-level">Lv ${getEffectiveLevel(config.item)}</div>` : ''}
                    </div>
                </div>
                <div class="slot-controls">
            `;

            const modBg = config.modifier ? buildBackgroundLayers(config.modifier) : `url('../assets/Empty_Item.webp')`;
            const modStyle = `style="background-image:${modBg}" class="with-layers"`;
            const modClass = config.modifier ? 'filled' : '';

            html += `
            <button class="slot-control-btn ${modClass}" ${modStyle} data-action="modifier">
                ${escapeHtml(config.modifier?.name || 'Modifier')}
            </button>
            `;
            
            // Enchant button
            const enchBg = config.enchant ? buildBackgroundLayers(config.enchant) : `url('../assets/Empty_Item.webp')`;
            const enchStyle = `style="background-image:${enchBg}" class="with-layers"`;
            const enchClass = config.enchant ? 'filled' : '';

            html += `
            <button class="slot-control-btn ${enchClass}" ${enchStyle} data-action="enchant">
                ${escapeHtml(config.enchant?.name || 'Enchant')}
            </button>
            `;

            // Jewel buttons
            const jewels = config.jewels || [];
            const totalJewels = getTotalJewelSlots(config);
            for (let i = 0; i < totalJewels; i++) {
                const jewel = config.jewels[i];
                const jBg = jewel ? buildBackgroundLayers(jewel) : `url('../assets/Empty_Item.webp')`;
                const jStyle = `style="background-image:${jBg}" class="with-layers"`;
                const jClass = jewel ? 'filled' : '';

                html += `
                <button
                    class="slot-control-btn ${jClass}"
                    ${jStyle}
                    data-action="jewel"
                    data-jewel-index="${i}"
                >
                    ${escapeHtml(jewel?.name || `J${i + 1}`)}
                </button>
                `;
            }

            html += '</div>';
            content.innerHTML = html;

            // Attach event listeners and tooltips
            const armorEl = content.querySelector('.slot-square');
            armorEl.onclick = () => showItemSelection(slot.dataset.slotType, slotIndex);
            tooltip.attach(armorEl, formatStatsHtml(getScaledStats(config.item)));

            content.querySelector('[data-action="modifier"]').onclick = () => showModifierSelection(slotIndex);
            if (config.modifier) {
                // Pass slot stats for Atlantean Essence tooltip
                tooltip.attach(content.querySelector('[data-action="modifier"]'), 
                    formatStatsHtml(getScaledStats(config.modifier, slotStats)));
            }

            content.querySelector('[data-action="enchant"]').onclick = () => showEnchantSelection(slotIndex);
            if (config.enchant) tooltip.attach(content.querySelector('[data-action="enchant"]'), formatStatsHtml(getScaledStats(config.enchant)));

            content.querySelectorAll('[data-action="jewel"]').forEach(btn => {
                const jIdx = parseInt(btn.dataset.jewelIndex);
                btn.onclick = () => showJewelSelection(slotIndex, jIdx);
                const jewel = jewels[jIdx];
                if (jewel) tooltip.attach(btn, formatStatsHtml(getScaledStats(jewel)));
            });

            const previewEl = document.querySelector(
                `.slot-stats-preview[data-slot-id="${slotIndex}"]`
            );

            if (previewEl) {
                const combinedStats = calculateSlotStats(config);

                // Clear old tooltip listeners by replacing the node
                const fresh = previewEl.cloneNode(true);
                previewEl.replaceWith(fresh);

                if (Object.keys(combinedStats).length > 0) {
                    tooltip.attach(
                        fresh,
                        formatStatsHtml(combinedStats, true)
                    );
                }
            }
        };

        // Item Selection
        const createItemPicker = (items, onSelect, includeRemove = false) => {
            const grid = document.getElementById('itemsGrid');
            const searchInput = document.querySelector('.picker-search');
            
            const renderItems = (filteredItems) => {
                grid.innerHTML = '';
                
                if (includeRemove) {
                    const removeCard = document.createElement('div');
                    removeCard.className = 'item-card';
                    removeCard.innerHTML = '<div class="item-card-inner"><div class="item-card-name">✖ Remove</div></div>';
                    removeCard.onclick = () => {
                        onSelect(null);
                        closeOverlay();
                    };
                    grid.appendChild(removeCard);
                }

                filteredItems.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'item-card';
                    const bgLayers = buildBackgroundLayers(item);
                    if (bgLayers) {
                        card.style.backgroundImage = bgLayers;
                        card.classList.add('with-layers');
                    }
                    
                    const level = getEffectiveLevel(item);
                    card.innerHTML = `
                        <div class="item-card-inner">
                            <div class="item-card-name">${escapeHtml(item.name)}</div>
                            ${item.level ? `<div class="item-card-level">Level ${level}</div>` : ''}
                        </div>
                    `;
                    
                    card.onclick = () => {
                        onSelect(item);
                        closeOverlay();
                    };
                    
                    tooltip.attach(card, formatStatsHtml(getScaledStats(item)));
                    grid.appendChild(card);
                });
            };

            searchInput.value = '';
            searchInput.oninput = (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = items.filter(item => item.name.toLowerCase().includes(query));
                renderItems(filtered);
            };

            renderItems(items);
        };

        const showItemSelection = (slotTypes, slotIndex) => {
            state.currentSlotIndex = slotIndex;
            const types = slotTypes.split(',');
            
            // First, clone Magic items BEFORE filtering
            let allItems = [...state.gameData];
            
            const equippedMagics = getEquippedMagics();
            if (equippedMagics.length > 0) {
                const magicItemsToClone = allItems.filter(item => 
                    item.type?.startsWith('Magic ') && item['magic-stats']
                );
                
                magicItemsToClone.forEach(baseItem => {
                    equippedMagics.forEach(magic => {
                        const magicStatEntry = baseItem['magic-stats'].find(
                            entry => entry.name === magic.name
                        );
                        
                        if (magicStatEntry) {
                            const clonedItem = {
                                ...baseItem,
                                magicName: magic.name,
                                name: baseItem.name
                                .replace('Arcanium', magic.name)
                                .replace('Arcmancer', `${magic.name}mancer`),
                                stats: magicStatEntry.stats,
                                level: magicStatEntry.level,
                                _isMagicClone: true,
                                _baseName: baseItem.name,
                                _magicName: magic.name
                            };
                            
                            allItems.push(clonedItem);
                        }
                    });
                });
            }

            const equippedFightingStyles = getEquippedFightingStyles();
            if (equippedFightingStyles.length > 0) {
                const strengthItemsToClone = allItems.filter(item => 
                    item.type?.startsWith('Strength ') && item['strength-stats']
                );
                
                strengthItemsToClone.forEach(baseItem => {
                    equippedFightingStyles.forEach(style => {
                        const styleStatEntry = baseItem['strength-stats'].find(
                            entry => entry.name === style.name
                        );
                        
                        if (styleStatEntry) {
                            const clonedItem = {
                                ...baseItem,
                                fightingStyleName: style.name,
                                name: `${style.name} ${baseItem.name.replace('Fighting ', '')}`,
                                stats: styleStatEntry.stats,
                                level: styleStatEntry.level,
                                _isStrengthClone: true,
                                _baseName: baseItem.name,
                                _fightingStyleName: style.name
                            };
                            
                            allItems.push(clonedItem);
                        }
                    });
                });
            }
            
            // NOW filter items using getBaseType
            let items = allItems.filter(item => {
                const itemBaseType = getBaseType(item.type);
                
                // Check if item type matches any of the requested types
                const matchesType = types.some(t => {
                    const requestedBaseType = getBaseType(t);
                    return requestedBaseType === itemBaseType;
                });
                
                if (!matchesType) return false;
                if (state.playerLevel < 10) return false;
                if (item.min_level && item.min_level > state.playerLevel) return false;
                
                const slots = state.currentBuild.slots;
                
                // Uniqueness rules using getBaseType
                if (itemBaseType === 'Helmet' && slots.some((s, i) => i !== slotIndex && getBaseType(s.item?.type) === 'Helmet')) {
                    return false;
                }
                if (itemBaseType === 'Amulet' && slots.some((s, i) => i !== slotIndex && getBaseType(s.item?.type) === 'Amulet')) {
                    return false;
                }
                
                // Duplicate item check
                const nameToCheck = item._isMagicClone ? item._baseName : 
                       (item._isStrengthClone ? item._baseName : item.name);
                const isDuplicate = slots.some((s, i) => {
                    if (i === slotIndex || !s.item) return false;
                    const slotItemName = s.item._isMagicClone ? s.item._baseName : 
                                    (s.item._isStrengthClone ? s.item._baseName : s.item.name);
                    return slotItemName === nameToCheck;
                });
                
                return !isDuplicate;
            });

            document.getElementById('overlayTitle').textContent = `Select ${types.join(' / ')}`;
            createItemPicker(items, (item) => {
                if (!item) {
                    state.currentBuild.slots[slotIndex] = {};
                } else {
                    state.currentBuild.slots[slotIndex] = {
                        item,
                        modifier: null,
                        enchant: null,
                        jewels: new Array(item.jewels || 0).fill(null)
                    };
                }
                updateSlotDisplay(slotIndex);
                updateStatsDisplay();
            }, true);

            document.getElementById('overlay').classList.add('active');
        };

        const showModifierSelection = (slotIndex) => {
            state.currentSlotIndex = slotIndex;
            const config = state.currentBuild.slots[slotIndex];
            if (!config?.item) return;

            // Calculate current slot stats (before modifier)
            const slotStats = { ...getScaledStats(config.item) };
            if (config.enchant) {
                Object.entries(getScaledStats(config.enchant)).forEach(([stat, value]) => {
                    slotStats[stat] = (slotStats[stat] || 0) + value;
                });
            }
            (config.jewels || []).forEach(jewel => {
                if (!jewel) return;
                Object.entries(getScaledStats(jewel)).forEach(([stat, value]) => {
                    slotStats[stat] = (slotStats[stat] || 0) + value;
                });
            });

            const modifiers = state.gameData.filter(i => i.type === 'Modifier');
            const canUse = (mod) => {
                // Atlantean Essence is always available (unless explicitly blocked)
                if (mod.name === 'Atlantean Essence') {
                    if (config.item.atlantean_essence === false) return false;
                    // Check enchant compatibility
                    if (config.enchant && config.enchant.atlantean_essence === false) return false;
                    // Check jewel compatibility
                    if (config.jewels) {
                        for (const jewel of config.jewels) {
                            if (!jewel) continue;
                            if (jewel.atlantean_essence === false) return false;
                        }
                    }
                    return true;
                }
                
                // Check if item has "all" flag to show all modifiers
                if (config.item.modifiers && config.item.modifiers.all) return true;
                
                // For other modifiers, check if the item has this specific modifier enabled
                if (!config.item.modifiers || !config.item.modifiers[mod.name]) return false;
                
                return true;
            };

            document.getElementById('overlayTitle').textContent = 'Select Modifier';
            
            const grid = document.getElementById('itemsGrid');
            const searchInput = document.querySelector('.picker-search');
            
            const renderItems = (filteredItems) => {
                grid.innerHTML = '';
                
                // Add remove option
                const removeCard = document.createElement('div');
                removeCard.className = 'item-card';
                removeCard.innerHTML = '<div class="item-card-inner"><div class="item-card-name">✖ Remove</div></div>';
                removeCard.onclick = () => {
                    config.modifier = null;
                    updateSlotDisplay(slotIndex);
                    updateStatsDisplay();
                    closeOverlay();
                };
                grid.appendChild(removeCard);

                filteredItems.forEach(mod => {
                    if (!canUse(mod)) return;
                    
                    const card = document.createElement('div');
                    card.className = 'item-card';
                    const bgLayers = buildBackgroundLayers(mod);
                    if (bgLayers) {
                        card.style.backgroundImage = bgLayers;
                        card.classList.add('with-layers');
                    }
                    
                    card.innerHTML = `
                        <div class="item-card-inner">
                            <div class="item-card-name">${escapeHtml(mod.name)}</div>
                        </div>
                    `;
                    
                    card.onclick = () => {
                        config.modifier = mod;
                        updateSlotDisplay(slotIndex);
                        updateStatsDisplay();
                        closeOverlay();
                    };
                    
                    // Pass slot stats for Atlantean Essence tooltip
                    tooltip.attach(card, formatStatsHtml(getScaledStats(mod, slotStats)));
                    grid.appendChild(card);
                });
            };

            searchInput.value = '';
            searchInput.oninput = (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = modifiers.filter(mod => mod.name.toLowerCase().includes(query));
                renderItems(filtered);
            };

            renderItems(modifiers);
            document.getElementById('overlay').classList.add('active');
        };

        const showEnchantSelection = (slotIndex) => {
            state.currentSlotIndex = slotIndex;
            const config = state.currentBuild.slots[slotIndex];
            if (!config?.item) return;

            const enchants = state.gameData.filter(i => i.type === 'Enchant');
            
            // Filter enchants based on Atlantean Essence compatibility
            const canUse = (enc) => {
                if (config.modifier?.name === 'Atlantean Essence') {
                    return enc.atlantean_essence !== false;
                }
                return true;
            };

            const validEnchants = enchants.filter(canUse);

            document.getElementById('overlayTitle').textContent = 'Select Enchant';
            createItemPicker(validEnchants, (enc) => {
                config.enchant = enc;
                updateSlotDisplay(slotIndex);
                updateStatsDisplay();
            }, true);

            document.getElementById('overlay').classList.add('active');
        };

        const showJewelSelection = (slotIndex, jewelIndex) => {
            state.currentSlotIndex = slotIndex;
            const config = state.currentBuild.slots[slotIndex];
            if (!config?.item) return;

            const jewels = state.gameData.filter(i => i.type === 'Jewel');

            document.getElementById('overlayTitle').textContent = `Select Jewel ${jewelIndex + 1}`;
            createItemPicker(jewels, (jewel) => {
                if (!config.jewels) config.jewels = [];
                config.jewels[jewelIndex] = jewel;
                updateSlotDisplay(slotIndex);
                updateStatsDisplay();
            }, true);

            document.getElementById('overlay').classList.add('active');
        };

        const closeOverlay = () => {
            document.getElementById('overlay').classList.remove('active');
            tooltip.hide();
        };

        // Event Listeners
        const setupEventListeners = () => {
            const playerLevelInput = document.getElementById('playerLevel');

            const applyLevelChange = (e) => {
                state.playerLevel = clampLevel(parseInt(e.target.value));
                e.target.value = state.playerLevel;

                updateStatBuildDisplay();

                if (state.playerLevel < 10) {
                    state.currentBuild.slots = [{}, {}, {}, {}, {}];
                } else {
                    state.currentBuild.slots.forEach((slotConfig, i) => {
                        if (slotConfig.item && slotConfig.item.min_level > state.playerLevel) {
                            state.currentBuild.slots[i] = {};
                        }
                    });
                }

                document.querySelectorAll('.slot').forEach((_, i) => updateSlotDisplay(i));
                updateStatsDisplay();

            };

            playerLevelInput.addEventListener('change', applyLevelChange); // Enter or blur
            playerLevelInput.addEventListener('blur', applyLevelChange);   // Click away

            // Stat input listeners
            const statInputs = document.querySelectorAll('.stat-number, .stat-range');

            // In the stat input listeners section, add updateSlotDisplay calls
            statInputs.forEach(input => {
                const isRange = input.classList.contains('stat-range');
                
                if (isRange) {
                    input.addEventListener('input', (e) => {
                        const statName = e.target.dataset.stat;
                        const maxPoints = state.playerLevel * 2;
                        const currentTotal = state.stats.spirit + state.stats.magic + state.stats.strength + state.stats.weapons;
                        const currentStatValue = state.stats[statName];
                        const newValue = parseInt(e.target.value) || 0;
                        const difference = newValue - currentStatValue;
                        const remaining = maxPoints - currentTotal;
                        
                        if (difference > remaining) {
                            e.target.value = currentStatValue + remaining;
                            return;
                        }
                        
                        const finalValue = Math.max(0, Math.min(parseInt(e.target.value) || 0, maxPoints));
                        state.stats[statName] = finalValue;
                        
                        document.getElementById(`${statName}Stat`).value = finalValue;
                        
                        updateStatBuildDisplay();
                        
                        // ADD THESE LINES to update Spirit items when Spirit stat changes
                        if (statName === 'spirit') {
                            document.querySelectorAll('.slot').forEach((_, i) => updateSlotDisplay(i));
                        }
                        updateStatsDisplay();
                    });
                } else {
                    const applyStatChange = (e) => {
                        const statName = e.target.dataset.stat;
                        const maxPoints = state.playerLevel * 2;
                        const currentTotal = state.stats.spirit + state.stats.magic + state.stats.strength + state.stats.weapons;
                        const currentStatValue = state.stats[statName];
                        const newValue = parseInt(e.target.value) || 0;
                        const difference = newValue - currentStatValue;
                        const remaining = maxPoints - currentTotal;
                        
                        let finalValue = Math.max(0, Math.min(newValue, maxPoints));
                        
                        if (difference > remaining) {
                            finalValue = currentStatValue + remaining;
                        }
                        
                        state.stats[statName] = finalValue;
                        e.target.value = finalValue;
                        
                        document.getElementById(`${statName}Range`).value = finalValue;
                        
                        updateStatBuildDisplay();
                        
                        // ADD THESE LINES to update Spirit items when Spirit stat changes
                        if (statName === 'spirit') {
                            document.querySelectorAll('.slot').forEach((_, i) => updateSlotDisplay(i));
                        }
                        updateStatsDisplay();
                    };
                    
                    input.addEventListener('change', applyStatChange);
                    input.addEventListener('blur', applyStatChange);
                }
            });


            document.getElementById('closeOverlay').addEventListener('click', closeOverlay);
            document.getElementById('overlay').addEventListener('click', (e) => {
                if (e.target.id === 'overlay') closeOverlay();
            });
        };

        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
            await loadGameData();
            setupEventListeners();
            tooltip.create();
            updateStatsDisplay();
            updateToolsDisplay();
            
            document.querySelectorAll('.slot').forEach((slot, i) => updateSlotDisplay(i));
        });