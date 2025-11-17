d3.csv("https://shuta141220.github.io/InfoVis2025/W06/Task1.csv")
    .then(data => {
        data.forEach(d => {
            d.x = +d.x;
            d.y = +d.y;
            d.r = +d.r;
        });

        const config = {
            parent: '#drawing_region',
            width: 300,
            height: 300,
            margin: {top:20, right:20, bottom:40, left:40}
        };

        const scatter_plot = new ScatterPlot(config, data);
        scatter_plot.update();
    })
    .catch(error => {
        console.error(error);
    });

class ScatterPlot {
    constructor(config, data) {
        this.config = config;
        this.data = data;
        this.init();
    }

    init() {
        const self = this;
        const cfg = self.config;

        self.svg = d3.select(cfg.parent)
            .attr("width", cfg.width)
            .attr("height", cfg.height);

        self.chart = self.svg.append("g")
            .attr("transform", `translate(${cfg.margin.left},${cfg.margin.top})`);

        self.inner_width  = cfg.width  - cfg.margin.left - cfg.margin.right;
        self.inner_height = cfg.height - cfg.margin.top  - cfg.margin.bottom;

        self.xscale = d3.scaleLinear().range([0, self.inner_width]);
        self.yscale = d3.scaleLinear().range([self.inner_height, 0]);

        self.xaxis = d3.axisBottom(self.xscale).ticks(5);
        self.yaxis = d3.axisLeft(self.yscale).ticks(5);

        self.xaxis_group = self.chart.append("g")
            .attr("transform", `translate(0,${self.inner_height})`);

        self.yaxis_group = self.chart.append("g");
    }

    update() {
        const self = this;

        self.xscale.domain([
            d3.min(self.data, d => d.x),
            d3.max(self.data, d => d.x)
        ]);

        self.yscale.domain([
            d3.min(self.data, d => d.y),
            d3.max(self.data, d => d.y)
        ]);

        self.render();
    }

    render() {
        const self = this;

        self.chart.selectAll("circle")
            .data(self.data)
            .enter()
            .append("circle")
            .attr("cx", d => self.xscale(d.x))
            .attr("cy", d => self.yscale(d.y))
            .attr("r", d => d.r)
            .attr("fill", "black");

        self.xaxis_group.call(self.xaxis);
        self.yaxis_group.call(self.yaxis);
    }
}