d3.csv("Pokemon.csv")
    .then(data => {
        // Data Preprocessing
        data.forEach(d => {
            d.Total = +d.Total;
            d.HP = +d.HP;
            d.Attack = +d.Attack;
            d.Defense = +d.Defense;
            d["Sp. Atk"] = +d["Sp. Atk"];
            d["Sp. Def"] = +d["Sp. Def"];
            d.Speed = +d.Speed;
            d.Generation = +d.Generation;
        });

        // Initialize Charts
        const barChart = new BarChart({
            parent: '#bar-chart',
            width: 400,
            height: 400,
            margin: { top: 40, right: 20, bottom: 60, left: 60 },
            xlabel: 'Stats',
            ylabel: 'Value'
        });

        const scatterPlot = new ScatterPlot({
            parent: '#scatter-plot',
            width: 500,
            height: 500,
            margin: { top: 30, right: 30, bottom: 60, left: 70 },
            xlabel: 'Attack', // Initial X
            ylabel: 'Defense' // Initial Y
        }, data, barChart);

        scatterPlot.update();
        barChart.update(null);

        // --- Event Listeners ---

        // Axis Switchers
        d3.select('#x-axis-select').on('change', function () {
            scatterPlot.config.xlabel = this.value;
            scatterPlot.update(); // Re-calculate domains and render
        });

        d3.select('#y-axis-select').on('change', function () {
            scatterPlot.config.ylabel = this.value;
            scatterPlot.update();
        });

        d3.select('#reset-zoom').on('click', function () {
            scatterPlot.svg.transition().duration(750)
                .call(scatterPlot.zoom.transform, d3.zoomIdentity);
        });

        // Legend Generation
        const types = Array.from(new Set(data.map(d => d['Type 1']))).sort();
        const legendContainer = d3.select('#legend-container');
        const typeColors = scatterPlot.typeColorScale;

        // Toggle All Button Logic
        let isAllSelected = true; // Initial state

        d3.select('#toggle-all-types').on('click', function () {
            isAllSelected = !isAllSelected; // Toggle state

            if (isAllSelected) {
                // Select All
                d3.selectAll('.legend-item').classed('dimmed', false);
                scatterPlot.filterTypes(types); // Show all
            } else {
                // Deselect All
                d3.selectAll('.legend-item').classed('dimmed', true);
                scatterPlot.filterTypes([]); // Show none
            }
        });

        types.forEach(type => {
            legendContainer.append('div')
                .attr('class', 'legend-item')
                .style('background-color', typeColors(type))
                .style('color', '#fff')
                .style('text-shadow', '0 0 2px black')
                .text(type)
                .on('click', function () {
                    const isActive = d3.select(this).classed('dimmed');
                    d3.select(this).classed('dimmed', !isActive);

                    const activeTypes = [];
                    legendContainer.selectAll('.legend-item').each(function () {
                        if (!d3.select(this).classed('dimmed')) {
                            activeTypes.push(d3.select(this).text());
                        }
                    });

                    // Update global toggle state if necessary (heuristic)
                    if (activeTypes.length === types.length) isAllSelected = true;
                    if (activeTypes.length === 0) isAllSelected = false;

                    scatterPlot.filterTypes(activeTypes);
                });
        });
    })
    .catch(error => {
        console.error('Error loading data:', error);
    });

class ScatterPlot {
    constructor(config, data, linkedView) {
        this.config = config;
        this.data = data;
        this.filteredData = data;
        this.linkedView = linkedView;

        // Custom Color Scale based on Pokemon Types (Hue-based)
        this.typeColorScale = d3.scaleOrdinal()
            .domain([
                "Grass", "Fire", "Water", "Bug", "Normal", "Poison",
                "Electric", "Ground", "Fairy", "Fighting", "Psychic",
                "Rock", "Ghost", "Ice", "Dragon", "Steel", "Dark", "Flying"
            ])
            .range([
                "#78C850", "#F08030", "#6890F0", "#A8B820", "#A8A878", "#A040A0",
                "#F8D030", "#E0C068", "#EE99AC", "#C03028", "#F85888", "#B8A038",
                "#705898", "#98D8D8", "#7038F8", "#B8B8D0", "#705848", "#A890F0"
            ]);

        this.init();
    }

