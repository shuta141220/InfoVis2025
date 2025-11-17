d3.csv("https://shuta141220.github.io/InfoVis2025/W06/Task1.csv")
    .then(data => {
        data.forEach(d => {
            d.x = +d.x;
            d.y = +d.y;
            d.r = +d.r;
        });

        ShowScatterPlot(data);
    })
    .catch(error => {
        console.error(error);
    });

function ShowScatterPlot(data) {
    const width = 256;
    const height = 256;

    const svg = d3.select("#drawing_region")
        .attr("width", width)
        .attr("height", height);

    const xscale = d3.scaleLinear()
        .domain([d3.min(data, d => d.x), d3.max(data, d => d.x)])
        .range([0, width]);

    const yscale = d3.scaleLinear()
        .domain([d3.min(data, d => d.y), d3.max(data, d => d.y)])
        .range([height, 0]); 

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xscale(d.x))
        .attr("cy", d => yscale(d.y))
        .attr("r", d => d.r)
        .attr("fill", "black");
}