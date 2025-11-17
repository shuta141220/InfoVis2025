d3.csv("https://shuta141220.github.io/InfoVis2025/W06/Task1.csv")
    .then(data => {
        data.forEach(d => {
            d.x = +d.x;
            d.y = +d.y;
            d.r = +d.r;
            d.c = d.c; 
        });
        ShowScatterPlot(data);
    })
    .catch(error => {
        console.error(error);
    });

function ShowScatterPlot(data) {
    const width = 400;
    const height = 400;
    const margin = {top: 20, right: 20, bottom: 20, left: 20};

    const svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xscale = d3.scaleLinear()
        .domain([d3.min(data, d => d.x), d3.max(data, d => d.x)])
        .range([0, innerWidth]);

    const yscale = d3.scaleLinear()
        .domain([d3.min(data, d => d.y), d3.max(data, d => d.y)])
        .range([innerHeight, 0]); 

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xscale(d.x))
        .attr("cy", d => yscale(d.y))
        .attr("r", d => d.r)     
        .attr("fill", d => d.c); 
}