    init() {
        const self = this;

        self.svg = d3.select(self.config.parent)
            .append('svg')
            .attr('width', self.config.width)
            .attr('height', self.config.height);

        // Add Clip Path to prevent circles from drawing outside axes
        self.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", self.config.width - self.config.margin.left - self.config.margin.right)
            .attr("height", self.config.height - self.config.margin.top - self.config.margin.bottom);

        self.chart = self.svg.append('g')
            .attr('transform', `translate(${self.config.margin.left}, ${self.config.margin.top})`);

        // Group for circles with clip path
        self.circlesGroup = self.chart.append('g')
            .attr("clip-path", "url(#clip)");

        self.innerWidth = self.config.width - self.config.margin.left - self.config.margin.right;
        self.innerHeight = self.config.height - self.config.margin.top - self.config.margin.bottom;

        self.xScale = d3.scaleLinear().range([0, self.innerWidth]);
        self.yScale = d3.scaleLinear().range([self.innerHeight, 0]);

        self.xAxis = d3.axisBottom(self.xScale);
        self.yAxis = d3.axisLeft(self.yScale);

        self.xAxisGroup = self.chart.append('g')
            .attr('transform', `translate(0, ${self.innerHeight})`);

        self.yAxisGroup = self.chart.append('g');

        // Axis Labels
        self.xlabel = self.svg.append('text')
            .attr('x', self.config.width / 2)
            .attr('y', self.config.height - 10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .text(self.config.xlabel);

        self.ylabel = self.svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -self.config.height / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .text(self.config.ylabel);

        // Zoom Behavior
        self.zoom = d3.zoom()
            .scaleExtent([0.5, 20])
            .extent([[0, 0], [self.innerWidth, self.innerHeight]])
            .on("zoom", (event) => self.updateZoom(event));

        self.svg.call(self.zoom);
    }

    update() {
        const self = this;

        // Dynamic Axis Selection
        const xAttr = self.config.xlabel;
        const yAttr = self.config.ylabel;

        // Update Labels
        self.xlabel.text(xAttr);
        self.ylabel.text(yAttr);

        // Update Domains (Use whole dataset 'self.data' for consistent axes scaling)
        self.xScale.domain([0, d3.max(self.data, d => d[xAttr])]).nice();
        self.yScale.domain([0, d3.max(self.data, d => d[yAttr])]).nice();

        // Reset Zoom
        self.svg.transition().duration(750).call(self.zoom.transform, d3.zoomIdentity);

        self.render();
    }

    render() {
        const self = this;
        const xAttr = self.config.xlabel;
        const yAttr = self.config.ylabel;

        // Transition Axes
        self.xAxisGroup.transition().duration(1000).call(self.xAxis);
        self.yAxisGroup.transition().duration(1000).call(self.yAxis);

        // General Update Pattern
        const circles = self.circlesGroup.selectAll('circle')
            .data(self.filteredData, d => d.Name); // Key-based binding

        circles.join(
            enter => enter.append('circle')
                .attr('cx', d => self.xScale(d[xAttr]))
                .attr('cy', d => self.yScale(d[yAttr]))
                .attr('r', 0)
                .attr('fill', d => self.typeColorScale(d['Type 1']))
                .attr('opacity', 0.7)
                .call(enter => enter.transition().duration(1000)
                    .attr('r', 6)
                    .attr('cx', d => self.xScale(d[xAttr]))
                    .attr('cy', d => self.yScale(d[yAttr]))),
            update => update.call(update => update.transition().duration(1000)
                .attr('cx', d => self.xScale(d[xAttr]))
                .attr('cy', d => self.yScale(d[yAttr]))
                .attr('fill', d => self.typeColorScale(d['Type 1']))),
            exit => exit.call(exit => exit.transition().duration(500).attr('r', 0).remove())
        )
            .on('mouseover', (event, d) => {
                // Highlight
                d3.select(event.currentTarget)
                    .transition().duration(200)
                    .attr('r', 10)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2)
                    .attr('opacity', 1);

                // Detailed Tooltip
                d3.select('#tooltip')
                    .style('opacity', 1)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px')
                    .html(`
                    <div class="tooltip-label">${d.Name}</div>
                    <div>Type: <span style="color:${self.typeColorScale(d['Type 1'])}">${d['Type 1']}</span>/${d['Type 2'] || '-'}</div>
                    <hr style="margin: 4px 0; border: 0; border-top: 1px solid #555;">
                    <div>${xAttr}: ${d[xAttr]}</div>
                    <div>${yAttr}: ${d[yAttr]}</div>
                `);

                // Link to Bar Chart
                if (self.linkedView) {
                    self.linkedView.update(d);
                }
            })
            .on('mousemove', (event) => {
                d3.select('#tooltip')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseout', (event, d) => {
                // Un-highlight (return to normal size depends on zoom... wait, r is constant 6)
                d3.select(event.currentTarget)
                    .transition().duration(200)
                    .attr('r', 6)
                    .attr('stroke', 'none')
                    .attr('opacity', 0.7);

                d3.select('#tooltip').style('opacity', 0);

                // Reset Bar Chart
                if (self.linkedView) {
                    self.linkedView.update(null);
                }
            });
    }

