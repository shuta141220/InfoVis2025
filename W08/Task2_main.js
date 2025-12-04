d3.csv("https://shuta141220.github.io/InfoVis2025/W08/w08_task2.csv")
    .then(data => {
        data.forEach(d => {
            d.x = +d.x;
            d.y = +d.y;
        });

        const config = {
            parent: '#drawing_region',
            width: 256,
            height: 128,
            margin: { top: 20, right: 20, bottom: 20, left: 30 }
        };

        const line_chart = new LineChart(config, data);
        line_chart.update();
    })
    .catch(error => {
        console.error(error);
    });

class LineChart {
    constructor(config, data) {
        this.config = {
            parent: config.parent,
            width: config.width,
            height: config.height,
            margin: config.margin
        };
        this.data = data;
        this.init();
    }

    init() {
        const self = this;

        self.svg = d3.select(self.config.parent)
            .attr("width", self.config.width)
            .attr("height", self.config.height);

        self.chart = self.svg.append("g")
            .attr("transform", `translate(${self.config.margin.left}, ${self.config.margin.top})`);

        self.inner_width = self.config.width - self.config.margin.left - self.config.margin.right;
        self.inner_height = self.config.height - self.config.margin.top - self.config.margin.bottom;

        self.xscale = d3.scaleLinear()
            .range([0, self.inner_width]);

        self.yscale = d3.scaleLinear()
            .range([self.inner_height, 0]);

        self.xaxis = d3.axisBottom(self.xscale).ticks(5).tickSizeOuter(0);
        self.yaxis = d3.axisLeft(self.yscale).ticks(5).tickSizeOuter(0);

        self.xaxis.tickFormat('');
        self.yaxis.tickFormat('');

        self.line = d3.line()
            .x(d => self.xscale(d.x))
            .y(d => self.yscale(d.y));

        self.area = d3.area()
            .x(d => self.xscale(d.x))
            .y1(d => self.yscale(d.y))
            .y0(self.inner_height);
    }

    update() {
        const self = this;

        const x_extent = d3.extent(self.data, d => d.x);
        const y_extent = d3.extent(self.data, d => d.y);

        self.xscale.domain(x_extent);
        self.yscale.domain(y_extent);

        self.render();
    }

    render() {
        const self = this;

        self.chart.append("path")
            .datum(self.data)
            .attr("d", self.area)
            .attr("fill", "rgba(255,0,0,0.3)")
            .attr("stroke", "none");

        self.chart.append("path")
            .datum(self.data)
            .attr("d", self.line)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5);

        self.chart.selectAll("circle")
            .data(self.data)
            .enter()
            .append("circle")
            .attr("cx", d => self.xscale(d.x))
            .attr("cy", d => self.yscale(d.y))
            .attr("r", 3)
            .attr("fill", "black");

        self.xaxis_group.call(self.xaxis);
        self.yaxis_group.call(self.yaxis);
    }
}