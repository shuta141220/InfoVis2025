d3.csv("https://shuta141220.github.io/InfoVis2025/W08/w08_task3.csv")
    .then(data => {
        data.forEach(d => {
            d.value = +d.value;
        });

        const config = {
            parent: "#drawing_region",
            width: 256,
            height: 256
        };

        const pie_chart = new PieChart(config, data);
        pie_chart.update();
    })
    .catch(error => {
        console.error(error);
    });


class PieChart {
    constructor(config, data) {
        this.config = {
            parent: config.parent,
            width: config.width,
            height: config.height,
        };
        this.data = data;
        this.init();
    }

    init() {
        const self = this;

        self.radius = Math.min(self.config.width, self.config.height) / 2;

        // SVG
        self.svg = d3.select(self.config.parent)
            .attr("width", self.config.width)
            .attr("height", self.config.height)
            .append("g")
            .attr("transform",
                `translate(${self.config.width / 2}, ${self.config.height / 2})`);

        self.color = d3.scaleOrdinal(d3.schemeSet3);

        self.pie = d3.pie().value(d => d.value);

        self.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(self.radius);
    }

    update() {
        this.render();
    }

    render() {
        const self = this;

        const pie_data = self.pie(self.data);

        self.svg.selectAll("path")
            .data(pie_data)
            .enter()
            .append("path")
            .attr("d", self.arc)
            .attr("fill", d => self.color(d.data.label))
            .attr("stroke", "black")
            .style("stroke-width", "1px");
    }
}