    updateZoom(event) {
        const self = this;
        const newXScale = event.transform.rescaleX(self.xScale);
        const newYScale = event.transform.rescaleY(self.yScale);

        self.xAxisGroup.call(self.xAxis.scale(newXScale));
        self.yAxisGroup.call(self.yAxis.scale(newYScale));

        const xAttr = self.config.xlabel;
        const yAttr = self.config.ylabel;

        self.circlesGroup.selectAll('circle')
            .attr('cx', d => newXScale(d[xAttr]))
            .attr('cy', d => newYScale(d[yAttr]));
    }

    filterTypes(activeTypes) {
        this.filteredData = this.data.filter(d => activeTypes.includes(d['Type 1']));
        this.render(); // Simply re-render, update() is for axes/scales
    }
}

class BarChart {
    constructor(config, data) {
        this.config = config;
        this.stats = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        // Initial Color (Default)
        this.defaultColor = "steelblue";

        // Define same color scale to match Scatter Plot
        this.typeColorScale = d3.scaleOrdinal()
            .domain([
                "Grass", "Fire", "Water", "Bug", "Normal", "Poison",
                "Electric", "Ground", "Fairy", "Fighting", "Psychic",
                "Rock", "Ghost", "Ice", "Dragon", "Steel", "Dark", "Flying"
            ])
            .range([
                "#78C850", "#F08030", "#6890F0", "#A8B820", "#A8A878", "#A040A0",
                "#F8D030", "#E0C068", "#EE99AC", "#C03028", "#F85888", "#B8A038",
                "#705898", "#98D8D8", "#7038F8", "#B8B8D0", "#705848", "#A890F0"
            ]);

        this.init();
    }

    init() {
        const self = this;

        self.svg = d3.select(self.config.parent)
            .append('svg')
            .attr('width', self.config.width)
            .attr('height', self.config.height);

        self.chart = self.svg.append('g')
            .attr('transform', `translate(${self.config.margin.left}, ${self.config.margin.top})`);

        self.innerWidth = self.config.width - self.config.margin.left - self.config.margin.right;
        self.innerHeight = self.config.height - self.config.margin.top - self.config.margin.bottom;

        self.xScale = d3.scaleBand()
            .domain(self.stats)
            .range([0, self.innerWidth])
            .padding(0.2);

        self.yScale = d3.scaleLinear()
            .domain([0, 200])
            .range([self.innerHeight, 0]);

        self.xAxis = d3.axisBottom(self.xScale);
        self.yAxis = d3.axisLeft(self.yScale);

        self.xAxisGroup = self.chart.append('g')
            .attr('transform', `translate(0, ${self.innerHeight})`);

        self.yAxisGroup = self.chart.append('g');

        // Y Axis Label
        self.svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -self.config.height / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text(self.config.ylabel);

        // Title
        self.titleLabel = self.svg.append('text')
            .attr('x', self.config.width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '16px')
            .text("Please hover your cursor");

        self.xAxisGroup.call(self.xAxis);
        self.yAxisGroup.call(self.yAxis);
    }

    update(pokemon) {
        const self = this;
        let chartData = [];
        let barColor = self.defaultColor;

        if (pokemon) {
            self.titleLabel.text(`${pokemon.Name}`);
            chartData = self.stats.map(stat => ({
                label: stat,
                value: pokemon[stat]
            }));
            // Match color to Pokemon Type
            barColor = self.typeColorScale(pokemon['Type 1']);
        } else {
            self.titleLabel.text("Please hover your cursor");
            chartData = self.stats.map(stat => ({
                label: stat,
                value: 0
            }));
        }

        // Draw Bars
        const bars = self.chart.selectAll('rect')
            .data(chartData, d => d.label); // Key by stat name

        bars.join(
            enter => enter.append('rect')
                .attr('x', d => self.xScale(d.label))
                .attr('y', self.innerHeight)
                .attr('width', self.xScale.bandwidth())
                .attr('height', 0)
                .attr('fill', barColor)
                .call(enter => enter.transition().duration(500)
                    .attr('y', d => self.yScale(d.value))
                    .attr('height', d => self.innerHeight - self.yScale(d.value))),
            update => update.call(update => update.transition().duration(500)
                .attr('fill', barColor) // Animate color change too
                .attr('y', d => self.yScale(d.value))
                .attr('height', d => self.innerHeight - self.yScale(d.value))),
            exit => exit.remove()
        );
    }
}
